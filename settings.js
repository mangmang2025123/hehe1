
document.addEventListener('DOMContentLoaded', () => {
    const pollingIntervalInput = document.getElementById('polling-interval');
    const playSoundInput = document.getElementById('play-sound');
    const saveButton = document.getElementById('save-button');

    // Load saved settings
    chrome.storage.sync.get(['polling_interval', 'play_sound'], (data) => {
        if (data.polling_interval) {
            pollingIntervalInput.value = data.polling_interval;
        }
        if (data.play_sound !== undefined) {
            playSoundInput.checked = data.play_sound;
        }
    });

    // Save settings
    saveButton.addEventListener('click', () => {
        const pollingInterval = pollingIntervalInput.value;
        const playSound = playSoundInput.checked;
        chrome.storage.sync.set({ polling_interval: pollingInterval, play_sound: playSound }, () => {
            console.log('Settings saved.');
        });
    });
});
