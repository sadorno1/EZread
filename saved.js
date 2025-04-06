document.addEventListener('DOMContentLoaded', function() {
console.log("Loading saved texts...");
  
fetch('http://localhost:5000/history?sessionId=test-session')
  .then(response => {
    console.log("Response status:", response.status);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log("Data received:", data);
    if (data && data.length > 0) {
      displaySavedTexts(data);
    } else {
      console.log("No texts found");
      displayNoTexts();
    }
  })
  .catch(error => {
    console.error('Detailed error:', error);
    displayError();
    });
});

async function deleteText(textId, buttonElement) {
  try {
    const response = await fetch(`http://localhost:5000/delete/${textId}`, {
      method: 'DELETE'
  });

  if (response.ok) {
    const noteElement = buttonElement.closest('.saved-text');
    noteElement.remove();
      
    if (document.getElementsByClassName('saved-text').length === 0) {
      displayNoTexts();
      }
  } else {
      console.error('Failed to delete text');
  }
} catch (error) {
    console.error('Error deleting text:', error);
  }
}

function displayNoTexts() {
  const container = document.getElementById('saved-texts-container');
  container.innerHTML = `
    <div class="no-texts">
      <svg style="width:48px;height:48px;margin-bottom:10px" viewBox="0 0 24 24">
        <path fill="#666" d="M3,7V5H5V4C5,2.89 5.9,2 7,2H13V9L15.5,7.5L18,9V2H19C20.05,2 21,2.95 21,4V20C21,21.05 20.05,22 19,22H7C5.95,22 5,21.05 5,20V19H3V17H5V13H3V11H5V7H3M7,11H5V13H7V11M7,7V5H5V7H7M7,19V17H5V19H7Z"/>
      </svg>
        <p>No saved texts found</p>
    </div>
  `;
}

function displayError() {
  const container = document.getElementById('saved-texts-container');
  container.innerHTML = `
    <p style="color: red; text-align: center;">
      Error loading saved texts.<br>
      Please make sure the server is running at http://localhost:5000
    </p>
    `;
}

function displaySavedTexts(texts) {
const container = document.getElementById('saved-texts-container');
if (!container) {
  console.error('Container not found!');
  return;
}
container.innerHTML = ''; // Clear any existing content

texts.forEach(text => {
  const textElement = document.createElement('div');
  textElement.className = 'saved-text';
  
    // Format the date nicely
  const date = new Date(text.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

    // Create delete button separately
    const deleteButton = document.createElement('div');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = 'x';
    deleteButton.style.display = 'flex';
    deleteButton.style.alignItems = 'center';
    deleteButton.style.justifyContent = 'center';
    
    // Add the event listener to the delete button
    deleteButton.addEventListener('click', () => deleteText(text._id, deleteButton));

    textElement.appendChild(deleteButton); // Add delete button to the text element

    // Add the rest of the content
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `
      <div class="text-content">${text.text || ''}</div>
      <div class="text-url">
        <svg style="width:12px;height:12px;vertical-align:middle" viewBox="0 0 24 24">
            <path fill="#666" d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z"/>
        </svg>
        ${text.url || 'Unknown source'}
      </div>
      <div class="text-date">
        <svg style="width:12px;height:12px;vertical-align:middle" viewBox="0 0 24 24">
            <path fill="#999" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
        </svg>
          ${formattedDate}
      </div>
      ${text.note ? `
        <div class="text-note">
            <svg style="width:14px;height:14px;vertical-align:middle" viewBox="0 0 24 24">
                <path fill="#856404" d="M20,4V16H23L19,21L15,16H18V4H20M4,4V16H1L5,21L9,16H6V4H4Z"/>
            </svg>
              Note: ${text.note}
          </div>
      ` : ''}
    `;
    textElement.appendChild(contentDiv);
    container.appendChild(textElement);
      });
  }

