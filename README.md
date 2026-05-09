# Checkmate

Checkmate is a browser extension that overlays real-time Stockfish best-move suggestions directly onto Chess.com boards. Designed for intermediate to advanced players, it provides analysis assistance without breaking concentration or cluttering the interface.

## Features

- **Real-time Suggestions:** See the best move instantly via an overlay arrow on the board.
- **Client-Side Engine:** Runs entirely in the browser using a Web Worker. No servers or accounts required.
- **Minimalist Design:** A surgical, understated, and reliable tool that respects your focus.
- **Zero Friction:** One-click toggle to activate or deactivate the engine.

## Installation

1. Clone this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the root directory of this project.

## Usage

Once installed, click the Checkmate extension icon in your browser toolbar to open the popup. Use the toggle switch to activate or deactivate move suggestions. The toggle is keyboard accessible (Tab + Enter/Space), and the enabled state persists across tab reloads. When active, an amber arrow will appear on the Chess.com board indicating the best move calculated by Stockfish.

## Technical Overview

Checkmate leverages a Web Worker to run Stockfish entirely client-side. The extension follows a strict dark-mode design system using tonal surface steps instead of shadows to maintain a clean, non-intrusive interface. The amber accent color (`#d4953c`) is reserved strictly for active states and move annotations.

## Privacy & Security

Checkmate operates entirely locally. No game data or personal information is transmitted to external servers. The engine runs within your browser's local sandbox, ensuring complete privacy.

## Fair Play Notice

Checkmate is intended for personal analysis and educational purposes only. Using this tool to cheat in online games violates the [Chess.com Fair Play Policy](https://www.chess.com/legal/fair-play). Do not use this extension during competitive play.

## Verification

Run automated checks:

1. `node --check background/service-worker.js`
2. `node --check common/status-model.js`
3. `node --check content/board-reader.js`
4. `node --check content/move-renderer.js`
5. `node --check content/content.js`
6. `node --check popup/popup.js`
7. `node --test tests/board-reader.test.js tests/status-model.test.js`

Manual release checklist:

1. Load the extension in Chrome and open a Chess.com live game.
2. Toggle Checkmate **on** in the popup and confirm status changes from `Ready` to `Analyzing...`.
3. Confirm a best-move arrow appears and the move notation updates.
4. Play as both white and black and verify arrow direction remains correct on flipped boards.
5. Toggle Checkmate **off** in the popup and confirm the overlay/UI are removed.
6. Reload the Chess.com tab and verify the enabled/disabled state persists.
7. Navigate popup controls via keyboard only (Tab + Enter/Space) and verify toggle behavior matches mouse clicks.
8. Confirm popup status and in-page overlay stay consistent across transitions (`Ready`, `Analyzing...`, `Waiting for your turn`, `Best move`, `Off`, `Error`).
