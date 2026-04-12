# Design System

The aesthetic is "Apple Store luxury" — generous spacing, deep blacks,
restrained accent use, pill-shaped interactive elements. Dark mode is the
default; light mode exists behind a toggle but is not the canonical look.

## Colors

| Token | Hex | Use |
|---|---|---|
| Background | `#000000` | Page background, default everywhere |
| Accent Rose | `#FF2D55` | Primary accent — CTAs, active states, emphasis |
| Accent Gold | `#C9A84C` | Secondary accent — used sparingly, for premium feel |
| Text | white / high-contrast | Body text on black |

Two accents. Not three. If a component feels like it needs a third color,
the component is doing too much — not the palette failing.

## Glass effect

```css
backdrop-filter: blur(24px);
background: rgba(255, 255, 255, 0.04);
border: 1px solid rgba(255, 255, 255, 0.08);
```

Used on cards, modals, drawers, and anything elevated off the black
background. Do not stack glass on glass — one glass layer per visual
depth. Nested glass looks muddy.

## Spacing

Apple Store generous. When in doubt, add more padding, not less. Default
card padding should feel almost excessive on desktop.

## Shape language

- Pill-shaped buttons (`rounded-full`)
- Rounded cards (`rounded-2xl` or `rounded-3xl`)
- Sharp corners are wrong for this product — do not use `rounded-none`
  or `rounded-sm` except for full-bleed images

## Typography

- Headings: Syne, weight 600–700
- Body: Plus Jakarta Sans, weight 400–500
- Never mix a third font family
- Headings can be large — Apple-scale large, not timid

## What "Apple Store luxury" rules out

- Neon gradients (especially purple-to-pink — this is the generic AI
  aesthetic Roman explicitly pushed back on for GoSaver, and it applies
  here too)
- Busy backgrounds, noise textures, grain overlays
- More than two accent colors in a single view
- Dense information layouts — this is a premium city guide, not a
  dashboard
- Drop shadows on everything — glass + black already creates depth

## Light mode

Available behind a toggle. Not the default. When building a new
component, build dark first and verify light second. If a component only
looks good in one mode, it's broken — fix it in both.