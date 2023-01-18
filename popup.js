import htm from 'htm';
import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

const html = htm.bind(h);


function App() {
  let [images, setImages] = useState([]);
  let [tab, setTab] = useState(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.runtime.sendMessage({ type: 'query' }, (images) => {
        setImages(images);
        setTab(tab);

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (request.type === 'image') {
            setImages((images) => [...images, request.image]);
          }
        });
      });
    });
  }, []);

  return (
    html`
      ${(images.length < 1)
        ? html`<p>No images</p>`
        : html`<div className="list">
          ${images.map((image) => (
            html`<${AppImage}
              image=${image}
              tab=${tab}
              remove=${() => void setImages(images.filter((testImage) => testImage.id !== image.id))}
              key=${image.id} />`
          ))}
        </div>`}
    `
  );
}


function AppImage(props) {
  let decodedData = decode(props.image.data);
  let processedData = process(parseSvg(decodedData));

  return (
    html`<div>
      <div className="actions">
        <button type="button" onClick=${() => {
          chrome.downloads.download({
            url: props.image.data,
            filename: props.image.id + '-original.svg'
          });
        }}>Download original</button>
        <button type="button" onClick=${() => {
          chrome.downloads.download({
            url: URL.createObjectURL(new Blob([processedData], { type: 'image/svg+xml' })),
            filename: props.image.id + '-processed.svg'
          });
        }}>Download processed</button>
        ${props.tab.url.startsWith('https://www.figma.com/') && (
          html`<button type="button" onClick=${() => {
            chrome.scripting.executeScript({
              args: [processedData],
              target: { tabId: props.tab.id },
              world: 'MAIN',
              func: (processedData) => {
                window.figma.createNodeFromSvg(processedData);
              }
            });
          }}>Inject</button>`
        )}
        <button type="button" onClick=${() => {
          props.remove();
          chrome.runtime.sendMessage({ type: 'remove', imageId: props.image.id });
        }}>Remove</button>
      </div>
      <div dangerouslySetInnerHTML=${{ __html: decodedData }} />
    </div>`
  );
}


render(html`<${App} />`, document.querySelector('main'));


function decode(input) {
  return decodeURIComponent(input.slice('data:image/svg+xml,'.length));
}

function parseSvg(input) {
  return new DOMParser().parseFromString(input, 'image/svg+xml').documentElement;
}

function process(svg) {
  for (let imageEl of svg.querySelectorAll('image')) {
    let attr = imageEl.getAttribute('xlink:href');
    let svgEl = parseSvg(decode(attr));
    let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    g.setAttribute('style', 'stroke-width: 1px;');
    g.setAttribute('transform', `translate(${imageEl.getAttribute('x') ?? 0} ${imageEl.getAttribute('y') ?? 0})`);
    g.append(...svgEl.childNodes);

    imageEl.parentElement.replaceChild(g, imageEl);
  }

  return new XMLSerializer().serializeToString(svg);
}
