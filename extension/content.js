(function() {
  // Database of corrupt Spanish politicians with their descriptions
  const corruptParties = {
    "POSE": "Corruptos",
    "PP" : "Corruptos",
    "VOX" : "Corruptos",
    "PODEMOS" : "Corruptos"
  };

  // Function to find and highlight all occurrences of politicians' names in the document
  function scanAndHighlightDocument() {
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
  }

  // Process a DOM element and its children
  function processElement(element) {
    // Skip script and style elements
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || 
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
        const regex = new RegExp(politician, 'gi');
        if (regex.test(content)) {
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

  // Run the main functions
  createTooltipElements();
  scanAndHighlightDocument();
})();
