// font.js
document.getElementById('fontSelect').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0].url.startsWith('chrome://') && !tabs[0].url.startsWith('edge://')) {
          chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function: toggleOpenDyslexicFont
          });
          
          chrome.scripting.insertCSS({
              target: { tabId: tabs[0].id },
              css: `
                  @font-face {
                      font-family: 'OpenDyslexic';
                      src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic/OpenDyslexic-Regular.otf') format('opentype');
                  }
                  
                  * {
                      font-family: 'OpenDyslexic' !important;
                  }
                  
                  p, div, span, a, h1, h2, h3, h4, h5, h6 {
                      line-height: 1.5 !important;
                      letter-spacing: 0.5px !important;
                  }
              `
          });
      }
  });
});