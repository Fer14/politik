document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('highlighting-toggle');

    // Load the current state of the toggle
    chrome.storage.sync.get('highlightingEnabled', function(data) {
        // Default to true if not set
        toggle.checked = data.highlightingEnabled !== false;
    });

    // Add event listener to toggle switch
    toggle.addEventListener('change', function() {
        // Save the toggle state
        chrome.storage.sync.set({
            'highlightingEnabled': this.checked
        });

        // Send message to content script to enable/disable highlighting
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleHighlighting',
                enabled: toggle.checked
            });
        });
    });
});