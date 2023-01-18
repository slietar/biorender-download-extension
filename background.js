chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if ((changeInfo.status == 'loading') && (tab.url.startsWith('https://app.biorender.com/'))) {
    chrome.scripting.executeScript({
      args: [chrome.runtime.id],
      target: { tabId },
      world: 'MAIN',
      func: (extId) => {
        let oldImage = window.Image;

        window.Image = class {
          constructor() {
            let image = new oldImage();

            image.addEventListener('load', () => {
              if (image.src.startsWith('data:image/svg+xml,')) {
                chrome.runtime.sendMessage(extId, {
                  type: 'image',
                  data: image.src
                });
              }
            });

            return image;
          }
        };
      }
    });
  }
})


let images = [];

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === 'image') {
    let image = {
      id: crypto.randomUUID(),
      data: request.data
    };

    images.push(image);
    chrome.runtime.sendMessage({
      type: 'image',
      image
    }, () => {
      chrome.runtime.lastError;
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'query') {
    sendResponse(images);
  }

  if (request.type === 'remove') {
    images = images.filter((image) => image.id !== request.imageId);
  }
});
