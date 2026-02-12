# Calendar System

> Phase 1 — Month/Week View with Local Timezone

## Data Format

Calendar data lives in `data/calendar/assam-2026.json`:

```json
{
  "year": 2026,
  "categories": {
    "gazetted": [
      { "date": "2026-01-26", "title": "Republic Day" }
    ],
    "restricted": [
      { "date": "2026-02-26", "title": "Maha Shivaratri" }
    ],
    "other": [
      { "date": "2026-02-01", "title": "Spring Semester Registration Begins" }
    ]
  }
}
```

## Views

### Month View (Default)

- 7-column grid with day headers
- Colored dots indicate events by category
- Click a day to see event details
- Category colors: Gazetted (red), Restricted (blue), Academic (green)

### Week View

- Horizontal scrollable layout (7 columns)
- Each day shows full event cards
- Swipe-friendly on mobile

Toggle between views using the Month/Week buttons below the navigation.

## Date Parsing

Dates are parsed using `parseLocalDate()` to avoid UTC timezone shift:

```js
function parseLocalDate(dateStr) {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}
```

This ensures "2026-01-26" always renders as January 26 regardless of timezone.

## Category Filters

Toggle buttons filter which categories are visible: All, Gazetted, Restricted, Academic.

## Adding New Calendars

1. Create a new JSON file in `data/calendar/` (e.g., `assam-2027.json`)
2. Follow the schema: `year`, `categories` with arrays of `{ date, title }`
3. Update `js/notices-calendar.js` fetch URL to reference the new file
