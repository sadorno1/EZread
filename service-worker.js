chrome.action.onClicked.addListener((tab) => {
  // Check if we can inject scripts into this tab
  if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: toggleDarkMode
    });
  }
});

function toggleDarkMode() {
  const existingStyles = document.getElementById('dark-mode-styles');
  
  if (existingStyles) {
    existingStyles.remove();
  } else {
    const style = document.createElement('style');
    style.id = 'dark-mode-styles';
    style.innerText = `
      body {
        background-color: #121212;
        color: white;
      }
      a {
        color: #1e90ff;
      }
      button, input, textarea {
        background-color: #333;
        color: white;
      }
    `;
    document.head.appendChild(style);
  }
}