var cleanupInterval = 1;
// tabs is a map id -> last accessed 
var tabs = {}

var months = [ "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
  ];

function maybeCleanup() {
  chrome.storage.sync.get({
    repeating: false
  }, function (opts) {
    if (opts.repeating) cleanup();
  });
}

function cleanup () {
  var now = Date.now();
  chrome.storage.sync.get({
    cleanupAfter: "60"
  }, function (opts) {
    getOrCreateBookmarks(now, function (parent) {
      Object.keys(tabs).forEach(function (tab) {
        accessed = tabs[tab];
        if (now - accessed > parseInt(opts.cleanupAfter)*60*1000) {
          cleanupTab(parseInt(tab), parent);
        }
      });
    });
  });
}

function getOrCreateBookmarks (now, cb) {
  var root = { title: "Garbage Collector" };
  chrome.bookmarks.search(root, function (results) {
    if (results.length == 0) {
      chrome.bookmarks.create(root, function (created) {
        getOrCreateHourBookmark(now, created, cb);
      });
    } else {
      getOrCreateHourBookmark(now, results[0], cb);
    }
  });
}

function title (time) {
  var t = new Date(time);
  var hour = t.getHours();
  var suffix = hour < 12 ? 'am' : 'pm';
  if (hour == 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }

  var d = t.getDate();
  var m = months[t.getMonth()];
  var y = t.getFullYear();
  var dateStr = d + " " + m + " " + y;

  return "Garbage Collected for " + dateStr + ", " + hour + suffix;
}

function getOrCreateHourBookmark(now, parent, cb) {
  var hourTitle = title(now);
  chrome.bookmarks.getChildren(parent.id, function (children) {
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.title == hourTitle) {
        return cb(child);
      }
    }
    var bookmark = { parentId: parent.id, title: hourTitle };
    chrome.bookmarks.create(bookmark, function (created) {
      return cb(created);
    });
  });
}


function cleanupTab (tab, parentBookmark) {
  chrome.tabs.get(tab, function (tab) {
    if (!tab) {
      tabs.delete(tab);
      return;
    }
    if (tab.pinned || tab.highlighted) {
      return;
    }
    var bookmark = {
      parentId: parentBookmark.id
    , title: tab.title
    , url: tab.url
    };
    chrome.bookmarks.create(bookmark, function (created) {
      if (created) {
        chrome.tabs.remove(tab.id);
      } else {
        console.log("Could not create bookmark");
      }
    });
  });
}

function tabTouched (tab) {
  tabs[tab] = Date.now();
}

chrome.tabs.onCreated.addListener(function (tab) {
  tabTouched(tab.id);
});

chrome.tabs.onActivated.addListener(function (info) {
  tabTouched(info.tabId);
});

chrome.alarms.create("cleanup", { delayInMinutes: cleanupInterval, periodInMinutes: cleanupInterval });

chrome.alarms.onAlarm.addListener(maybeCleanup);

chrome.browserAction.onClicked.addListener(cleanup);
