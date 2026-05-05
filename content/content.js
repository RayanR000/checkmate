import { BoardReader } from './board-reader.js';

const reader = new BoardReader();
let observer = null;
const stockfish = new Worker(chrome.runtime.getURL('worker/stockfish-worker.js'));

stockfish.onmessage = (e) => {
    console.log("Best move from engine:", e.data.bestMove);
};

stockfish.postMessage({ command: 'init' });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
        if (request.enabled) {
            injectUI();
            startObserving();
        } else {
            removeUI();
            stopObserving();
        }
    }
});

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
...

function injectUI() {
    if (document.getElementById('checkmate-ui')) return;
    const ui = document.createElement('div');
    ui.id = 'checkmate-ui';
    ui.style.position = 'fixed';
    ui.style.top = '10px';
    ui.style.right = '10px';
    ui.style.zIndex = '9999';
    ui.style.background = 'white';
    ui.style.padding = '10px';
    ui.style.border = '1px solid black';
    ui.innerText = 'Checkmate Active';
    document.body.appendChild(ui);
}

function removeUI() {
    const ui = document.getElementById('checkmate-ui');
    if (ui) ui.remove();
}
