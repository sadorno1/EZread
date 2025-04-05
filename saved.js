document.addEventListener('DOMContentLoaded', function() {
  console.log("Loading saved texts...");
  fetch('http://localhost:5000/get-saved-texts?sessionId=anonymous')
      .then(response => response.json())
      .then(data => {
          console.log("Received data:", data);
          displaySavedTexts(data);
      })
      .catch(error => console.error('Error fetching saved texts:', error));
});

function displaySavedTexts(texts) {
  const container = document.getElementById('saved-texts-container');
  if (!container) {
      console.error('Container not found');
      return;
  }

  texts.forEach(text => {
      const textDiv = document.createElement('div');
      textDiv.className = 'saved-text';
      textDiv.innerHTML = `
          <p>${text.text}</p>
          <small>From: ${text.url}</small>
          <small>Saved: ${new Date(text.timestamp).toLocaleString()}</small>
      `;
      container.appendChild(textDiv);
  });
}