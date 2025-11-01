
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'activate') {
        chrome.scripting.executeScript({
            target: { tabId: request.tabId },
            files: ['chatgpt.js', 'content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                sendResponse({ status: 'injection failed' });
            } else {
                console.log(`Injected script into tab ${request.tabId}`);
                // Store active state
                chrome.storage.sync.get('active_tabs', (data) => {
                    const activeTabs = new Set(data.active_tabs || []);
                    activeTabs.add(request.tabId);
                    chrome.storage.sync.set({ active_tabs: Array.from(activeTabs) });
                });
                sendResponse({ status: 'activated' });
            }
        });
    } else if (request.command === 'deactivate') {
        // Reloading the tab is the simplest way to "deactivate" the polling script.
        chrome.tabs.reload(request.tabId, () => {
             // Remove from active tabs storage
             chrome.storage.sync.get('active_tabs', (data) => {
                const activeTabs = new Set(data.active_tabs || []);
                activeTabs.delete(request.tabId);
                chrome.storage.sync.set({ active_tabs: Array.from(activeTabs) });
            });
            sendResponse({ status: 'deactivated' });
        });
    }
    return true; // Keep the message channel open for the asynchronous response
});

// When a tab is closed, remove it from the active tabs list
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.sync.get('active_tabs', (data) => {
        const activeTabs = new Set(data.active_tabs || []);
        if (activeTabs.has(tabId)) {
            activeTabs.delete(tabId);
            chrome.storage.sync.set({ active_tabs: Array.from(activeTabs) });
        }
    });
});

// Initialize active_tabs in storage on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ active_tabs: [] });
});

// On startup, re-inject scripts into active tabs
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.sync.get('active_tabs', (data) => {
        const activeTabs = data.active_tabs || [];
        for (const tabId of activeTabs) {
            // Check if the tab still exists
            chrome.tabs.get(tabId, (tab) => {
                if (tab) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['chatgpt.js', 'content.js']
                    });
                } else {
                    // Clean up non-existent tabs
                    const updatedTabs = new Set(activeTabs);
                    updatedTabs.delete(tabId);
                    chrome.storage.sync.set({ active_tabs: Array.from(updatedTabs) });
                }
            });
        }
    });
});
