# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Checkmate is a Chrome extension that displays real-time best-move suggestions on Chess.com using Stockfish WASM. The engine runs entirely client-side in a Web Worker.

## Development

**Load extension for testing:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this project directory

**Test on:** https://www.chess.com (live games only, not puzzles or analysis board)

## Architecture

```
popup/        → Extension popup UI with activate button
background/   → Service worker (Manifest V3 background script)
content/      → Content script injected into Chess.com pages
worker/       → Stockfish WASM Web Worker (not yet implemented)
assets/       → Icons and static assets
```

**Data flow:** Popup → "activate" message → Content script → BoardReader (DOM → FEN) → StockfishWorker (FEN → best move) → MoveRenderer (SVG arrow overlay)

**Key implementation details:**
- BoardReader parses Chess.com's `<wc-chess-board>` element and piece classes like `piece wp square-14` to produce FEN strings
- Stockfish uses `go depth 15` UCI command; only best move shown (no eval scores)
- MoveRenderer creates SVG overlay and handles board flip when playing as black
- Toggle UI provides on/off control on the board itself

## Design Spec

Full design spec with error handling, edge cases, and verification checklist: `docs/superpowers/specs/2026-05-05-checkmate-chrome-extension-design.md`
