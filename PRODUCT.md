# Product

## Register

product

## Users

Chess players on Chess.com — intermediate to advanced, playing live games. They have the board in front of them, they're focused, and they want analysis assistance without breaking that concentration. The extension is a tool in service of the game, not the center of attention.

## Product Purpose

Checkmate overlays real-time Stockfish best-move suggestions directly onto Chess.com boards. The engine runs entirely client-side in a Web Worker — no server, no account, no friction. One toggle to activate, one arrow on the board. Success means the player sees the best move without ever thinking about the tool.

## Brand Personality

Precise. Quiet. Authoritative. Like a grandmaster whispering the right move without explaining themselves. Three words: surgical, understated, reliable.

## Anti-references

- Anything "gamer" — neon overlays, aggressive gradients, RGB styling
- Cluttered UI with multiple stats, eval bars, depth meters, move trees visible at once
- Extensions that feel like cheats: garish, obvious, proud of themselves
- Lichess's analysis board level of complexity (too much information density for the use case)
- Generic Chrome extension aesthetic: default blue buttons, system fonts, flat grey

## Design Principles

1. The board is always the star. Every UI element should recede when not actively needed.
2. Trust the engine, not the decoration. One arrow, one move. Stockfish doesn't need fanfare.
3. Presence through subtlety. Visible enough to use instantly, invisible enough not to intrude.
4. Zero configuration burden. One toggle. Nothing else the user must decide.
5. Native confidence. Feel like something Chess.com would build themselves — not a foreign layer pasted on top.

## Accessibility & Inclusion

WCAG AA as baseline. The SVG arrow overlay should have sufficient contrast against both light and dark board themes. Reduced motion: the toggle transition should respect `prefers-reduced-motion`. No color-only indicators — the active state should communicate through more than just color.
