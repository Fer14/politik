document.addEventListener('DOMContentLoaded', function() {
    // Create a container for the toggle
    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.justifyContent = 'center';
    toggleContainer.style.marginBottom = '10px';
    toggleContainer.style.gap = '10px';
  
    // Create toggle label
    const toggleLabel = document.createElement('label');
    toggleLabel.htmlFor = 'extension-toggle';
    toggleLabel.textContent = 'Enable Highlighting';
    toggleLabel.style.fontWeight = 'bold';
    toggleLabel.style.color = '#ffffff';
  
    // Create toggle switch
    const toggleSwitch = document.createElement('input');
    toggleSwitch.type = 'checkbox';
    toggleSwitch.id = 'extension-toggle';
  
    // Add elements to container
    toggleContainer.appendChild(toggleLabel);
    toggleContainer.appendChild(toggleSwitch);
  
    // Insert toggle container before the description
    const description = document.querySelector('.divider');
    description.parentNode.insertBefore(toggleContainer, description);
  
    // Load and set initial toggle state
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getExtensionState' }, function(response) {
        toggleSwitch.checked = response.enabled;
      });
    });
  
    // Toggle event listener
    toggleSwitch.addEventListener('change', function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleExtension' }, function(response) {
          // Optional: Add any additional UI feedback
          console.log('Extension state:', response.enabled);
        });
      });
    });
  });