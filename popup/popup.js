const toggle = document.getElementById('toggle');
const track = document.getElementById('toggle-track');
const label = document.getElementById('state-label');
const statusText = document.getElementById('status-text');
let isActive = false;
let isBusy = false;

function updateUI(status = '') {
    if (isActive) {
        track.classList.add('active');
        label.classList.add('active');
        label.textContent = 'Active';
    } else {
        track.classList.remove('active');
        label.classList.remove('active');
        label.textContent = 'Off';
    }
    statusText.textContent = status || (isActive ? 'Ready' : 'Off');
}

async function queryState() {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    isActive = Boolean(response?.enabled);
    updateUI(response?.status || '');
}

async function setEnabled(enabled) {
    const response = await chrome.runtime.sendMessage({ action: 'setEnabled', enabled });
    isActive = Boolean(response?.enabled);
    updateUI(response?.status || '');
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
    updateUI('Error');
});
