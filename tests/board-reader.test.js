const test = require('node:test');
const assert = require('node:assert/strict');
const BoardReader = require('../content/board-reader.js');

function emptyBoard() {
    return new Array(64).fill(null);
}

test('inferCastlingRights returns full rights when kings and rooks are on starting squares', () => {
    const reader = new BoardReader();
    const board = emptyBoard();
    board[4] = 'wk';
    board[0] = 'wr';
    board[7] = 'wr';
    board[60] = 'bk';
    board[56] = 'br';
    board[63] = 'br';

    assert.equal(reader.inferCastlingRights(board), 'KQkq');
});

test('inferCastlingRights returns no rights when kings are not on starting squares', () => {
    const reader = new BoardReader();
    const board = emptyBoard();
    board[6] = 'wk';
    board[62] = 'bk';
    board[0] = 'wr';
    board[7] = 'wr';
    board[56] = 'br';
    board[63] = 'br';

    assert.equal(reader.inferCastlingRights(board), '-');
});

test('toFEN includes turn and inferred castling rights', () => {
    const reader = new BoardReader();
    const board = emptyBoard();
    board[4] = 'wk';
    board[7] = 'wr';
    board[60] = 'bk';
    board[56] = 'br';

    assert.equal(reader.toFEN(board, 'b'), 'r3k3/8/8/8/8/8/8/4K2R b Kq - 0 1');
});
