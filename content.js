console.log("EZRead content script active");

console.log('Content script loaded - EZRead v1.0');

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

function createButton(icon, text, onClick) {
    const button = document.createElement('button');
    button.style.cssText = `
        padding: 5px 10px;
        margin: 0 5px;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
    `;

    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    
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
        button.style.backgroundColor = '#e0e0e0';
    });

    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#f0f0f0';
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
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        display: flex;
        gap: 5px;
    `;

    // Add Simplify button
    toolbar.appendChild(
        createButton('🔄', 'Simplify', async () => {
            console.log('Simplify clicked');
            await simplifySelectedText(selectedText);
        })
    );

    // Add Read Aloud button
    toolbar.appendChild(
        createButton('🔊', 'Read', () => {
            console.log('Read clicked');
            speakText(selectedText);
        })
    );

    // Add Save button
    toolbar.appendChild(
        createButton('💾', 'Save', () => {
            console.log('Save clicked');
            saveText(selectedText);
        })
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

async function speakText(text) {
    try {
        const response = await fetch('http://127.0.0.1:5000/speak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
    } catch (error) {
        console.error('Error in text-to-speech:', error);
        alert('Error: Could not convert text to speech');
    }
}


let ttsButton;

document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString().trim();

  //remove any existing button
  if (ttsButton) ttsButton.remove();

  if (selectedText.length > 0) {
    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect();

    //create floating button
    ttsButton = document.createElement("button");
    ttsButton.innerText = "🔊";
    ttsButton.style.position = "fixed";
    ttsButton.style.top = `${rect.top + window.scrollY - 40}px`;
    ttsButton.style.left = `${rect.left + window.scrollX}px`;
    ttsButton.style.zIndex = 9999;
    ttsButton.style.padding = "6px 10px";
    ttsButton.style.fontSize = "13px";
    ttsButton.style.background = "#1e88e5";
    ttsButton.style.color = "#fff";
    ttsButton.style.border = "none";
    ttsButton.style.borderRadius = "5px";
    ttsButton.style.cursor = "pointer";
    ttsButton.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.3)";
    ttsButton.style.transition = "opacity 0.3s ease";

    document.body.appendChild(ttsButton);

    ttsButton.addEventListener("click", () => {
      readSelectedText(selectedText);
      ttsButton.remove();
    });
  }
});

async function readSelectedText(text) {
  const res = await fetch("http://localhost:5000/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const timepointsJSON = res.headers.get("X-Timepoints");
  const timepoints = JSON.parse(timepointsJSON);
  const audioBlob = await res.blob();
  const audio = new Audio(URL.createObjectURL(audioBlob));
  audio.play();
  audio.onplay = () => console.log("Audio is playing");
  audio.onerror = e => console.error("Audio error:", e);


  //create highlight spans
  const spanWords = text.split(" ").map((word, i) =>
    `<span class="ezread-word" id="ezread-word-${i}">${word}</span>`
  ).join(" ");

  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);

  range.deleteContents();
  const wrapper = document.createElement("span");
  wrapper.innerHTML = spanWords;
  range.insertNode(wrapper);

  //sync highlighting with timepoints
  timepoints.forEach(({ mark, time }) => {
    const wordIndex = parseInt(mark.replace("w", ""));
    setTimeout(() => {
      document.querySelectorAll(".ezread-word").forEach(w => w.classList.remove("highlight"));
      const el = document.getElementById(`ezread-word-${wordIndex}`);
      if (el) el.classList.add("highlight");
    }, time * 1000);
  });
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
