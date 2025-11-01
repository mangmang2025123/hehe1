
let activeTabIds = new Set();
let activeTabNumbers = [];

// Function to activate the content script on a specific tab
function activateTab(tabId) {
    if (activeTabIds.has(tabId)) {
        return; // Already active
    }
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['chatgpt.js', 'content.js']
    }, () => {
        if (chrome.runtime.lastError) {
            console.error(`Failed to inject script into tab ${tabId}: ${chrome.runtime.lastError.message}`);
        } else {
            console.log(`Activated extension on tab ${tabId}`);
            activeTabIds.add(tabId);
        }
    });
}

// Function to deactivate the content script on a specific tab
function deactivateTab(tabId) {
    if (!activeTabIds.has(tabId)) {
        return; // Not active
    }
    // Reloading the tab is the simplest way to stop the content script's polling
    chrome.tabs.reload(tabId, () => {
        console.log(`Deactivated extension on tab ${tabId}`);
        activeTabIds.delete(tabId);
    });
}

// Update which tabs are active based on the current settings and tab arrangement
function updateActiveTabs() {
    chrome.tabs.query({}, (tabs) => {
        const newActiveTabIds = new Set();

        // Determine which tabs should be active
        for (const tab of tabs) {
            // Tab numbers are 1-based, tab.index is 0-based
            if (activeTabNumbers.includes(tab.index + 1)) {
                newActiveTabIds.add(tab.id);
            }
        }

        // Activate tabs that should be active but aren't
        for (const tabId of newActiveTabIds) {
            if (!activeTabIds.has(tabId)) {
                activateTab(tabId);
            }
        }

        // Deactivate tabs that are active but shouldn't be
        for (const tabId of activeTabIds) {
            if (!newActiveTabIds.has(tabId)) {
                deactivateTab(tabId);
            }
        }

        activeTabIds = newActiveTabIds;
    });
}

// Listen for changes in the saved settings
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.active_tab_numbers) {
        activeTabNumbers = changes.active_tab_numbers.newValue || [];
        updateActiveTabs();
    }
});

// Update tabs when a new tab is created, closed, or moved
chrome.tabs.onCreated.addListener(updateActiveTabs);
chrome.tabs.onRemoved.addListener(updateActiveTabs);
chrome.tabs.onMoved.addListener(updateActiveTabs);
chrome.tabs.onDetached.addListener(updateActiveTabs);
chrome.tabs.onAttached.addListener(updateActiveTabs);


// Load initial settings and run for the first time
chrome.storage.sync.get('active_tab_numbers', (data) => {
    activeTabNumbers = data.active_tab_numbers || [];
    updateActiveTabs();
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ active_tab_numbers: [] });
});
