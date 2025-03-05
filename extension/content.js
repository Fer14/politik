(function() {
  // Database of corrupt Spanish politicians with their descriptions
  const corruptParties = {
    "POLITICAL PARTY": "X Corruption Cases",
    "PSOE" : "Corruptos",
    "PP" : "Corruptos",
    "VOX" : "Corruptos",
    "PODEMOS" : "Corruptos",
    "chocolate" : "chocolate",
    "test" : "test"
  };

  let isHighlightingEnabled = true;

  // Function to find and highlight all occurrences of politicians' names in the document
  function scanAndHighlightDocument() {
    // Check if highlighting is enabled
    chrome.storage.sync.get('highlightingEnabled', function(data) {
      isHighlightingEnabled = data.highlightingEnabled !== false;
      
      // Only process if highlighting is enabled
      if (isHighlightingEnabled) {
        // Create an observer to monitor DOM changes
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
              Array.from(mutation.addedNodes).forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  processElement(node);
                }
              });
            }
          });
        });

        // Start observing the document
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true
        });

        // Process the initial document
        processElement(document.documentElement);
      } else {
        // Remove existing highlights if highlighting is disabled
        removeHighlights();
      }
    });
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Remove existing highlights
  function removeHighlights() {
    const highlights = document.querySelectorAll('.politka-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    });

    // Remove tooltip
    const tooltip = document.getElementById('politka-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  // Process a DOM element and its children
  function processElement(element) {
    // Skip if highlighting is disabled
    if (!isHighlightingEnabled) return;

    // Skip script and style elements
    if (element.tagName === 'SCRIPT' ||
      (element.parentElement && element.parentElement.tagName === 'SCRIPT') ||
      element.tagName === 'STYLE' ||
      element.tagName === 'IMG' ||
      element.tagName === 'SVG' ||
      element.tagName === 'IFRAME' ||
      element.tagName === 'CANVAS'  ||
      element.classList.contains('politka-highlight') || 
      element.id === 'politka-tooltip') {
      return;
    }

    // Process text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      { acceptNode: node => {
          // Skip empty text nodes and nodes that are already being processed
          if (!node.nodeValue.trim() || 
              node.parentNode.classList.contains('politka-highlight') ||
              node.parentNode.id === 'politka-tooltip') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );

    const nodesToProcess = [];
    let currentNode;
    
    // Collect all text nodes to process
    while (currentNode = walker.nextNode()) {
      nodesToProcess.push(currentNode);
    }

    // Process each text node
    nodesToProcess.forEach(node => {
      let content = node.nodeValue;
      let modified = false;
      
      for (const politician in corruptParties) {
        // Case insensitive search
        const regex = new RegExp(`\\b${escapeRegExp(politician)}\\b`, 'gi');
        if (regex.test(content)) {
          // Add the party to the encountered set
          // console.log(politician)
          // if (politician === 'VOX') {
          //   console.log(`Found "Vox" politician in element with tag: ${element.tagName}`,node.parentElement.outerHTML);

          // }
          onPartyEncountered(politician);
          //console.log(encounteredParties)
          // Split text by politician name (preserving case)
          const parts = [];
          let lastIndex = 0;
          let match;
          
          // Reset regex to start searching from beginning
          regex.lastIndex = 0;
          
          while ((match = regex.exec(content)) !== null) {
            // Add text before match
            if (match.index > lastIndex) {
              parts.push({
                text: content.substring(lastIndex, match.index),
                isPolitician: false
              });
            }
            
            // Add the politician name
            parts.push({
              text: match[0], // Use the actual matched text to preserve case
              isPolitician: true,
              politician: politician
            });
            
            lastIndex = regex.lastIndex;
          }
          
          // Add remaining text
          if (lastIndex < content.length) {
            parts.push({
              text: content.substring(lastIndex),
              isPolitician: false
            });
          }
          
          // Create document fragment with highlighted text
          const fragment = document.createDocumentFragment();
          
          parts.forEach(part => {
            if (part.isPolitician) {
              const span = document.createElement('span');
              span.className = 'politka-highlight';
              span.setAttribute('data-description', corruptParties[part.politician]);
              span.textContent = part.text;
              fragment.appendChild(span);

            } else {
              fragment.appendChild(document.createTextNode(part.text));
            }
          });
          
          // Replace the original node with our fragment
          node.parentNode.replaceChild(fragment, node);
          modified = true;
          break;
        }
      }
    });
  }

  // Create tooltip elements
  function createTooltipElements() {
    // Skip if highlighting is disabled
    if (!isHighlightingEnabled) return;

    const tooltipContainer = document.createElement('div');
    tooltipContainer.id = 'politka-tooltip';
    tooltipContainer.style.display = 'none';
    document.body.appendChild(tooltipContainer);
    
    // Add event delegation for highlighted elements
    document.body.addEventListener('mouseover', function(e) {
      if (e.target.classList.contains('politka-highlight')) {
        const description = e.target.getAttribute('data-description');
        tooltipContainer.textContent = description;
        tooltipContainer.style.display = 'block';
        
        // Position the tooltip
        const rect = e.target.getBoundingClientRect();
        tooltipContainer.style.top = (window.scrollY + rect.bottom + 5) + 'px';
        tooltipContainer.style.left = (window.scrollX + rect.left) + 'px';
        
        // Ensure tooltip stays within viewport
        const tooltipRect = tooltipContainer.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
          tooltipContainer.style.left = (window.innerWidth - tooltipRect.width - 10) + 'px';
        }
      }
    });
    
    document.body.addEventListener('mouseout', function(e) {
      if (e.target.classList.contains('politka-highlight')) {
        tooltipContainer.style.display = 'none';
      }
    });
  }

  function onPartyEncountered(party) {
    chrome.runtime.sendMessage({
      action: 'addParty',
      party: party // The party data to add
    }, (response) => {
      if (response && response.success) {
        console.log("Party added to global state", party);
      }
    });
  }

  // Listen for messages from popup to toggle highlighting
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'toggleHighlighting') {
      isHighlightingEnabled = request.enabled;
      if (isHighlightingEnabled) {
        // Re-run highlighting
        scanAndHighlightDocument();
        createTooltipElements();
      } else {
        // Remove existing highlights
        removeHighlights();
      }
    }
  });

  // Initial setup
  createTooltipElements();
  scanAndHighlightDocument();
})();