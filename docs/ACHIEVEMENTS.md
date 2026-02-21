# Achievement System

## Overview

ExamArchive awards achievements automatically based on user actions. Achievements are displayed as pills in the profile panel.

## Database Schema

```sql
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  badge_type text NOT NULL,
  awarded_at timestamptz DEFAULT now()
);
```

## Achievement Types

| Badge Type | Display Name | Trigger | Icon |
|------------|-------------|---------|------|
| `first_upload` | First Upload | User submits their first paper | 📤 |
| `10_uploads` | 10 Uploads | User reaches 10 submissions | 🏆 |
| `first_review` | First Review | User reviews their first submission | 📝 |
| `first_publish` | First Publish | User publishes their first paper | 🌐 |
| `early_user` | Early Adopter | Among the first 10 registered users | 🌟 |

## Auto-Award Mechanism

### Upload Achievements
A database trigger (`trigger_auto_promote_contributor`) fires on every `INSERT` into the `submissions` table:

1. If user's role level < 20, promotes to Contributor (level 20)
2. Awards `first_upload` achievement (idempotent — skips if already awarded)
3. Checks upload count; if ≥ 10, awards `10_uploads`

### RPC Functions

```sql
-- Award achievement (idempotent - returns false if already awarded)
award_achievement(target_user_id uuid, achievement_type text) → boolean

-- Get user's achievements
get_user_achievements(target_user_id uuid) → TABLE(badge_type, awarded_at)
```

## Frontend Display

Achievements are rendered in the profile panel (`js/profile-panel.js`) as small pills:

```html
<section class="profile-achievements">
  <h4>Achievements</h4>
  <span class="achievement-pill">📤 First Upload</span>
  <span class="achievement-pill">🏆 10 Uploads</span>
</section>
```

The section is inserted after the badges section and only shown when the user has achievements.

## Security

- RLS enabled: users can view their own achievements
- Admins (level ≥75) can view all achievements
- Users can insert their own achievements
- `award_achievement()` is SECURITY DEFINER — runs with elevated privileges for idempotent inserts
