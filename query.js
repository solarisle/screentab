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

// 從 IndexedDB 讀取最新的截圖
function retrieveLatestScreenshot() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = (event) => {
      if (request.result !== undefined) {
        resolve(request.result);
      } else {
        reject("沒有找到截圖");
      }
    };

    request.onerror = () => reject("讀取截圖時出錯");
  });
}

initDB().then(() => {
  //之後可以這樣讀取和顯示最新的截圖
  retrieveLatestScreenshot()
    .then((images) => {
      displayTabsIcon(images);
      console.log(images);
    })
    .catch(console.error);
}).catch;

function displayTabsIcon(images) {
  let temp = document.querySelector("template");
  let fig = temp.content.querySelector("figure");

  images.forEach((oneImage) => {
    let clone = fig.cloneNode(true);
    let eleA = clone.querySelector("a");
    let eleImg = clone.querySelector("img");
    let eleCap = clone.querySelector("figcaption");
    eleA.href = oneImage.url;
    eleA.refid = oneImage.id;
    eleA.addEventListener("click", deleteTab);
    eleCap.textContent = oneImage.title;
    let imageUrl = URL.createObjectURL(oneImage.screenshot);
    eleImg.src = imageUrl;
    document.body.appendChild(clone);
  });
}

function deleteTab(e) {
  const transaction = db.transaction([storeName], "readwrite");
  const store = transaction.objectStore(storeName);
  store.delete(this.refid);
  console.log(this.refid);
}
