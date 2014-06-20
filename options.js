// Saves options to chrome.storage
function save_options() {
  var cleanupAfter = document.getElementById('cleanupAfter').value;
  var repeating = document.getElementById('repeating').checked;
  var icon = {
    path: repeating ? 'icon-enabled-48.png' : 'icon-disabled-48.png'
  };
  chrome.browserAction.setIcon(icon);
  chrome.storage.sync.set({
    cleanupAfter: cleanupAfter,
    repeating: repeating
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    cleanupAfter: "60",
    repeating: false
  }, function(items) {
    document.getElementById('cleanupAfter').value = items.cleanupAfter;
    document.getElementById('repeating').checked = items.repeating;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
