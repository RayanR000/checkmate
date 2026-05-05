import { BoardReader } from './board-reader.js';
import { MoveRenderer } from './move-renderer.js';
import { ToggleUI } from './toggle-ui.js';

const reader = new BoardReader();
let renderer = null;
let ui = null;
let observer = null;
const stockfish = new Worker(chrome.runtime.getURL('worker/stockfish-worker.js'));

stockfish.onmessage = (e) => {
    const move = e.data.bestMove;
    if (renderer && move) {
        const from = uciToIndex(move.substring(0, 2));
        const to = uciToIndex(move.substring(2, 4));
        renderer.drawArrow(from, to);
        if (ui) ui.updateNotation(move);
    }
};

function uciToIndex(uci) {
    const file = uci.charCodeAt(0) - 97;
    const rank = parseInt(uci[1]) - 1;
    return rank * 8 + file;
}

stockfish.postMessage({ command: 'init' });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
        if (request.enabled) {
            startSession();
        } else {
            endSession();
        }
    }
});

function startSession() {
    const board = reader.getBoardElement();
    if (board) {
        renderer = new MoveRenderer(board);
        ui = new ToggleUI((enabled) => {
            if (!enabled) endSession();
        });
        startObserving();
    }
}

function endSession() {
    if (ui) {
        ui.remove();
        ui = null;
    }
    if (renderer) {
        renderer.clear();
        renderer = null;
    }
    stopObserving();
}

function startObserving() {
    const board = reader.getBoardElement();
    if (!board) return;

    observer = new MutationObserver(() => {
        const state = reader.parsePosition();
        const fen = reader.toFEN(state);
        stockfish.postMessage({ command: 'analyze', fen });
    });

    observer.observe(board, { childList: true, subtree: true });
}

function stopObserving() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
}
