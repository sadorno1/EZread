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

function toggleDarkMode() {
  const existingStyles = document.getElementById('dark-mode-styles');
  
  if (existingStyles) {
      existingStyles.remove();
  } else {
      const style = document.createElement('style');
      style.id = 'dark-mode-styles';
      style.innerText = `
          /* Target everything first */
          * {
              background-color: #121212 !important;
              color: #ffffff !important;
          }

          /* Specific elements that might need different styling */
          body, div, p, span, h1, h2, h3, h4, h5, h6,
          article, aside, footer, header, main, nav, section,
          table, tr, td, th, ul, ol, li, dl, dt, dd,
          blockquote, pre, code {
              background-color: #121212 !important;
              color: #ffffff !important;
          }

          /* Links */
          a {
              color: #66b3ff !important;
          }

          /* Form elements */
          input, textarea, select, button {
              background-color: #333333 !important;
              color: #ffffff !important;
              border-color: #666666 !important;
          }

          /* Force text color for any text-containing elements */
          [class*="text"], [class*="Text"],
          [class*="title"], [class*="Title"],
          [class*="content"], [class*="Content"],
          [class*="description"], [class*="Description"] {
              color: #ffffff !important;
          }

          /* Force background color for any container elements */
          [class*="container"], [class*="Container"],
          [class*="wrapper"], [class*="Wrapper"],
          [class*="section"], [class*="Section"],
          [class*="background"], [class*="Background"] {
              background-color: #121212 !important;
          }

          /* Override any light theme classes */
          [class*="light"], [class*="Light"] {
              background-color: #121212 !important;
              color: #ffffff !important;
          }

          /* Ensure inline text elements are white */
          span, strong, em, b, i {
              color: #ffffff !important;
          }

          /* Code blocks and pre-formatted text */
          pre, code, .code {
              background-color: #1e1e1e !important;
              color: #e0e0e0 !important;
          }
      `;
      document.head.appendChild(style);
  }
}