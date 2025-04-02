// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Send a message to the content script
  chrome.tabs.sendMessage(tab.id, { action: "showSummary" });
});

// Listen for message to open options
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "openOptions") {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    sendResponse({success: true});
  }
  return true; // Keep the message channel open for async response
});