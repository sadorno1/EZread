console.log('Content script loaded!');
const faLink = document.createElement("link");
faLink.rel = "stylesheet";
faLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
document.head.appendChild(faLink);

document.addEventListener('mouseup', function(e) {
    console.log('Mouse up detected');
    
    // Don't trigger if we're clicking inside the toolbar
    if (e.target.closest('#ezread-toolbar')) {
        console.log('Clicked inside toolbar - ignoring');
        return;
    }

    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        console.log('Selected text:', selectedText);
        
        if (selectedText.length > 0) {
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            const toolbarX = rect.left + window.scrollX;
            const toolbarY = rect.bottom + window.scrollY;
            showToolbar(toolbarX, toolbarY, selectedText);
        }
    }, 100);
});

function createButton(icon, text, onClick, backgroundColor) {
    const button = document.createElement('button');
    button.style.cssText = `
        padding: 8px 14px;
        margin: 0 5px;
        background-color: ${backgroundColor};
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-family: system-ui, sans-serif;
        gap: 5px;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transition: background 0.2s, transform 0.2s;

    `;

    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = icon; 
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;

    button.appendChild(iconSpan);
    button.appendChild(textSpan);

    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
    });

    button.addEventListener('mouseover', () => {
        button.style.filter = 'brightness(85%)';
    });

    button.addEventListener('mouseout', () => {
        button.style.filter = 'brightness(100%)';
    });

    return button;
}

function showToolbar(x, y, selectedText) {
    console.log('Showing toolbar');
    removeExistingToolbar();

    const toolbar = document.createElement('div');
    toolbar.id = 'ezread-toolbar';
    toolbar.style.cssText = `
        position: fixed;
        z-index: 999999;
        top: ${y}px;
        left: ${x}px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        border: 1px solid #ddd;
        border-radius: 12px;
        padding: 10px 14px;
        display: flex;
        gap: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        animation: fadeIn 0.2s ease-in-out;
  `;

    // Add Simplify button (orangeish)
    toolbar.appendChild(
        createButton('<i class="fas fa-wand-magic-sparkles"></i>', 'Simplify', async () => {
            console.log('Simplify clicked');
            await simplifySelectedText(selectedText);
        }, '#E29B99')
    );

    // Add Read Aloud button (blue-green)
    toolbar.appendChild(
        createButton('<i class="fas fa-headphones"></i>', 'Read', async () => {
          console.log('Read clicked');
          await readSelectedText(selectedText); 
        }, '#67b1ad')

    );

    // Add Save button (lilac)
    toolbar.appendChild(
        createButton('<i class="fas fa-bookmark"></i>', 'Save', () => {
            console.log('Save clicked');
            saveText(selectedText);
            await saveText(selectedText); 
        }, '#CEC2ED')
    );

    document.body.appendChild(toolbar);
    console.log('Toolbar added to page');

    // Remove toolbar when clicking outside
    document.addEventListener('mousedown', function handler(e) {
        if (!toolbar.contains(e.target)) {
            removeExistingToolbar();
            document.removeEventListener('mousedown', handler);
        }
    });
}

function removeExistingToolbar() {
    const existingToolbar = document.getElementById('ezread-toolbar');
    if (existingToolbar) {
        existingToolbar.remove();
    }
}

async function simplifySelectedText(text) {
    console.log('Starting text simplification');
    try {
        // Get the selection and range
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        // Get the full text content
        const textNode = range.startContainer;
        const fullText = textNode.textContent;
        
        // Find the boundaries of the selected text within the full text
        const selectedStart = range.startOffset;
        const selectedEnd = range.endOffset;
        
        // Find word boundaries
        let startWord = selectedStart;
        let endWord = selectedEnd;
        
        // Find start of first word
        while (startWord > 0 && fullText[startWord - 1] !== ' ') {
            startWord--;
        }
        
        // Find end of last word
        while (endWord < fullText.length && fullText[endWord] !== ' ') {
            endWord++;
        }
        
        // Get the complete words
        const completeWords = fullText.substring(startWord, endWord);
        console.log('Complete words to simplify:', completeWords);

        // Show loading state
        const loadingSpan = document.createElement('span');
        loadingSpan.textContent = 'Simplifying...';
        
        // Update the range to include complete words
        range.setStart(textNode, startWord);
        range.setEnd(textNode, endWord);
        range.deleteContents();
        range.insertNode(loadingSpan);

        console.log('Sending request to backend');
        const response = await fetch('http://127.0.0.1:5000/simplify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify({
                text: completeWords,
                sessionId: 'test-session',
                url: window.location.href
            })
        });

        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received response:', data);
        loadingSpan.textContent = data.simplified;

    } catch (error) {
        console.error('Error in simplifySelectedText:', error);
        const errorSpan = document.createElement('span');
        errorSpan.textContent = `Error: ${error.message}. Is the server running?`;
        errorSpan.style.color = 'red';
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(errorSpan);
        
        setTimeout(() => {
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
        }, 3000);
    }
}

//highlight style
const style = document.createElement("style");
style.innerHTML = `
  .ezread-word.highlight {
    background-color: #cbe3ff;
    border-radius: 4px;
    padding: 1px 3px;
  }
`;
document.head.appendChild(style);


async function readSelectedText(text) {
  console.log(" readSelectedText called with:", text);

  try {
    const res = await fetch("http://localhost:5000/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      console.error(" Backend returned:", res.status);
      alert("TTS error: Backend failed with status " + res.status);
      return;
    }

    const audioBlob = await res.blob();
    const audio = new Audio(URL.createObjectURL(audioBlob));

    audio.onplay = () => console.log("Audio is playing");
    audio.onerror = e => {
      console.error(" Audio error:", e);
      alert("Audio couldn't be played. Check if the MP3 file is valid.");
    };

    audio.play();

  } catch (err) {
    console.error(" Error in readSelectedText:", err);
    alert("Something went wrong with read aloud. See console for details.");
  }
}
