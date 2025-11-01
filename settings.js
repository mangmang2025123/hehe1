
document.addEventListener('DOMContentLoaded', () => {
    const pollingIntervalInput = document.getElementById('polling-interval');
    const playSoundInput = document.getElementById('play-sound');
    const saveButton = document.getElementById('save-button');
    const tabList = document.getElementById('tab-list');

    let activeTabs = new Set();

    // Load saved settings
    chrome.storage.sync.get(['polling_interval', 'play_sound', 'active_tabs'], (data) => {
        if (data.polling_interval) {
            pollingIntervalInput.value = data.polling_interval;
        }
        if (data.play_sound !== undefined) {
            playSoundInput.checked = data.play_sound;
        }
        if (data.active_tabs) {
            activeTabs = new Set(data.active_tabs);
        }
        populateTabList();
    });

    // Save settings
    saveButton.addEventListener('click', () => {
        const pollingInterval = pollingIntervalInput.value;
        const playSound = playSoundInput.checked;
        chrome.storage.sync.set({ polling_interval: pollingInterval, play_sound: playSound }, () => {
            console.log('Settings saved.');
        });
    });

    function populateTabList() {
        chrome.tabs.query({}, (tabs) => {
            tabList.innerHTML = ''; // Clear existing list
            for (const tab of tabs) {
                const listItem = document.createElement('li');
                const tabTitle = document.createElement('span');
                tabTitle.textContent = tab.title || tab.url;
                listItem.appendChild(tabTitle);

                const toggleButton = document.createElement('button');
                const isActive = activeTabs.has(tab.id);
                toggleButton.textContent = isActive ? 'Deactivate' : 'Activate';
                toggleButton.dataset.tabId = tab.id;
                toggleButton.dataset.isActive = isActive;

                toggleButton.addEventListener('click', handleToggle);

                listItem.appendChild(toggleButton);
                tabList.appendChild(listItem);
            }
        });
    }

    function handleToggle(event) {
        const button = event.target;
        const tabId = parseInt(button.dataset.tabId);
        const isActive = button.dataset.isActive === 'true';

        if (isActive) {
            chrome.runtime.sendMessage({ command: 'deactivate', tabId: tabId }, (response) => {
                if (response.status === 'deactivated') {
                    button.textContent = 'Activate';
                    button.dataset.isActive = 'false';
                    activeTabs.delete(tabId);
                }
            });
        } else {
            chrome.runtime.sendMessage({ command: 'activate', tabId: tabId }, (response) => {
                if (response.status === 'activated') {
                    button.textContent = 'Deactivate';
                    button.dataset.isActive = 'true';
                    activeTabs.add(tabId);
                } else {
                    // Handle injection failure (e.g., show an error)
                    console.error(`Failed to activate on tab ${tabId}`);
                }
            });
        }
    }
});
