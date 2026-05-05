<!-- SEED — re-run $impeccable document once popup styles are implemented to capture actual tokens and components. -->
---
name: Checkmate
description: Real-time Stockfish move suggestions for Chess.com
colors:
  surface-deep: "oklch(11% 0.006 245)"
  surface-mid: "oklch(16% 0.007 245)"
  surface-raised: "oklch(20% 0.009 245)"
  border-subtle: "oklch(27% 0.010 245)"
  text-primary: "oklch(92% 0.004 245)"
  text-secondary: "oklch(60% 0.008 245)"
  accent-amber: "oklch(72% 0.14 68)"
  accent-amber-muted: "oklch(55% 0.10 68)"
typography:
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "8px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  toggle-track-on:
    backgroundColor: "{colors.accent-amber}"
    rounded: "{rounded.pill}"
    padding: "2px"
  toggle-track-off:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.pill}"
    padding: "2px"
---

# Design System: Checkmate

## 1. Overview

**Creative North Star: "The Silent Grandmaster"**

Checkmate's interface disappears into the background. Every pixel is earned by function, not decoration. The popup is a precision instrument accessed quickly, used once, put away. It does not announce itself.

The aesthetic is late-night analysis: a dark room, a bright board, one voice speaking without ceremony. Colors are near-monochromatic, barely blue-tinted — four surface tones and one warm amber accent that appears only when the engine is live. The amber is the flash of a decisive move. It means nothing else.

This system explicitly rejects the gamer aesthetic: no neon, no gradient glow, no chrome calling attention to itself. It also rejects the generic Chrome-extension default: no `background: #fff`, no system-font carelessness, no padded-out layouts that mistake generous spacing for good design. And it rejects Chess.com's visual density — this surface shows one thing at a time.

**Key Characteristics:**
- Near-monochromatic dark surfaces, barely blue-tinted to avoid pure black's flatness
- One amber accent used in exactly two places: the active toggle and the move arrow
- Compact typographic scale tuned for a 200px-wide tool panel, not a product page
- Flat depth system — four tonal surface steps replace shadows entirely
- Toggle as the sole interaction; nothing else competes for attention

## 2. Colors

A restrained dark palette. One accent. Its rarity is the point.

### Primary

- **Decisive Amber** (`oklch(72% 0.14 68)` / approx `#d4953c`): The active state. When the engine is on, this is the color. The SVG move arrow is this color. Used only at the moment of action.

### Neutral

- **Void** (`oklch(11% 0.006 245)` / approx `#0d0f12`): The deepest layer — the popup shell background.
- **Shadow Surface** (`oklch(16% 0.007 245)` / approx `#13181e`): Main popup body background.
- **Lifted Surface** (`oklch(20% 0.009 245)` / approx `#191f28`): Raised interactive elements, toggle track in the off state.
- **Hairline** (`oklch(27% 0.010 245)` / approx `#242d38`): Borders and dividers only.
- **Primary Text** (`oklch(92% 0.004 245)` / approx `#e4eaf2`): All labels, interactive text, the "Checkmate" title.
- **Secondary Text** (`oklch(60% 0.008 245)` / approx `#7c8a9b`): Status lines, hints, off-state labels.
- **Muted Amber** (`oklch(55% 0.10 68)` / approx `#a06c28`): Hover state for amber elements. Dimmer, not duller.

### Named Rules

**The One Amber Rule.** The accent color appears in exactly two places: the toggle track when active, and the SVG move arrow. It is not a button background, it is not a border accent, it is not a hover tint on text. Its rarity is what makes it meaningful — when the amber appears, the engine is working.

## 3. Typography

**Body Font:** Inter (system-ui, -apple-system, sans-serif fallback)

No display font. The popup surface is 200px wide at most. There is no room for a display hierarchy. Everything lives at title, body, or label scale. Nothing above 16px.

**Character:** Technical and tight. Inter at 400/500/600. No typographic decoration — no tracking on body text, no thin weights that would disappear at small sizes on non-retina screens.

### Hierarchy

