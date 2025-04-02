document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('summarize').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "showSummary"});
      window.close();
    });
  });
  
  document.getElementById('options').addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  });
});