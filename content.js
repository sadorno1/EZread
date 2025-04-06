// inject font awesome for icons
console.log('Content script loaded!');
const faLink = document.createElement("link");
faLink.rel = "stylesheet";
faLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
document.head.appendChild(faLink);

// global state for selection and injected content
let selectedText = "";
let originalText = "";
let spanWrapper = null;

// handle mouse text selection and show toolbar
document.addEventListener('mouseup', function(e) {
    setTimeout(() => {
        const selection = window.getSelection();
        selectedText = selection.toString().trim();

        console.log("Mouse up detected");
        console.log("Selected text:", selectedText);

        if (!selectedText || e.target.closest('#ezread-toolbar')) {
            console.log("No text or clicked inside toolbar - ignoring");
            return;
        }

        const rect = selection.getRangeAt(0).getBoundingClientRect();
        const toolbarX = rect.left + window.scrollX;
        const toolbarY = rect.bottom + window.scrollY;
        showToolbar(toolbarX, toolbarY, selectedText);
    }, 100);
});

// utility: create styled toolbar buttons
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

// display the toolbar at the text selection
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

    // add simplify button
    toolbar.appendChild(
        createButton('<i class="fas fa-wand-magic-sparkles"></i>', 'Simplify', async () => {
            console.log('Simplify clicked');
            await simplifySelectedText(selectedText);
        }, '#E29B99')
    );

    // add read aloud button
    toolbar.appendChild(
        createButton('<i class="fas fa-headphones"></i>', 'Read', async () => {
            console.log('Read clicked');
            await readSelectedText(selectedText);
        }, '#67b1ad')
    );

    // add save button
    toolbar.appendChild(
        createButton('<i class="fas fa-bookmark"></i>', 'Save', async () => {
            console.log('Save clicked');
            await saveText(selectedText);
        }, '#CEC2ED')
    );

    document.body.appendChild(toolbar);
    console.log('Toolbar added to page');

    // remove toolbar on outside click
    document.addEventListener('mousedown', function handler(e) {
        setTimeout(() => {
            if (!toolbar.contains(e.target)) {
                removeExistingToolbar();
                document.removeEventListener('mousedown', handler);
            }
        }, 150);
    });
}

// remove any existing toolbar from page
function removeExistingToolbar() {
    const existingToolbar = document.getElementById('ezread-toolbar');
    if (existingToolbar) {
        existingToolbar.remove();
    }
}

// get simplification level from chrome storage
async function getSimplificationLevel() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['simplifyLevel'], (result) => {
            resolve(result.simplifyLevel || 2);
        });
    });
}

// call backend to simplify selected text and replace in page
async function simplifySelectedText(text) {
    try {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        const loadingSpan = document.createElement('span');
        loadingSpan.textContent = 'Simplifying...';

        range.deleteContents();
        range.insertNode(loadingSpan);
        const level = await getSimplificationLevel();
        console.log(" Using simplification level:", level);

        const response = await fetch('http://127.0.0.1:5000/simplify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify({
                text: text,
                level: level,
                sessionId: 'test-session',
                url: window.location.href
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
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

// save selected text to backend server
async function saveText(text) {
    try {
        const response = await fetch("http://localhost:5000/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sessionId: "test-session",
                text: text,
                simplified: "",
                url: window.location.href
            })
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const result = await response.json();
        console.log("Saved:", result.message);
    } catch (err) {
        console.error("Error saving text:", err);
    }
}

// generate or retrieve session id and store in local storage
function getOrCreateSessionId() {
    let sessionId = localStorage.getItem("ezread-session");
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("ezread-session", sessionId);
    }
    return sessionId;
}

// get current voice speed from chrome storage
async function getSpeed() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['voiceSpeed'], (result) => {
            resolve(result.voiceSpeed || 1);
        });
    });
}

// send selected text to backend for tts and sync word highlighting
async function readSelectedText(text) {
    injectSpannifiedText(text);
    console.log("readSelectedText called with:", text);

    try {
        const speed = await getSpeed();
        console.log(" Using speed:", speed);
        const res = await fetch("http://localhost:5000/speak", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text,
                velocity: speed
            }),
        });

        if (!res.ok) throw new Error(`Backend failed with status ${res.status}`);

        const timepointHeader = res.headers.get("X-Timepoints");
        const timepoints = timepointHeader ? JSON.parse(timepointHeader) : [];
        console.log("Timepoints:", timepoints);

        const audioBlob = await res.blob();
        const audio = new Audio(URL.createObjectURL(audioBlob));

        let syncInterval;

        audio.onplay = () => {
            console.log("Audio started");

            syncInterval = setInterval(() => {
                const currentTime = audio.currentTime;
                const active = timepoints.findLast(tp => currentTime >= tp.time);
                if (active) highlightWordByMark(active.mark);
            }, 50);
        };

        audio.onerror = (e) => {
            console.error("Audio error:", e);
            clearInterval(syncInterval);
            resetHighlights();
        };

        audio.onended = () => {
            clearInterval(syncInterval);
            resetHighlights();
        };

        audio.play();

    } catch (err) {
        console.error("Error in readSelectedText:", err);
        alert("Error in read aloud: " + err.message);
    }
}

// highlight word by ssml mark name
function highlightWordByMark(markName) {
    document.querySelectorAll("#tts-highlight-area span").forEach(el =>
        el.classList.remove("highlight")
    );

    const el = document.getElementById(markName);
    if (el) el.classList.add("highlight");
}

// reset all highlights and restore original text
function resetHighlights() {
    if (spanWrapper && originalText) {
        const textNode = document.createTextNode(originalText);
        spanWrapper.replaceWith(textNode);
        spanWrapper = null;
        originalText = "";
    }
}

// wrap each word of selected text in individual <span> tags
function injectSpannifiedText(text) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    originalText = range.toString();
    const words = originalText.split(/\s+/);

    spanWrapper = document.createElement("span");

    words.forEach((word, i) => {
        const wordSpan = document.createElement("span");
        wordSpan.id = `w${i}`;
        wordSpan.textContent = word + " ";
        spanWrapper.appendChild(wordSpan);
    });

    range.deleteContents();
    range.insertNode(spanWrapper);
    selection.removeAllRanges(); // clear selection after injection
}

// inject styling for highlight class
const style = document.createElement("style");
style.textContent = `
  .highlight {
    background-color: yellow;
    transition: background-color 0.2s ease;
  }
`;
document.head.appendChild(style);