- **Title** (600 weight, 15px, 1.3 line-height): "Checkmate" in the popup header. Used once per surface.
- **Body** (400 weight, 13px, 1.5 line-height): Status messages, any descriptive text. Max 30ch on this surface.
- **Label** (500 weight, 11px, 0.02em letter-spacing): Toggle labels, state indicators ("Active", "Off"). Uppercase acceptable for single-word state labels.

### Named Rules

**The No-Display Rule.** No font sizes above 16px in any popup surface. The surface is too small for typographic grandeur. Scale down, stay legible, stay dense.

## 4. Elevation

Flat by default. No `box-shadow` anywhere in the popup. Depth is expressed through the four tonal surface layers: Void (darkest) → Shadow Surface → Lifted Surface → Hairline (border only). The raised element is lighter; the recessed element is darker. Shadows would bleed past the popup frame and muddy the board environment anyway.

**The Flat System Rule.** If you feel the urge to add a shadow, add a tonal step instead. The four surface tones exist specifically to replace shadows. Shadows are prohibited — not discouraged, prohibited.

## 5. Components

### Toggle

The primary interactive element. Custom-styled toggle switch, not a styled browser checkbox.

- **Shape:** Pill track (`9999px` radius), circular thumb
- **Track width / height:** 36px × 20px
- **Thumb:** 16px circle, `surface-deep` background, centered vertically, 2px inset from track edge
- **Track Off:** `surface-raised` background, `border-subtle` 1px solid border
- **Track On:** `accent-amber` background, no border
- **Thumb transition:** `transform 160ms ease-out` (slide); `background 160ms ease-out` (track)
- **Prefers-reduced-motion:** transitions set to `0ms` when preference is set
- **Focus visible:** 2px `accent-amber` outline at 40% opacity, 3px offset

### Popup Header

- **Title:** "Checkmate", title scale (600/15px), `text-primary`
- **Layout:** Centered text, `lg` top padding, `md` bottom padding
- **Background:** `surface-mid` — no chrome, no border, no elevation above the popup body

### Status Label

Short label beneath the toggle: "Active" or "Off".

- **Scale:** Label (500/11px, 0.02em letter-spacing)
- **Active color:** `accent-amber`
- **Inactive color:** `text-secondary`
- **Uppercase:** Yes for single-word state labels

### Move Arrow (SVG Overlay)

Injected onto the Chess.com board. Not a popup component.

- **Color:** `accent-amber` (`oklch(72% 0.14 68)`)
- **Opacity:** 0.85 — the board is the star, the arrow is the annotation
- **Arrowhead shape:** Clean triangular head, not ornate
- **Stroke:** Scaled proportionally to board tile size, not fixed-pixel

## 6. Do's and Don'ts

### Do:

- **Do** use `accent-amber` only for the active toggle track and the SVG move arrow. That is the full scope of the accent color.
- **Do** express depth through tonal surface steps (Void → Shadow Surface → Lifted Surface → Hairline). Never shadows.
- **Do** keep popup width at 200px and internal padding at 12–16px. It is a precision tool, not a product page.
- **Do** respect `prefers-reduced-motion` — the toggle must be instantaneous when the system preference is set.
- **Do** make the toggle keyboard-operable with a visible focus ring in `accent-amber`.
- **Do** use Inter (or system-ui fallback) for all text. Consistency over personality at this scale.

### Don't:

- **Don't** add a gamer aesthetic — no neon, no gradient glows, no RGB-anything. If it looks like a gaming peripheral app, it's wrong.
- **Don't** show multiple stats, eval bars, depth meters, or move trees in any surface. One move, one indicator. That is the product.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe. Use a tonal background or nothing.
- **Don't** use `background-clip: text` with a gradient. Color emphasis through weight and size only.
- **Don't** treat the popup as a product landing page — no hero copy, no feature bullet lists, no "How it works" sections.
- **Don't** use the default Chrome extension aesthetic: no `background: #fff`, no system-font carelessness, no `color: #000`.
- **Don't** animate layout properties or add entrance animations. State transitions only (the toggle track color/position). Nothing else moves.
- **Don't** use `accent-amber` on hover states for non-amber elements — it dilutes the signal that amber = active engine.
