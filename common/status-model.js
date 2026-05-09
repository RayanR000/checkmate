(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
        return;
    }
    root.CheckmateStatusModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const STATUS = Object.freeze({
        OFF: 'off',
        READY: 'ready',
        ANALYZING: 'analyzing',
        WAITING: 'waiting',
        BEST_MOVE: 'best_move',
        ERROR: 'error',
        INFO: 'info',
    });

    function createStatus(code, detail = '') {
        const safeCode = Object.values(STATUS).includes(code) ? code : STATUS.INFO;
        return { code: safeCode, detail: String(detail || '') };
    }

    function parseStringStatus(raw) {
        const text = String(raw || '').trim();
        if (!text) return createStatus(STATUS.INFO, '');
        if (text === 'Off') return createStatus(STATUS.OFF);
        if (text === 'Ready') return createStatus(STATUS.READY);
        if (text === 'Error') return createStatus(STATUS.ERROR);
        if (text === 'Analyzing' || text === 'Analyzing...') return createStatus(STATUS.ANALYZING);
        if (text === 'Waiting for your turn') return createStatus(STATUS.WAITING);
        if (text.startsWith('Best move: ')) return createStatus(STATUS.BEST_MOVE, text.slice('Best move: '.length).trim());
        return createStatus(STATUS.INFO, text);
    }

    function normalizeStatus(input, enabled = false) {
        if (!input) return createStatus(enabled ? STATUS.READY : STATUS.OFF);
        if (typeof input === 'string') return parseStringStatus(input);
        const code = input.code;
        const detail = String(input.detail || input.text || '');
        if (Object.values(STATUS).includes(code)) return createStatus(code, detail);
        return parseStringStatus(detail);
    }

    function formatUciMove(move) {
        if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(String(move || ''))) {
            return String(move || '');
        }
        const normalized = String(move).toLowerCase();
        return normalized.length === 5
            ? normalized.slice(0, 2) + ' -> ' + normalized.slice(2, 4) + '=' + normalized[4].toUpperCase()
            : normalized.slice(0, 2) + ' -> ' + normalized.slice(2, 4);
    }

    function toNotationText(input) {
        const status = normalizeStatus(input);
        if (status.code === STATUS.BEST_MOVE) return formatUciMove(status.detail || '--');
        if (status.code === STATUS.ANALYZING) return 'Analyzing...';
        if (status.code === STATUS.WAITING) return 'Waiting';
        if (status.code === STATUS.ERROR) return 'Error';
        if (status.code === STATUS.INFO) return status.detail || '--';
        return '--';
    }

    function toStatusText(input, enabled = false) {
        const status = normalizeStatus(input, enabled);
        if (status.code === STATUS.OFF) return 'Off';
        if (status.code === STATUS.READY) return 'Ready';
        if (status.code === STATUS.ANALYZING) return 'Analyzing...';
        if (status.code === STATUS.WAITING) return 'Waiting for your turn';
        if (status.code === STATUS.BEST_MOVE) return 'Best move: ' + (status.detail || '--');
        if (status.code === STATUS.ERROR) return 'Error';
        return status.detail || (enabled ? 'Ready' : 'Off');
    }

    function statusFromBestMove(move) {
        return createStatus(STATUS.BEST_MOVE, String(move || '').toLowerCase());
    }

    return {
        STATUS,
        createStatus,
        normalizeStatus,
        toNotationText,
        toStatusText,
        statusFromBestMove,
        formatUciMove,
    };
});
