# Deployment

## GitHub Pages

ExamArchive is deployed as a static site via GitHub Pages. No build step is required.

### Setup

1. Go to repository **Settings → Pages**
2. Set source to the `main` branch (root directory)
3. Save — GitHub Pages will serve the site automatically

### Custom Domain

If using a custom domain, add a `CNAME` file in the repository root with your domain name.

## Supabase Configuration

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API

### 2. Update Frontend Config

Edit `js/supabase.js` with your project credentials:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 3. Run SQL Scripts

In the Supabase SQL Editor, run these scripts **in order**:

1. `admin/sql/01_profiles_table.sql`
2. `admin/sql/02_submissions_table.sql`
3. `admin/sql/03_storage_buckets.sql`
4. `admin/sql/04_storage_policies.sql`
5. `admin/sql/05_roles_system.sql`
6. `admin/sql/06_approved_papers.sql`
7. `admin/sql/07_add_approved_path_column.sql`

### 4. Configure Auth

1. Go to Supabase **Authentication → Providers**
2. Enable **Google** provider
3. Add your Google OAuth Client ID and Secret
4. Set the redirect URL to your site URL

### 5. Verify Storage Buckets

After running SQL scripts, verify in Supabase **Storage**:

- `uploads-temp` bucket exists (private)
- `uploads-approved` bucket exists (public)

## Running Locally

```bash
# Clone the repository
git clone https://github.com/your-org/examarchive-v2.git
cd examarchive-v2

# Serve with any static file server
python -m http.server 8000
# or
npx serve .

# Open in browser
open http://localhost:8000
```

### Local Development Notes

- No `npm install` required for the frontend (dependencies loaded via CDN)
- Update `js/supabase.js` with your Supabase project URL and anon key
- Google OAuth requires the redirect URL to match your local server (e.g., `http://localhost:8000`)
- The debug panel is force-enabled by default for development

## Environment Variables

There are no environment variables. Configuration is stored in `js/supabase.js`:

| Setting | Location | Description |
|---|---|---|
| `SUPABASE_URL` | `js/supabase.js` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `js/supabase.js` | Supabase anonymous API key |
