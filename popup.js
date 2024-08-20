// 設置 IndexedDB
let db;
const dbName = "ScreenshotDB";
const storeName = "screenshots";

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = (event) =>
      reject("IndexedDB error: " + event.target.error);

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
    };
  });
}

// 將 dataURL 轉換為 Blob
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// 捕獲截圖並保存到 IndexedDB
function captureAndSave() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) {
      console.error("No active tab found");
      return;
    }
    const tab = tabs[0];
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      const blob = dataURLtoBlob(dataUrl);

      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add({
        screenshot: blob,
        date: new Date(),
        title: tab.title,
        url: tab.url,
      });

      request.onsuccess = () => console.log("截圖已保存到 IndexedDB");
      request.onerror = () => console.error("保存截圖時出錯");
    });
  });
}

// 從 IndexedDB 讀取最新的截圖
function retrieveLatestScreenshot() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.openCursor(null, "prev");

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const blob = cursor.value.screenshot;
        const imageUrl = URL.createObjectURL(blob);
        resolve(imageUrl);
      } else {
        reject("沒有找到截圖");
      }
    };

    request.onerror = () => reject("讀取截圖時出錯");
  });
}

document.getElementById("closeTab").addEventListener("click", async (tab) => {
  initDB()
    .then(() => {
      captureAndSave();
    })
    .catch(console.error);
});

document.getElementById("openPage").addEventListener("click", async (tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL("query.html") });
});
