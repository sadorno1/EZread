// handle dom content loaded
document.addEventListener('DOMContentLoaded', function() {

    // attach click listener to dark mode toggle button
    document.getElementById('darkModeButton').addEventListener('click', function() {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            // prevent script injection on browser-internal pages
            if (!tabs[0].url.startsWith('chrome://') && !tabs[0].url.startsWith('edge://')) {
                chrome.scripting.executeScript({
                    target: {
                        tabId: tabs[0].id
                    },
                    function: toggleDarkMode
                });
            }
        });
    });

    // open saved.html in a new popup window when "view saved" button is clicked
    document.getElementById('viewSaved').addEventListener('click', function() {
        chrome.windows.create({
            url: 'saved.html',
            type: 'popup',
            width: 400,
            height: 600
        });
    });
});

// toggles dark mode styles on the current page
function toggleDarkMode() {
    const existingStyles = document.getElementById('dark-mode-styles');

    // remove dark mode if already applied
    if (existingStyles) {
        existingStyles.remove();
    } else {
        // otherwise inject dark mode styles
        const style = document.createElement('style');
        style.id = 'dark-mode-styles';
        style.innerText = `
          * {
              background-color: #121212 !important;
              color: #ffffff !important;
          }

          /* specific elements that might need different styling */
          body, div, p, span, h1, h2, h3, h4, h5, h6,
          article, aside, footer, header, main, nav, section,
          table, tr, td, th, ul, ol, li, dl, dt, dd,
          blockquote, pre, code {
              background-color: #121212 !important;
              color: #ffffff !important;
          }

          /* links */
          a {
              color: #66b3ff !important;
          }

          /* form elements */
          input, textarea, select, button {
              background-color: #333333 !important;
              color: #ffffff !important;
              border-color: #666666 !important;
          }

          /* force text color for any text-containing elements */
          [class*="text"], [class*="Text"],
          [class*="title"], [class*="Title"],
          [class*="content"], [class*="Content"],
          [class*="description"], [class*="Description"] {
              color: #ffffff !important;
          }

          /* force background color for any container elements */
          [class*="container"], [class*="Container"],
          [class*="wrapper"], [class*="Wrapper"],
          [class*="section"], [class*="Section"],
          [class*="background"], [class*="Background"] {
              background-color: #121212 !important;
          }

          /* override any light theme classes */
          [class*="light"], [class*="Light"] {
              background-color: #121212 !important;
              color: #ffffff !important;
          }

          /* ensure inline text elements are white */
          span, strong, em, b, i {
              color: #ffffff !important;
          }

          /* code blocks and pre-formatted text */
          pre, code, .code {
              background-color: #1e1e1e !important;
              color: #e0e0e0 !important;
          }
      `;
        document.head.appendChild(style);
    }
}