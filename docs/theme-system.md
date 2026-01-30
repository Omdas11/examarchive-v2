# Theme System Documentation

## Overview

ExamArchive v2 features a comprehensive theme system with background-based theming, night mode, and customizable UI preferences.

## Theme Architecture

### Theme Presets (8 Total)

Each preset defines a complete visual identity:
- Background colors (`--bg`, `--bg-soft`)
- Card/surface colors (`--surface`)
- Text colors (`--text`, `--text-muted`)
- Border colors (`--border`)
- Harmonized accent color (`--accent`, `--accent-soft`)

#### Available Presets

1. **Red Classic** - Default ExamArchive look with red accents
2. **Blue Slate** - Cool professional blue theme
3. **Green Mint** - Fresh and natural green theme
4. **Purple Nebula** - Deep cosmic purple theme
5. **Amber Warm** - Warm and inviting amber theme
6. **Mono Gray** - Minimal grayscale theme
7. **Glass Light** - Transparent light with backdrop blur
8. **Glass Dark** - Transparent dark with backdrop blur

### Theme Modes

Independent brightness control:
- **Auto** - Follows system preference
- **Light** - Force light mode
- **Dark** - Force dark mode
- **AMOLED** - Pure black for OLED screens

### Night Mode

Warm filter system independent of theme:
- Reduces blue light
- Adjustable warmth/intensity (0-100%)
- Applied via CSS filter
- Works with any theme preset or mode

## Implementation

### CSS Variables

All themes use CSS custom properties:

```css
:root {
  --bg: /* Background color */
  --bg-soft: /* Soft background */
  --surface: /* Card/surface color */
  --text: /* Primary text */
  --text-muted: /* Secondary text */
  --border: /* Border color */
  --accent: /* Accent/brand color */
  --accent-soft: /* Soft accent background */
}
```

### Applying Themes

Themes are applied via body attributes:

```html
<body 
  data-theme-preset="blue-slate" 
  data-theme="dark"
  data-night="on"
>
```

### JavaScript API

```javascript
// Apply theme preset
localStorage.setItem("theme-preset", "blue-slate");
document.body.setAttribute("data-theme-preset", "blue-slate");

// Apply theme mode
localStorage.setItem("theme-mode", "dark");
document.body.setAttribute("data-theme", "dark");

// Enable night mode
localStorage.setItem("night", "on");
document.body.setAttribute("data-night", "on");
```

## Accent Colors (Legacy)

For backward compatibility, individual accent colors can be selected:
- Red
- Blue
- Green
- Purple
- Amber
- Mono

These override the theme preset's default accent but should generally use theme presets for better visual harmony.

## Glass UI

Optional glassmorphism effects:
- Enabled via Settings
- Adjustable blur intensity (0-30px)
- Adjustable opacity (0-30%)
- Adjustable shadow softness (0-50%)
- Works best with Glass Light/Dark presets

## Best Practices

1. Use theme presets for coordinated looks
2. Test themes in both light and dark modes
3. Ensure sufficient contrast for accessibility
4. Use `var(--accent)` instead of hardcoded colors
5. Glass effects should enhance, not obscure content
