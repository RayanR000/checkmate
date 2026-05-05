const toggle = document.getElementById('toggle');
const track = document.getElementById('toggle-track');
const label = document.getElementById('state-label');
let isActive = false;

// Initial state (would ideally be fetched from storage)
function updateUI() {
    if (isActive) {
        track.classList.add('active');
        label.classList.add('active');
        label.textContent = 'Active';
    } else {
        track.classList.remove('active');
        label.classList.remove('active');
        label.textContent = 'Off';
    }
}

toggle.addEventListener('click', () => {
    isActive = !isActive;
    updateUI();
    
    // Notify the content script
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "toggle", enabled: isActive});
        }
    });
});
