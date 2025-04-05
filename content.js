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
      
      // Check if server is accessible
      try {
          const response = await fetch('http://localhost:5000/simplify', {
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

      } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          loadingSpan.textContent = 'Error: Could not connect to simplification service. Is the server running?';
          // Add visual feedback
          loadingSpan.style.color = 'red';
          
          // Revert after 3 seconds
          setTimeout(() => {
              range.deleteContents();
              range.insertNode(document.createTextNode(text));
          }, 3000);
      }

  } catch (error) {
      console.error('General error:', error);
      // If there's an error, revert to original text
      const selection = window.getSelection
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
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
