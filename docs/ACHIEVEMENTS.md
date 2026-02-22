# Achievement System

> Achievements are **cosmetic only**. They do NOT grant permissions.  
> See [docs/roles.md](roles.md) for the full role architecture.

## Separation from Roles

| System | Storage | Source | Grants Permissions? |
|--------|---------|--------|---------------------|
| Permission Role | `roles.primary_role` | Manual assignment | ✅ YES |
| Functional Roles | `roles.custom_badges[]` | Manual assignment | ❌ NO |
| **Achievement Badges** | **`achievements` table** | **Auto-earned** | **❌ NO** |

Achievements are stored in a **separate table** from roles and are **never** used for authorization checks.

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

### Upload Milestones
| Badge Type | Display Name | Trigger | Icon |
|------------|-------------|---------|------|
| `first_upload` | First Upload | First paper submission | 📤 |
| `10_uploads` | 10 Uploads | 10 paper submissions | 🏆 |
| `100_uploads` | 100 Uploads | 100 paper submissions | 💎 |

### Review Milestones
| Badge Type | Display Name | Trigger | Icon |
|------------|-------------|---------|------|
| `first_review` | First Review | First submission review | 📝 |
| `first_publish` | First Publish | First paper published | 🌐 |

### Streak Milestones
| Badge Type | Display Name | Trigger | Icon |
|------------|-------------|---------|------|
| `7_day_streak` | 7-Day Streak | 7 consecutive daily logins | 🔥 |
| `30_day_streak` | 30-Day Streak | 30 consecutive daily logins | ⚡ |

### Quality Milestones
| Badge Type | Display Name | Trigger | Icon |
|------------|-------------|---------|------|
| `approval_90` | 90% Approval | 90%+ approval rate (min 10 uploads) | ✅ |
| `top_contributor` | Top Contributor | Monthly top uploader | 🥇 |

### Special
| Badge Type | Display Name | Trigger | Icon |
|------------|-------------|---------|------|
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
  <span class="achievement-pill">🔥 7-Day Streak</span>
</section>
```

The section is inserted after the badges section and only shown when the user has achievements.

## Security

- RLS enabled: users can view their own achievements
- Admins (via primary_role) can view all achievements
- `award_achievement()` is SECURITY DEFINER — runs with elevated privileges for idempotent inserts
- Achievements **never** affect `primary_role` or system permissions
