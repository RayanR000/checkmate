# Checkmate Chrome Extension Design

## Context

Chess players want real-time move suggestions while playing live games on Chess.com. This extension provides best-move analysis using Stockfish running locally in the browser, displayed as visual arrows on the board plus text notation.

## Requirements

- **Platform:** Chess.com (Lichess support planned for future)
- **Engine:** Stockfish compiled to WebAssembly, runs locally in browser
- **Display:** Arrow highlighting on board + side panel with move notation
- **Activation:** Click extension icon to inject UI onto page
- **Analysis mode:** Toggle switch (on/off), defaults to off
- **Game types:** Live games only
- **Information shown:** Best move only (no evaluation scores or multiple lines)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                      │
├─────────────────────────────────────────────────────────┤
│  Popup (popup.html/js)                                  │
│  └─ "Activate" button → injects content script          │
├─────────────────────────────────────────────────────────┤
│  Content Script (injected into Chess.com)               │
│  ├─ BoardReader     → parses DOM for piece positions    │
│  ├─ Stockfish WASM  → runs in Web Worker                │
│  ├─ MoveRenderer    → draws arrows on SVG overlay       │
│  └─ ToggleUI        → on/off switch panel               │
├─────────────────────────────────────────────────────────┤
│  Background Script (service worker)                     │
│  └─ Handles extension icon clicks, manages state        │
└─────────────────────────────────────────────────────────┘
```

### Components

**1. BoardReader**
- Finds the chess board element (`<wc-chess-board>` custom element)
- Extracts piece positions from DOM (piece elements have classes like `piece wp square-14`)
- Detects whose turn it is by watching for board changes
- Outputs FEN string for Stockfish

**2. Stockfish Worker**
- Loads `stockfish.wasm` in a Web Worker
- Receives FEN string, sends UCI commands (`position fen ...` then `go depth 15`)
- Returns best move in algebraic notation (e.g., `e2e4`)

**3. MoveRenderer**
- Creates SVG overlay positioned over the Chess.com board
- Draws arrow from source square to destination square
- Handles board flipping (playing as black)
- Clears previous arrow when new move is calculated

**4. ToggleUI**
- Small panel anchored to corner of the board
- Shows: on/off toggle switch + current best move text (e.g., "Nf3")

## Data Flow

```
User clicks extension icon
        │
        ▼
Popup sends "activate" message to background script
        │
        ▼
Background script injects content script into Chess.com tab
        │
        ▼
Content script initializes:
  ├─ Creates SVG overlay on top of board
  ├─ Creates toggle UI panel (off by default)
  └─ Starts watching the board for changes
        │
        ▼
User flips toggle ON
        │
        ▼
BoardReader parses DOM → produces FEN string
        │
        ▼
FEN sent to Stockfish Web Worker
        │
        ▼
Stockfish calculates best move (e.g., "e2e4")
        │
        ▼
MoveRenderer draws arrow + ToggleUI shows notation
        │
        ▼
Board changes detected (opponent moves or user moves)
        │
        ▼
If toggle still ON → repeat analysis cycle
```

## Error Handling

| Scenario | Response |
|----------|----------|
| Board element not found | Show "No chess board detected" in popup, don't inject |
| Stockfish fails to load | Show error in toggle panel, disable toggle switch |
| Board DOM structure changed | BoardReader returns null, panel shows "Unable to read position" |
| User navigates away from game | Detect page change, clean up overlay and worker |
| Multiple boards on page | Target only the main game board |

## Testing

**Manual testing:**
- Load extension in Chrome developer mode
- Play live games on Chess.com
- Verify: activation, toggle, board reading, arrow rendering, move text

**Unit tests:**
- BoardReader: mock DOM elements, verify FEN output
- MoveRenderer: verify arrow coordinates for various squares
- Stockfish worker: send known positions, check expected moves

**Edge cases:**
- Playing as white vs black (board flip)
- Rapid moves (analysis cancels/restarts cleanly)
- Game ends (checkmate, resignation) — stop analysis
- Browser tab hidden then refocused — resume correctly

## File Structure

```
checkmate/
├── manifest.json           # Chrome extension manifest v3
├── popup/
│   ├── popup.html
│   └── popup.js
├── background/
│   └── service-worker.js
├── content/
│   ├── content.js          # Main entry point
│   ├── board-reader.js     # DOM parsing for board state
│   ├── move-renderer.js    # SVG arrow drawing
│   └── toggle-ui.js        # On/off panel
├── worker/
│   ├── stockfish-worker.js # Web Worker wrapper
│   └── stockfish.wasm      # Stockfish engine binary
└── assets/
    └── icon.png            # Extension icon
```

## Verification

1. Load unpacked extension in Chrome
2. Navigate to Chess.com and start a live game
3. Click extension icon, then "Activate"
4. Verify toggle panel appears on board
5. Turn toggle on, verify arrow appears showing best move
6. Make a move, verify analysis updates
7. Turn toggle off, verify arrow disappears
8. Play as black to verify board flip handling works
