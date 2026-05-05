(async () => {
    let reader = null;
    let renderer = null;
    let ui = null;
    let observer = null;
    let MoveRenderer = null;
    let ToggleUI = null;

    async function initModules() {
        try {
            const { BoardReader } = await import(chrome.runtime.getURL('content/board-reader.js'));
            ({ MoveRenderer } = await import(chrome.runtime.getURL('content/move-renderer.js')));
            ({ ToggleUI } = await import(chrome.runtime.getURL('content/toggle-ui.js')));
            reader = new BoardReader();
        } catch (e) {
            console.error("Failed to load Checkmate modules:", e);
        }
    }

    function uciToIndex(uci) {
        const file = uci.charCodeAt(0) - 97;
        const rank = parseInt(uci[1]) - 1;
        return rank * 8 + file;
    }

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'toggle') {
            (async () => {
                if (!reader) await initModules();
                if (request.enabled) {
                    startSession();
                } else {
                    endSession();
                }
            })();
        } else if (request.action === 'bestMove' && renderer) {
            const move = request.move;
            renderer.drawArrow(uciToIndex(move.substring(0, 2)), uciToIndex(move.substring(2, 4)));
            if (ui) ui.updateNotation(move);
        }
    });

    function startSession() {
        if (!reader || !MoveRenderer || !ToggleUI) return;
        const board = reader.getBoardElement();
        if (!board) return;
        renderer = new MoveRenderer(board);
        ui = new ToggleUI((enabled) => { if (!enabled) endSession(); });
        startObserving();
    }

    function endSession() {
        if (ui) { ui.remove(); ui = null; }
        if (renderer) { renderer.clear(); renderer = null; }
        stopObserving();
    }

    function startObserving() {
        const board = reader.getBoardElement();
        if (!board) return;
        observer = new MutationObserver(() => {
            const fen = reader.toFEN(reader.parsePosition());
            chrome.runtime.sendMessage({ action: 'analyze', fen }).catch(() => {});
        });
        observer.observe(board, { childList: true, subtree: true });
    }

    function stopObserving() {
        if (observer) { observer.disconnect(); observer = null; }
    }
})();
