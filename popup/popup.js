const toggle = document.getElementById('toggle');
const track = document.getElementById('toggle-track');
const label = document.getElementById('state-label');
const statusText = document.getElementById('status-text');
const StatusModel = globalThis.CheckmateStatusModel;
let isActive = false;
let isBusy = false;

function updateUI(status = '') {
    const normalizedStatus = StatusModel.normalizeStatus(status, isActive);
    if (isActive) {
        track.classList.add('active');
        label.classList.add('active');
        label.textContent = 'Active';
    } else {
        track.classList.remove('active');
        label.classList.remove('active');
        label.textContent = 'Off';
    }
    toggle.setAttribute('aria-pressed', String(isActive));
    toggle.setAttribute('aria-busy', String(isBusy));
    toggle.disabled = isBusy;
    statusText.textContent = StatusModel.toStatusText(normalizedStatus, isActive);
}

async function queryState() {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    isActive = Boolean(response?.enabled);
    updateUI(response?.status);
}

async function setEnabled(enabled) {
    const response = await chrome.runtime.sendMessage({ action: 'setEnabled', enabled });
    isActive = Boolean(response?.enabled);
    updateUI(response?.status);
}

toggle.addEventListener('click', async () => {
    if (isBusy) return;
    isBusy = true;
    try {
        await setEnabled(!isActive);
    } catch (error) {
        console.error('[Checkmate Popup] toggle failed:', error?.message || error);
        updateUI('Error');
    } finally {
        isBusy = false;
    }
});

queryState().catch((error) => {
    console.error('[Checkmate Popup] state load failed:', error?.message || error);
    updateUI(StatusModel.createStatus(StatusModel.STATUS.ERROR));
});

const pollStateTimer = setInterval(() => {
    if (isBusy) return;
    queryState().catch((error) => {
        console.error('[Checkmate Popup] periodic state refresh failed:', error?.message || error);
    });
}, 1000);

window.addEventListener('unload', () => {
    clearInterval(pollStateTimer);
});
