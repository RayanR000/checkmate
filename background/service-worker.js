importScripts('/common/status-model.js');

const StatusModel = globalThis.CheckmateStatusModel;
let offscreenPort = null;
let pendingAnalysis = null;
const tabStatus = new Map();
const ENABLED_KEY = 'checkmateEnabled';

async function getEnabled() {
    const stored = await chrome.storage.local.get(ENABLED_KEY);
    return Boolean(stored[ENABLED_KEY]);
}

async function setEnabled(enabled) {
    await chrome.storage.local.set({ [ENABLED_KEY]: Boolean(enabled) });
}

function isChessTab(tab) {
    return Boolean(tab?.url?.startsWith('https://www.chess.com/'));
}

async function getCurrentWindowActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
}

async function sendToggleToTab(tabId, enabled) {
    try {
        await chrome.tabs.sendMessage(tabId, { action: 'toggle', enabled });
    } catch (error) {
        console.warn('[Checkmate SW] toggle delivery failed:', error?.message || error);
    }
}

async function getChessTabs() {
    return chrome.tabs.query({ url: ['https://www.chess.com/*'] });
}

function getDefaultStatus(enabled) {
    return StatusModel.createStatus(enabled ? StatusModel.STATUS.READY : StatusModel.STATUS.OFF);
}

function getTabStatus(tabId, enabled) {
    return StatusModel.normalizeStatus(tabStatus.get(tabId), enabled);
}

chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'offscreen') return;
    offscreenPort = port;

    port.onMessage.addListener((msg) => {
        if (msg.action === 'bestMove' && msg.tabId) {
            chrome.tabs.sendMessage(msg.tabId, {
                action: 'bestMove',
                move: msg.move,
                requestId: msg.requestId,
            })
                .catch((error) => console.warn('[Checkmate SW] bestMove delivery failed:', error?.message || error));
        }
    });

    port.onDisconnect.addListener(() => { offscreenPort = null; });

    if (pendingAnalysis) {
        const { fen, tabId, requestId } = pendingAnalysis;
        pendingAnalysis = null;
        offscreenPort.postMessage({ action: 'analyze', fen, tabId, requestId });
    }
});

async function ensureOffscreen() {
    try {
        await chrome.offscreen.createDocument({
            url: chrome.runtime.getURL('offscreen/offscreen.html'),
            reasons: ['WORKERS'],
            justification: 'Run Stockfish WASM chess engine',
        });
    } catch (e) {
        if (!e.message?.includes('single offscreen document')) {
            console.error('[Checkmate SW] offscreen create failed:', e.message);
        }
        // Already exists — offscreen will reconnect port on its own.
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyze') {
        const tabId = sender.tab?.id;
        if (!tabId) return;
        if (offscreenPort) {
            offscreenPort.postMessage({
                action: 'analyze',
                fen: request.fen,
                tabId,
                requestId: request.requestId,
            });
        } else {
            pendingAnalysis = { fen: request.fen, tabId, requestId: request.requestId };
            ensureOffscreen();
        }
        return;
    }

    if (request.action === 'statusUpdate') {
        const tabId = sender.tab?.id;
        if (!tabId) return;
        tabStatus.set(tabId, StatusModel.normalizeStatus(request.status || request.text, true));
        return;
    }

    if (request.action === 'getState') {
        (async () => {
            try {
                const enabled = await getEnabled();
                const tabId = sender.tab?.id || (await getCurrentWindowActiveTab())?.id || null;
                const status = tabId ? getTabStatus(tabId, enabled) : getDefaultStatus(enabled);
                sendResponse({ enabled, status });
            } catch (error) {
                console.error('[Checkmate SW] getState failed:', error?.message || error);
                sendResponse({ enabled: false, status: StatusModel.createStatus(StatusModel.STATUS.ERROR) });
            }
        })();
        return true;
    }

    if (request.action === 'setEnabled') {
        (async () => {
            try {
                const enabled = Boolean(request.enabled);
                await setEnabled(enabled);
                const chessTabs = await getChessTabs();
                await Promise.all(chessTabs.map((tab) => sendToggleToTab(tab.id, enabled)));

                const nextStatus = getDefaultStatus(enabled);
                for (const tab of chessTabs) {
                    tabStatus.set(tab.id, nextStatus);
                }

                if (!enabled) pendingAnalysis = null;
                sendResponse({ enabled, status: nextStatus });
            } catch (error) {
                console.error('[Checkmate SW] setEnabled failed:', error?.message || error);
                sendResponse({ enabled: false, status: StatusModel.createStatus(StatusModel.STATUS.ERROR) });
            }
        })();
        return true;
    }
});

chrome.runtime.onInstalled.addListener(async () => {
    const stored = await chrome.storage.local.get(ENABLED_KEY);
    if (stored[ENABLED_KEY] === undefined) {
        await setEnabled(false);
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return;
    if (!isChessTab(tab)) return;
    const enabled = await getEnabled();
    if (!enabled) return;
    await sendToggleToTab(tabId, true);
    if (!tabStatus.has(tabId)) tabStatus.set(tabId, getDefaultStatus(true));
});

chrome.tabs.onRemoved.addListener((tabId) => {
    tabStatus.delete(tabId);
});
