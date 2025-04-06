// config.js
function initConfig() {
    // Safe element references
    const configButton = document.getElementById('configButton');
    const configPopup = document.getElementById('configPopup');
    const voiceSpeedInput = document.getElementById('voiceSpeed');
    const speedValueDisplay = document.getElementById('speedValue');

    // Early exit if critical elements missing
    if (!configButton || !configPopup || !voiceSpeedInput || !speedValueDisplay) {
        console.error('Missing critical elements in DOM');
        return;
    }

    // Initialize all components
    initSimplificationButtons();
    initPopupBehavior();
    initVoiceSpeedControl();
}

function initPopupBehavior() {
    const configButton = document.getElementById('configButton');
    const configPopup = document.getElementById('configPopup');

    // Set initial state
    configPopup.style.display = 'none';

    // Toggle popup
    configButton.addEventListener('click', (e) => {
        e.stopPropagation();
        configPopup.style.display = 
            configPopup.style.display === 'block' ? 'none' : 'block';
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!configPopup.contains(e.target) && e.target !== configButton) {
            configPopup.style.display = 'none';
        }
    });
}

function initVoiceSpeedControl() {
    const voiceSpeedInput = document.getElementById('voiceSpeed');
    const speedValueDisplay = document.getElementById('speedValue');

    // Load saved speed
    chrome.storage.sync.get(['voiceSpeed'], (result) => {
        const speed = parseFloat(result.voiceSpeed) || 1.0;
        voiceSpeedInput.value = speed;
        speedValueDisplay.textContent = `${speed}x`;
    });

    // Save speed changes
    voiceSpeedInput.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        speedValueDisplay.textContent = `${speed}x`;
        chrome.storage.sync.set({ voiceSpeed: speed });
    });
}

function initSimplificationButtons() {
    const buttons = document.querySelectorAll('.preset-btn');
    const simplifyStrength = document.getElementById('simplifyStrength');

    // Validate elements exist
    if (buttons.length === 0) {
        console.warn('No simplification buttons found');
        return;
    }

    // Load saved level
    chrome.storage.sync.get(['simplifyLevel'], (result) => {
        const level = parseInt(result.simplifyLevel) || 2; // Default to Balanced
        updateActiveButton(buttons, level);
        if (simplifyStrength) simplifyStrength.value = level;
    });

    // Button click handler
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const level = safeParseInt(this.dataset.level, 2);
            chrome.storage.sync.set({ simplifyLevel: level }, () => {
                updateActiveButton(buttons, level);
            });
        });
    });

    // Optional slider handler
    if (simplifyStrength) {
        simplifyStrength.addEventListener('input', function() {
            const level = safeParseInt(this.value, 2);
            chrome.storage.sync.set({ simplifyLevel: level }, () => {
                updateActiveButton(buttons, level);
            });
        });
    }
}

// Helper function
function safeParseInt(value, fallback = 2) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? fallback : parsed;
}

function updateActiveButton(buttons, level) {
    buttons.forEach(btn => {
        const btnLevel = safeParseInt(btn.dataset.level);
        btn.classList.toggle('active', btnLevel === level);
    });
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfig);
} else {
    initConfig();
}