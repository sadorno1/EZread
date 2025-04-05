// Dark Mode Toggle
document.getElementById('darkModeButton').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0].url.startsWith('chrome://') && !tabs[0].url.startsWith('edge://')) {
          chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function: toggleDarkMode
          });
      }
  });
});

// Speak Option
document.getElementById('speakButton').addEventListener('click', function() {
  // Add speech functionality here
  console.log('Speech button clicked');
});

// Save Option
document.getElementById('saveButton').addEventListener('click', function() {
  // Add save functionality here
  console.log('Save button clicked');
});

function toggleDarkMode() {
  const existingStyles = document.getElementById('dark-mode-styles');
  
  if (existingStyles) {
      existingStyles.remove();
  } else {
      const style = document.createElement('style');
      style.id = 'dark-mode-styles';
      style.innerText = `
          * {
              background-color: #121212 !important;
              color: #ffffff !important;
          }
          
          a {
              color: #66b3ff !important;
          }
      `;
      document.head.appendChild(style);
  }
}