(async () => {
    let reader = null;
    let renderer = null;
    let ui = null;
    let observer = null;
    let lastSentFen = null; // deduplicate — don't re-analyze same position

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'toggle') {
            if (request.enabled) {
                startSession();
            } else {
                endSession();
            }
        } else if (request.action === 'bestMove') {
            if (renderer && request.move && request.move !== '(none)') {
                renderer.drawArrow(
                    uciToIndex(request.move.substring(0, 2)),
                    uciToIndex(request.move.substring(2, 4))
                );
                if (ui) ui.updateNotation(request.move);
            }
        } else if (request.action === 'status') {
            if (ui) ui.updateNotation(request.text);
        }
    });

    function uciToIndex(uci) {
        const file = uci.charCodeAt(0) - 97;
        const rank = parseInt(uci[1]) - 1;
        return rank * 8 + file;
    }

    function startSession() {
        if (ui) return;
        reader = new BoardReader();
        const board = reader.getBoardElement();
        if (!board) { console.warn('[Checkmate] board not found'); return; }
        renderer = new MoveRenderer(board);
        ui = new ToggleUI((enabled) => { if (!enabled) endSession(); });
        startObserving();
    }

    function endSession() {
        if (ui) { ui.remove(); ui = null; }
        if (renderer) { renderer.clear(); renderer = null; }
        stopObserving();
        reader = null;
        lastSentFen = null;
    }

    function startObserving() {
        const board = reader.getBoardElement();
        if (!board) return;

        let debounceTimer = null;
        const analyze = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const state = reader.parsePosition();
                if (!state) return;
                
                const turn = reader.isUserTurn() ? 'w' : 'b'; 
                
                // Hide arrow and reset during opponent's turn
                if (turn !== 'w') {
                    if (renderer) renderer.clear();
                    if (ui) ui.updateNotation('...');
                    lastSentFen = null; // Reset so it triggers immediately when it becomes our turn
                    return;
                }

                const fen = reader.toFEN(state, turn);
                if (fen === lastSentFen) return;
                lastSentFen = fen;
                
                // Immediate feedback for user's turn
                if (ui) ui.updateNotation('Analyzing...');
                chrome.runtime.sendMessage({ action: 'analyze', fen }).catch(() => {});
            }, 400); 
        };

        observer = new MutationObserver(analyze);
        observer.observe(board, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
        });
        analyze();
    }

    function stopObserving() {
        if (observer) { observer.disconnect(); observer = null; }
    }
})();
