# UI Guidelines

## Design Principles

1. **Clarity** - Clear visual hierarchy and readable typography
2. **Consistency** - Unified design language across all pages
3. **Accessibility** - WCAG 2.1 AA compliance minimum
4. **Performance** - Minimal CSS, optimized for mobile
5. **Flexibility** - Themeable and customizable

## Color System

### CSS Variables

Always use CSS custom properties:

```css
/* Colors */
--bg              /* Page background */
--bg-soft         /* Soft background (cards) */
--surface         /* Surface/card color */
--text            /* Primary text */
--text-muted      /* Secondary text */
--border          /* Border color */
--accent          /* Brand/accent color */
--accent-soft     /* Soft accent background */
```

### Never Use

❌ Hardcoded colors: `color: #d32f2f;`
✅ Use variables: `color: var(--accent);`

### Accent Color Usage

The `--accent` variable should be used for:
- Primary buttons
- Active navigation links
- Toggle switches (checked state)
- Focus rings
- Slider thumbs
- Icon highlights
- Badge backgrounds
- Links on hover

## Typography

### Font Stacks

```css
/* Default */
font-family: system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

/* Serif */
font-family: Georgia, 'Times New Roman', Times, serif;

/* Monospace */
font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono',
             Consolas, 'Courier New', monospace;
```

### Hierarchy

- `h1`: 1.4rem (mobile) - 1.5rem (desktop)
- `h2`: 1.1rem
- Body: 0.9rem (most UI text)
- Small: 0.85rem (descriptions, captions)

### Line Height

- Body text: 1.6
- Headings: 1.2

## Spacing

Use consistent spacing scale:
- `0.25rem` (4px) - Tight
- `0.5rem` (8px) - Small gap
- `0.75rem` (12px) - Medium gap
- `1rem` (16px) - Standard gap
- `1.5rem` (24px) - Large gap
- `2rem` (32px) - Section spacing

### Mobile Considerations

Increase tap targets on mobile:
- Minimum 44x44px for interactive elements
- Increase spacing between touch targets
- Adjust header padding for comfort

## Border Radius

```css
--radius-sm: 6px   /* Small elements */
--radius-md: 10px  /* Cards, inputs */
--radius-lg: 14px  /* Large cards */
```

Pills/buttons: `border-radius: 999px`

## Shadows

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08)
--shadow-md: 0 4px 10px rgba(0,0,0,0.08)
```

Dark theme adjusts opacity automatically.

## Buttons

### Variants

```css
.btn              /* Default button */
.btn-primary      /* Primary action (uses accent) */
.btn-outline      /* Outline style */
.btn-outline-red  /* Destructive action */
.btn-glass        /* Glassmorphism style */
```

### States

- Default: Subtle border and background
- Hover: Slight background change
- Active: Scale down (0.97)
- Focus: 2px accent outline with offset

### Do's and Don'ts

✅ Use `btn-primary` for main actions
✅ Use `btn-outline-red` for destructive actions (sign out, delete)
❌ Don't use multiple primary buttons in same context
❌ Don't override button colors directly

## Cards

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
}
```

Hover: Elevate shadow
Focus: Accent border

## Glass UI

Optional glassmorphism effects:

```css
body.glass-enabled .card {
  background: rgba(255, 255, 255, var(--glass-opacity));
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: enhanced shadow with inset highlights
}
```

Use sparingly - not all surfaces should be glass.

## Hamburger Menu Icon

Two parallel bars morphing to X:

```html
<svg class="hamburger-icon" viewBox="0 0 24 24">
  <line x1="4" y1="8" x2="20" y2="8" />
  <line x1="4" y1="16" x2="20" y2="16" />
</svg>
```

Animation:
- Bar 1: translateY(4px) rotate(45deg)
- Bar 2: translateY(-4px) rotate(-45deg)

## Responsive Design

### Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1023px  
- Desktop: ≥ 1024px

### Mobile-First

Write mobile styles first, add desktop enhancements:

```css
.element {
  /* Mobile styles */
  padding: 0.75rem;
}

@media (min-width: 768px) {
  .element {
    /* Desktop enhancements */
    padding: 1.5rem;
  }
}
```

## Accessibility

### Focus States

All interactive elements must have visible focus:

```css
.btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Color Contrast

- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Test with high contrast mode

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
```

Also controlled via Settings → Accessibility → Reduced Motion

### Screen Readers

Use semantic HTML:
- `<button>` for actions
- `<a>` for navigation
- Proper heading hierarchy
- ARIA labels where needed

```html
<button aria-label="Close menu">×</button>
```

## Performance

### CSS Best Practices

- Keep selectors simple
- Avoid deep nesting (max 3 levels)
- Use classes over element selectors
- Minimize use of `!important`

### Loading Order

1. common.css (foundation)
2. Component CSS (header, footer, etc.)
3. Page-specific CSS

### File Size

Keep CSS files under 50KB uncompressed where possible.

## Dark Mode

Always test in both light and dark themes:
- Use semantic CSS variables
- Avoid assumptions about background color
- Test contrast ratios in both modes
