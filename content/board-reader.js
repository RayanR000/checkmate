class BoardReader {
    constructor() {
        this.boardSelector = 'wc-chess-board';
    }

    isUserTurn() {
        const board = this.getBoardElement();
        if (!board) return true;
        // Chess.com boards typically have a class indicating orientation or active side
        // Example: 'flipped' class usually indicates the player is playing as Black
        const isFlipped = board.classList.contains('flipped');
        // We need to determine if it is currently our turn.
        // Usually, Chess.com adds a class to the board to indicate whose turn it is.
        // A common heuristic is looking for the presence of a 'turn-white' or 'turn-black' class,
        // or checking if the 'is-white-turn' attribute exists.
        // Let's check for a common indicator.
        return !board.classList.contains('turn-b'); 
    }

    getBoardElement() {
        return document.querySelector(this.boardSelector);
    }

    parsePosition() {
        const board = this.getBoardElement();
        if (!board) return null;

        const pieces = board.querySelectorAll('[class*="piece"]');
        const boardState = new Array(64).fill(null);

        pieces.forEach(piece => {
            const classes = piece.className.split(' ');
            // chess.com format: color first then piece type, e.g. "wp" = white pawn
            const typeClass = classes.find(c => c.length === 2 && /^[wb][pnbrqk]$/.test(c));
            const squareClass = classes.find(c => c.startsWith('square-'));

            if (typeClass && squareClass) {
                // square-{file}{rank}: e.g. square-14 = file 1, rank 4
                const squareNum = parseInt(squareClass.replace('square-', ''));
                const file = Math.floor(squareNum / 10) - 1;
                const rank = (squareNum % 10) - 1;
                boardState[rank * 8 + file] = typeClass;
            }
        });

        return boardState;
    }

    toFEN(boardState, turn = 'w') {
        let fen = '';
        for (let row = 7; row >= 0; row--) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const piece = boardState[row * 8 + col];
                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    // piece[0] = color (w/b), piece[1] = type (p/n/b/r/q/k)
                    const color = piece[0];
                    const p = piece[1];
                    fen += (color === 'w') ? p.toUpperCase() : p.toLowerCase();
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (row > 0) fen += '/';
        }
        return `${fen} ${turn} - - 0 1`;
    }
}
