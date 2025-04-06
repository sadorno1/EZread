// config.js

// initializes the configuration panel and its components
function initConfig() {
    const configButton = document.getElementById('configButton');
    const configPopup = document.getElementById('configPopup');
    const voiceSpeedInput = document.getElementById('voiceSpeed');
    const speedValueDisplay = document.getElementById('speedValue');

    // exit early if any required dom elements are missing
    if (!configButton || !configPopup || !voiceSpeedInput || !speedValueDisplay) {
        console.error('Missing critical elements in DOM');
        return;
    }

    // initialize individual components
    initSimplificationButtons();
    initPopupBehavior();
    initVoiceSpeedControl();
}

// initializes the behavior for opening and closing the configuration popup
function initPopupBehavior() {
    const configButton = document.getElementById('configButton');
    const configPopup = document.getElementById('configPopup');

    // set initial visibility state of the popup
    configPopup.style.display = 'none';

    // toggle popup visibility when the config button is clicked
    configButton.addEventListener('click', (e) => {
        e.stopPropagation();
        configPopup.style.display =
            configPopup.style.display === 'block' ? 'none' : 'block';
    });

    // hide the popup when clicking outside of it
    document.addEventListener('click', (e) => {
        if (!configPopup.contains(e.target) && e.target !== configButton) {
            configPopup.style.display = 'none';
        }
    });
}

// initializes the voice speed control slider and synchronizes it with storage
function initVoiceSpeedControl() {
    const voiceSpeedInput = document.getElementById('voiceSpeed');
    const speedValueDisplay = document.getElementById('speedValue');

    // load the saved voice speed from storage and update the ui
    chrome.storage.sync.get(['voiceSpeed'], (result) => {
        const speed = parseFloat(result.voiceSpeed) || 1.0;
        voiceSpeedInput.value = speed;
        speedValueDisplay.textContent = `${speed}x`;
    });

    // update the speed in ui and storage when the input value changes
    voiceSpeedInput.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        speedValueDisplay.textContent = `${speed}x`;
        chrome.storage.sync.set({
            voiceSpeed: speed
        });
    });
}

// initializes the simplification level buttons and slider, and syncs with storage
function initSimplificationButtons() {
    const buttons = document.querySelectorAll('.preset-btn');
    const simplifyStrength = document.getElementById('simplifyStrength');

    // exit if no simplification buttons are found
    if (buttons.length === 0) {
        console.warn('No simplification buttons found');
        return;
    }

    // load the saved simplification level and update the ui
    chrome.storage.sync.get(['simplifyLevel'], (result) => {
        const level = parseInt(result.simplifyLevel) || 2;
        updateActiveButton(buttons, level);
        if (simplifyStrength) simplifyStrength.value = level;
    });

    // handle click events on preset buttons
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const level = safeParseInt(this.dataset.level, 2);
            chrome.storage.sync.set({
                simplifyLevel: level
            }, () => {
                updateActiveButton(buttons, level);
            });
        });
    });

    // handle input events on the optional slider
    if (simplifyStrength) {
        simplifyStrength.addEventListener('input', function() {
            const level = safeParseInt(this.value, 2);
            chrome.storage.sync.set({
                simplifyLevel: level
            }, () => {
                updateActiveButton(buttons, level);
            });
        });
    }
}

// parses an integer value safely, falling back to a default if invalid
function safeParseInt(value, fallback = 2) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? fallback : parsed;
}

// updates the active state of the simplification buttons based on the selected level
function updateActiveButton(buttons, level) {
    buttons.forEach(btn => {
        const btnLevel = safeParseInt(btn.dataset.level);
        btn.classList.toggle('active', btnLevel === level);
    });
}

// initialize the config panel once the dom is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfig);
} else {
    initConfig();
}