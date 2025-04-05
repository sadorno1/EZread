// font.js
let isOpenDyslexicActive = false;

document.getElementById('fontSelect').addEventListener('click', async function() {
// Add console.log to check if button click is registered
console.log('Font button clicked');

try {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
    isOpenDyslexicActive = !isOpenDyslexicActive;
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: function(isActive) {
          if (isActive) {
            if (!document.getElementById('openDyslexicStyle')) {
              const style = document.createElement('style');
              style.id = 'openDyslexicStyle';
              style.textContent = `
                  @font-face {
                      font-family: 'OpenDyslexic';
                      src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic/OpenDyslexic-Regular.otf') format('opentype');
                  }
                  * {
                      font-family: 'OpenDyslexic' !important;
                  }
              `;
                document.head.appendChild(style);
              }
            } else {
              const style = document.getElementById('openDyslexicStyle');
              if (style) style.remove();
            }
        },
        args: [isOpenDyslexicActive]
    });
    
  // Update button text
  const button = document.getElementById('fontSelect');
  button.classList.toggle('active');
  button.textContent = isOpenDyslexicActive ? 'Disable Accessible Font' : 'Enable Accessible Font';
    }
  } catch (error) {
      console.error('Error:', error);
  }
});