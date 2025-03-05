// Global state to track encountered parties across all tabs
let encounteredParties = new Set();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addParty') {
    // Add a new party to the global set
    console.log("added", request.party)
    encounteredParties.add(request.party);
    sendResponse({ success: true });
  } else if (request.action === 'getPartyCount') {
    // Send the current count of encountered parties
    console.log(encounteredParties)

    sendResponse({ type: "PARTY_COUNT", count: encounteredParties.size });
  }
});

// Optional: Clean up data when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  // You can add logic here to clean up tab-specific data if needed
});