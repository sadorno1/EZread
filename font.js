// font.js

// keeps track of if the OpenDyslexic font is currently applied
let isOpenDyslexicActive = false;

// add event listener to the font toggle button
document.getElementById('fontSelect').addEventListener('click', async function() {
    // debugging output – useful to check if the click event actually fired
    console.log('Font button clicked');

    try {
        // get the currently active tab in the current window
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        // make sure we don't try to inject script on chrome:// or edge:// pages
        if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
            // flip the font state: true to false or vice versa
            isOpenDyslexicActive = !isOpenDyslexicActive;

            // inject some script into the active tab
            await chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                func: function(isActive) {
                    // if user wants the accessible font
                    if (isActive) {
                        // check if the style tag already exists, don't add it twice
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
                            // add the style to the page head
                            document.head.appendChild(style);
                        }
                    } else {
                        // if we're turning it off, remove the style element
                        const style = document.getElementById('openDyslexicStyle');
                        if (style) style.remove();
                    }
                },
                args: [isOpenDyslexicActive] // pass the toggle state
            });

            // update button label and maybe style for feedback
            const button = document.getElementById('fontSelect');
            button.classList.toggle('active'); // visually indicate toggle
            button.textContent = isOpenDyslexicActive ?
                'Disable Accessible Font' :
                'Enable Accessible Font'; // text change depending on state
        }
    } catch (error) {
        // log any issues
        console.error('Error:', error);
    }
});