# Biorender download extension for Chrome


## Setup instructions

1. Run these commands or download a built .zip release.
  ```sh
  $ npm install
  $ npm run build
  ```
2. Go to `chrome://extensions` and enable developer mode.
3. Click "Load unpacked" and select the `output` directory, or the unzipped directory if you downloaded a built release.
4. Click the "Extensions" (puzzle piece) icon next to the URL bar and pin the "Biorender download" extension.
5. Load Biorender and make sure to unselect any selected object on the canvas. After a few seconds, a picture should be visible when pressing the extension's icon.
6. Go to Figma and press "Inject" to inject the corresponding picture into the Figma canvas.
