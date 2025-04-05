function displaySimplified(text) {
    const words = text.split(" ");
    const html = words.map((word, i) =>
      `<span class="word" id="word-${i}">${word}</span>`
    ).join(" ");
    document.getElementById("output").innerHTML = html;
  }
  
  async function playWithHighlights(text) {
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
  
    timepoints.forEach(({ mark, time }) => {
      const wordIndex = parseInt(mark.replace("w", ""));
      setTimeout(() => {
        document.querySelectorAll(".word").forEach(w => w.classList.remove("highlight"));
        const el = document.getElementById(`word-${wordIndex}`);
        if (el) el.classList.add("highlight");
      }, time * 1000);
    });
  }
  
  document.getElementById("readBtn").addEventListener("click", () => {
    const text = document.getElementById("output").innerText;
    playWithHighlights(text);
  });
  