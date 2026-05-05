# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Checkmate is a Chrome extension that provides real-time chess move analysis on Chess.com using Stockfish WASM running locally in the browser.

## Build and Development

Chrome extension development - no build step required for basic development:
- Load unpacked extension in Chrome via `chrome://extensions/` (enable Developer Mode)
- Reload extension after changes to manifest.json or background script
- Content script changes require page refresh on Chess.com

## Architecture

**Extension Components:**
- **Popup** (`popup/`) - Activation button UI, sends message to inject content script
- **Background** (`background/`) - Service worker handles extension icon clicks and state
- **Content Script** (`content/`) - Injected into Chess.com pages
  - `board-reader.js` - Parses Chess.com DOM (`<wc-chess-board>`) to extract FEN
  - `move-renderer.js` - Draws SVG arrows on board overlay
  - `toggle-ui.js` - On/off switch panel
- **Worker** (`worker/`) - Stockfish WASM runs in Web Worker for non-blocking analysis

**Data Flow:** Board DOM → FEN string → Stockfish worker → Best move → Arrow rendering

## Chess.com DOM Notes

- Chess board is `<wc-chess-board>` custom element
- Pieces have classes like `piece wp square-14` (wp = white pawn, square-14 = a4)
- Board can be flipped when playing as black

## Testing

Manual testing on live Chess.com games. Unit tests for:
- BoardReader FEN generation from mock DOM
- MoveRenderer arrow coordinate calculation
- Stockfish worker responses for known positions
