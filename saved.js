document.addEventListener('DOMContentLoaded', function() {
  fetchSavedTexts();
});

function fetchSavedTexts() {
  // Replace with your session ID logic
  const sessionId = 'anonymous'; 

  fetch(`http://localhost:5000/get-saved-texts?sessionId=${sessionId}`)
      .then(response => response.json())
      .then(texts => {
          displaySavedTexts(texts);
      })
      .catch(error => console.error('Error:', error));
}

function displaySavedTexts(texts) {
  const container = document.getElementById('saved-texts-container');
  container.innerHTML = '';

  texts.forEach(text => {
      const textElement = document.createElement('div');
      textElement.className = 'saved-text';
      textElement.innerHTML = `
          <div class="text-content">${text.text}</div>
          <div class="text-url">From: ${text.url}</div>
          <div class="timestamp">Saved: ${new Date(text.timestamp).toLocaleString()}</div>
      `;
      container.appendChild(textElement);
  });
}