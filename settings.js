
document.addEventListener('DOMContentLoaded', () => {
    const pollingIntervalInput = document.getElementById('polling-interval');
    const playSoundInput = document.getElementById('play-sound');
    const saveButton = document.getElementById('save-button');
    const tabNumbersInput = document.getElementById('tab-numbers');

    // Load saved settings
    chrome.storage.sync.get(['polling_interval', 'play_sound', 'active_tab_numbers'], (data) => {
        if (data.polling_interval) {
            pollingIntervalInput.value = data.polling_interval;
        }
        if (data.play_sound !== undefined) {
            playSoundInput.checked = data.play_sound;
        }
        if (data.active_tab_numbers) {
            tabNumbersInput.value = data.active_tab_numbers.join(', ');
        }
    });

    // Save settings
    saveButton.addEventListener('click', () => {
        const pollingInterval = pollingIntervalInput.value;
        const playSound = playSoundInput.checked;
        const tabNumbers = tabNumbersInput.value.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n > 0);

        chrome.storage.sync.set({
            polling_interval: pollingInterval,
            play_sound: playSound,
            active_tab_numbers: tabNumbers
        }, () => {
            console.log('Settings saved.');
        });
    });
});
