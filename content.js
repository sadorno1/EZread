async function simplifySelectedText(text) {
  try {
      // Show loading state
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const loadingSpan = document.createElement('span');
      loadingSpan.textContent = 'Simplifying...';
      range.deleteContents();
      range.insertNode(loadingSpan);

      console.log('Sending text to backend:', text);
      
      // Check if server is accessible
      try {
          const response = await fetch('http://localhost:5000/simplify', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
              },
              mode: 'cors',
              body: JSON.stringify({
                  text: text,
                  sessionId: 'test-session',
                  url: window.location.href
              })
          });

          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Received simplified text:', data.simplified);
          loadingSpan.textContent = data.simplified;

      } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          loadingSpan.textContent = 'Error: Could not connect to simplification service. Is the server running?';
          // Add visual feedback
          loadingSpan.style.color = 'red';
          
          // Revert after 3 seconds
          setTimeout(() => {
              range.deleteContents();
              range.insertNode(document.createTextNode(text));
          }, 3000);
      }

  } catch (error) {
      console.error('General error:', error);
      // If there's an error, revert to original text
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
  }
}