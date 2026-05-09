const test = require('node:test');
const assert = require('node:assert/strict');
const StatusModel = require('../common/status-model.js');

test('normalizeStatus falls back to enabled defaults', () => {
    assert.deepEqual(StatusModel.normalizeStatus(null, false), { code: 'off', detail: '' });
    assert.deepEqual(StatusModel.normalizeStatus(null, true), { code: 'ready', detail: '' });
});

test('normalizeStatus parses legacy status strings', () => {
    assert.deepEqual(StatusModel.normalizeStatus('Analyzing...'), { code: 'analyzing', detail: '' });
    assert.deepEqual(StatusModel.normalizeStatus('Waiting for your turn'), { code: 'waiting', detail: '' });
    assert.deepEqual(StatusModel.normalizeStatus('Best move: e2e4'), { code: 'best_move', detail: 'e2e4' });
});

test('toStatusText and toNotationText produce consistent UX strings', () => {
    const bestMove = StatusModel.statusFromBestMove('e2e4');
    assert.equal(StatusModel.toStatusText(bestMove, true), 'Best move: e2e4');
    assert.equal(StatusModel.toNotationText(bestMove), 'e2 -> e4');
    assert.equal(StatusModel.toNotationText(StatusModel.createStatus(StatusModel.STATUS.WAITING)), 'Waiting');
});

test('formatUciMove supports promotions', () => {
    assert.equal(StatusModel.formatUciMove('e7e8q'), 'e7 -> e8=Q');
});
