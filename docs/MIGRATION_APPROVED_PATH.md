# Database Migration: Add approved_path Column

## Issue
The `submissions` table was missing the `approved_path` column, which is used to track where demo papers and approved papers are stored in the `uploads-approved` bucket.

## Fix
Run the migration script in Supabase SQL Editor:

```sql
-- Add approved_path column if it doesn't exist
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS approved_path text;
```

Or execute the file:
```bash
psql $DATABASE_URL < admin/sql/07_add_approved_path_column.sql
```

## Files Updated
- `admin/sql/02_submissions_table.sql` - Updated schema
- `admin/sql/07_add_approved_path_column.sql` - Migration script

## Impact
- Submissions will now properly track the approved file path
- Demo papers will insert successfully
- Admin dashboard will display correctly
