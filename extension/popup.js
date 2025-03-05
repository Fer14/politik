document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('highlighting-toggle');
    const partyCountElement = document.getElementById('party-count'); // Element to display the count
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
    // Request the global party count when the popup loads
    chrome.runtime.sendMessage({
        action: 'getPartyCount'
      }, (response) => {
        if (response) {
          console.log("Global party count:", response.count);
          // Update the UI with the count
          if (partyCountElement) {
            partyCountElement.textContent = `Number of parties encountered: ${response.count}`;
          }
          else{
            console.log("No party count found")
          }
        } else {
          console.error("No response received");
        }
      });

});