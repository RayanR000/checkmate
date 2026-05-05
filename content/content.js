(async () => {
    let reader = null;
    let renderer = null;
    let ui = null;
    let observer = null;

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'toggle') {
            if (request.enabled) {
                startSession();
            } else {
                endSession();
            }
        } else if (request.action === 'bestMove') {
            console.log('[Checkmate] bestMove received:', request.move, 'renderer:', !!renderer);
            if (renderer) {
                const move = request.move;
                if (move && move !== '(none)') {
                    renderer.drawArrow(uciToIndex(move.substring(0, 2)), uciToIndex(move.substring(2, 4)));
                    if (ui) ui.updateNotation(move);
                } else {
                    console.warn('[Checkmate] bestMove was (none) or empty');
                }
            }
        }
    });

    function uciToIndex(uci) {
        const file = uci.charCodeAt(0) - 97; // 'a'=0 .. 'h'=7
        const rank = parseInt(uci[1]) - 1;   // '1'=0 .. '8'=7
        return rank * 8 + file;
    }

    function startSession() {
        if (ui) return; // already active
        reader = new BoardReader();
        const board = reader.getBoardElement();
        if (!board) { console.warn('[Checkmate] board not found'); return; }
        console.log('[Checkmate] board found, starting session');
        renderer = new MoveRenderer(board);
        ui = new ToggleUI((enabled) => { if (!enabled) endSession(); });
        startObserving();
    }

    function endSession() {
        if (ui) { ui.remove(); ui = null; }
        if (renderer) { renderer.clear(); renderer = null; }
        stopObserving();
        reader = null;
    }

    function startObserving() {
        const board = reader.getBoardElement();
        if (!board) return;

        let debounceTimer = null;
        const analyze = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const state = reader.parsePosition();
                if (!state) { console.warn('[Checkmate] parsePosition returned null'); return; }
                const fen = reader.toFEN(state);
                console.log('[Checkmate] sending FEN:', fen);
                chrome.runtime.sendMessage({ action: 'analyze', fen }).catch((e) => {
                    console.error('[Checkmate] sendMessage failed:', e);
                });
            }, 150);
        };

        observer = new MutationObserver(analyze);
        observer.observe(board, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        analyze();
    }

    function stopObserving() {
        if (observer) { observer.disconnect(); observer = null; }
    }
})();
