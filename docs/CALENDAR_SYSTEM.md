# Calendar System

## Data Format

Calendar data lives in `data/calendar/assam-2026.json`:

```json
{
  "year": 2026,
  "categories": {
    "gazetted": [
      { "date": "2026-01-26", "name": "Republic Day" }
    ],
    "restricted": [
      { "date": "2026-03-14", "name": "Holi" }
    ],
    "other": [
      { "date": "2026-04-15", "name": "Bohag Bihu" }
    ]
  }
}
```

## Home Page Calendar

- Month-view grid rendered on `index.html`
- Each day cell shows colored dots for holidays in that day
- Dot colors correspond to categories:
  - **Gazetted** — one color
  - **Restricted** — another color
  - **Other** — third color

## Interactions

- **Category toggle:** Filter which categories are visible using toggle buttons
- **Click day:** Opens a detail view showing event names for that day

## Admin Page

**Page:** `/admin/calendar.html`

Features:

- **PDF upload stub** — Placeholder for future PDF-to-JSON extraction
- **URL paste stub** — Placeholder for future URL-based import
- **JSON editor** — Direct edit of the calendar JSON data

## Adding New Calendars

1. Create a new JSON file in `data/calendar/` (e.g., `assam-2027.json`)
2. Follow the same schema: `year`, `categories` with arrays of `{ date, name }`
3. Update the frontend to reference the new file
