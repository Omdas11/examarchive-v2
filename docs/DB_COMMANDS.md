# ExamArchive — Database Commands Reference

> Comprehensive SQL reference for managing users, roles, XP, and system data.

---

## 🔹 Role & XP Management

### Promote User (Set XP)
XP determines level automatically via trigger.

```sql
UPDATE roles SET xp = 3000 WHERE user_id = 'uuid-here';
```

### Assign Custom Role Title
```sql
UPDATE roles SET primary_role = 'Senior Moderator' WHERE user_id = 'uuid-here';
```

### Reset XP
```sql
UPDATE roles SET xp = 0 WHERE user_id = 'uuid-here';
```

### View All Roles (sorted by XP)
```sql
SELECT * FROM roles ORDER BY xp DESC;
```

### View User Role Details
```sql
SELECT r.*, au.email
FROM roles r
JOIN auth.users au ON au.id = r.user_id
WHERE r.user_id = 'uuid-here';
```

### Set Username
```sql
UPDATE roles SET username = 'myusername' WHERE user_id = 'uuid-here';
```

---

## 🔹 XP Level Reference

| Level | XP Required | Role Title       |
|-------|-------------|------------------|
| 0     | 0           | Visitor          |
| 5     | 100         | Explorer         |
| 10    | 300         | Contributor      |
| 25    | 800         | Reviewer         |
| 50    | 1,500       | Senior Moderator |
| 90    | 3,000       | Admin            |
| 100   | 5,000       | Founder          |

---

## 🔹 XP Earning Actions

| Action            | XP Earned |
|-------------------|-----------|
| Upload paper      | +50       |
| Paper approved    | +100      |
| RQ contribution   | +40       |
| Notes upload      | +30       |
| Daily login streak| +5        |

---

## 🔹 Vote Management

### Remove a User's Vote
```sql
DELETE FROM paper_request_votes WHERE user_id = 'uuid-here';
```

### Remove Specific Vote
```sql
DELETE FROM paper_request_votes
WHERE user_id = 'uuid-here' AND request_id = 'request-uuid-here';
```

### View All Votes
```sql
SELECT v.*, pr.paper_code, pr.year
FROM paper_request_votes v
JOIN paper_requests pr ON pr.id = v.request_id
ORDER BY v.created_at DESC;
```

---

## 🔹 Submissions Management

### View All Submissions
```sql
SELECT * FROM submissions ORDER BY created_at DESC;
```

### View Published Papers
```sql
SELECT * FROM submissions WHERE status = 'published' ORDER BY published_at DESC;
```

### Count Uploads Per User
```sql
SELECT user_id, COUNT(*) AS total_uploads,
       COUNT(*) FILTER (WHERE status IN ('approved', 'published')) AS approved
FROM submissions
GROUP BY user_id
ORDER BY total_uploads DESC;
```

---

## 🔹 Achievements

### View User Achievements
```sql
SELECT * FROM achievements WHERE user_id = 'uuid-here';
```

### Award Achievement Manually
```sql
INSERT INTO achievements (user_id, badge_type)
VALUES ('uuid-here', 'first_upload')
ON CONFLICT DO NOTHING;
```

### Available Achievement Types
- `first_upload` — First paper uploaded
- `10_uploads` — 10 papers uploaded
- `first_review` — First paper reviewed
- `first_publish` — First paper published
- `early_user` — Early adopter

---

## 🔹 Paper Requests

### View Open Requests
```sql
SELECT * FROM paper_requests WHERE status = 'open' ORDER BY votes DESC;
```

### Fulfill a Request
```sql
UPDATE paper_requests SET status = 'fulfilled' WHERE id = 'request-uuid-here';
```

---

## 🔹 System Functions (RPCs)

### Get User XP Info
```sql
SELECT * FROM get_user_xp_info('uuid-here');
```

### Get Upload Stats
```sql
SELECT * FROM get_user_upload_stats('uuid-here');
```

### Calculate Level from XP
```sql
SELECT calculate_level_from_xp(1500); -- Returns 50
```

### Get Role Title from XP
```sql
SELECT get_role_title_from_xp(3000); -- Returns 'Admin'
```

### Add XP to User
```sql
SELECT * FROM add_user_xp('uuid-here', 100);
```

---

## 🔹 Storage Bucket Structure

```
/question-papers/{paper_code}/{year}/{filename}.pdf
/notes/{subject_code}/notes.pdf
/resources/{subject_code}/resource.pdf
```

---

## 🔹 Danger Zone

### Delete User Role
```sql
DELETE FROM roles WHERE user_id = 'uuid-here';
```

### Reset All XP (CAUTION)
```sql
UPDATE roles SET xp = 0, level = 0;
```

### Delete All Demo Data
```sql
DELETE FROM submissions WHERE paper_code LIKE 'DEMO-%';
DELETE FROM approved_papers WHERE is_demo = true;
```
