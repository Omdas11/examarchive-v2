# Settings Documentation

## Overview

The Settings page provides comprehensive customization options for ExamArchive's appearance and behavior.

## Settings Categories

### 1. Theme

**Theme Preset**
- Visual identity with coordinated backgrounds, cards, and accents
- 8 presets available (see theme-system.md)
- Changes apply immediately

**Theme Mode**
- Auto: Follows system preference
- Light: Force light mode
- Dark: Force dark mode  
- AMOLED: Pure black for OLED displays
- Overrides the base preset's brightness

### 2. Night Mode

**Enable Night Mode**
- Independent warm filter
- Reduces blue light
- Works with any theme

**Night Mode Strength**
- Adjustable intensity (0-100%)
- Controls warmth and filter strength
- Higher = warmer/dimmer

### 3. Accent Color (Legacy)

Fine-tune accent colors independent of presets:
- Red, Blue, Green, Purple, Amber, Mono
- Affects buttons, links, active states, focus rings
- Preview changes live
- Click "Apply Changes" to persist

### 4. Font

**Font Family**
- Archive Default: System UI fonts
- System Default: OS native fonts
- Serif: Georgia, Times
- Sans-serif: Helvetica, Arial
- Monospace: SF Mono, Consolas

**Preview**: Changes preview immediately on select
**Apply**: Click "Apply Changes" to persist

### 5. Glass UI Effects

**Enable Glass Effect**
- Toggle glassmorphism on/off
- Affects cards, header, popups

**Blur Intensity** (0-30px)
- Controls backdrop blur strength
- Higher = more blur

**Transparency** (0-30%)
- Controls surface opacity
- Higher = more transparent

**Shadow Softness** (0-50%)
- Adjusts shadow intensity
- Higher = softer shadows

### 6. Accessibility

**High Contrast**
- Increases contrast ratios
- Better readability for vision impairments
- Forces strong borders and text

**Reduced Motion**
- Disables animations and transitions
- Better for motion sensitivity
- Respects system preferences

### 7. Account

**Account Information**
- Displays name and email when signed in
- "Not signed in" when logged out

**Sign Out**
- Safely ends session
- Preserves theme preferences

## Usage

### Preview vs Apply

Some settings preview changes immediately:
- Theme presets
- Theme modes  
- Night mode
- Glass effects
- Accessibility

Others require clicking "Apply Changes":
- Accent colors
- Fonts

This prevents accidental changes while exploring options.

### Persistence

All settings are stored in localStorage:
- Survives page reloads
- Independent per browser/device
- Not synced across devices (future feature)

## Technical Notes

Settings are rendered dynamically from a configuration object in `js/settings.js`:

```javascript
const settingsConfig = [
  {
    id: "theme-section",
    title: "Theme",
    settings: [...]
  }
]
```

Each setting has a type:
- `theme-preset-grid`: Theme preset cards
- `theme-pills`: Pill-style buttons
- `accent-pills`: Color selector pills
- `toggle`: On/off switch
- `range`: Slider control
- `select`: Dropdown menu
- `button`: Action button
- `account-info`: User info display

## Accessibility

- All controls have proper labels
- Keyboard navigation supported
- ARIA attributes for screen readers
- High contrast and reduced motion options
- Touch targets meet WCAG standards (44px minimum on mobile)
