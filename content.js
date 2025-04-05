console.log('Content script loaded!');

// Listen for text selection
document.addEventListener('mouseup', function(e) {
    console.log('Mouse up detected');
    
    // Don't trigger if we're clicking the button itself
    if (e.target.id === 'simplifyButton') {
        return;
    }

    // Small delay to ensure selection is complete
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        console.log('Selected text:', selectedText);
        
        if (selectedText.length > 0) {
            showSimplifyButton(e.clientX, e.clientY, selectedText);
        }
    }, 100);
});

function showSimplifyButton(x, y, selectedText) {
    console.log('Showing button');
    // Remove any existing button
    removeExistingButton();

    // Create the button
    const button = document.createElement('button');
    button.textContent = 'Simplify';
    button.id = 'simplifyButton';
    button.style.cssText = `
        position: fixed;
        z-index: 999999;
        top: ${y + 10}px;
        left: ${x}px;
        padding: 8px 16px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;

    // Add click handler
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Button clicked');
        await simplifySelectedText(selectedText);
        removeExistingButton();
    });

    // Add to page
    document.body.appendChild(button);

    // Remove button when clicking elsewhere
    document.addEventListener('mousedown', function handler(e) {
        if (e.target !== button) {
            removeExistingButton();
            document.removeEventListener('mousedown', handler);
        }
    });
}

function removeExistingButton() {
    const existingButton = document.getElementById('simplifyButton');
    if (existingButton) {
        existingButton.remove();
    }
}

async function simplifySelectedText(text) {
    try {
        // Show loading state
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const loadingSpan = document.createElement('span');
        loadingSpan.textContent = 'Simplifying...';
        range.deleteContents();
        range.insertNode(loadingSpan);

        console.log('Sending text to backend:', text);
        
        const response = await fetch('http://127.0.0.1:5000/simplify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify({
                text: text,
                sessionId: 'test-session',
                url: window.location.href
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received simplified text:', data.simplified);
        loadingSpan.textContent = data.simplified;

    } catch (error) {
        console.error('Error:', error);
        // Show error message in the text
        const errorSpan = document.createElement('span');
        errorSpan.textContent = 'Error: Could not connect to server. Check if Flask is running.';
        errorSpan.style.color = 'red';
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(errorSpan);
        
        // Revert to original text after 3 seconds
        setTimeout(() => {
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
        }, 3000);
    }
}