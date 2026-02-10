# Admin Approval Flow

> Nothing is visible without admin approval. The admin dashboard is the single authority.

---

## Principle

**Admin approval is the gate between upload and visibility.**

- Users upload papers → status: `pending`
- Admin reviews → approves or rejects
- Only `published` papers appear on the browse page
- No exceptions. No bypasses.

---

## Submission States

| State | Meaning | Visible to Public |
|-------|---------|-------------------|
| `pending` | Awaiting admin review | No |
| `approved` | Admin approved, awaiting publish | No |
| `rejected` | Admin rejected | No |
| `published` | Live and downloadable | Yes |

---

## Admin Dashboard

**Location:** `admin/dashboard.html`

**Access:** Restricted to users with `admin` or `reviewer` roles (verified via backend RPC).

**Capabilities:**
- View all pending submissions
- Preview uploaded PDFs
- Approve or reject with notes
- Move files between storage buckets
- Publish approved papers

---

## Browse Page Honesty

The browse page MUST:
- Show "No papers available yet" when no approved papers exist
- Never show fake or placeholder cards
- Only display papers that have been through the approval pipeline
- Static papers from `papers.json` (legacy PDFs) are clearly labeled as such

---

## Authority Chain

```
User uploads PDF
  → uploads-temp bucket (private)
  → submissions table (status: pending)

Admin reviews
  → Approves: file moves to uploads-approved
  → Rejects: file stays in temp, user notified

Admin publishes
  → File moves to uploads-public
  → submissions table (status: published)
  → Paper appears on browse page
```

---

## Key Rule

**The admin dashboard is the ONLY way content becomes public.** No automated publishing. No AI publishing. No user self-publishing.
