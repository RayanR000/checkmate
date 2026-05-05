export class BoardReader {
    constructor() {
        this.boardSelector = 'wc-chess-board';
    }

    getBoardElement() {
        return document.querySelector(this.boardSelector);
    }

    // Parses pieces based on Chess.com's piece class naming convention
    // e.g., 'piece wp square-14' -> 'wp' at index 14
    parsePosition() {
        const board = this.getBoardElement();
        if (!board) return null;

        const pieces = board.querySelectorAll('[class*="piece"]');
        const boardState = new Array(64).fill(null);

        pieces.forEach(piece => {
            const classes = piece.className.split(' ');
            const typeClass = classes.find(c => c.length === 2 && /^[pnbrqk][wb]$/.test(c));
            const squareClass = classes.find(c => c.startsWith('square-'));

            if (typeClass && squareClass) {
                const squareIndex = parseInt(squareClass.replace('square-', '')) - 1;
                boardState[squareIndex] = typeClass;
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
                    // Piece format: wp, wr, wn... (first char piece, second char color)
                    const p = piece[0];
                    const color = piece[1];
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
