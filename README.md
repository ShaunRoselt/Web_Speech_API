# Web Speech API Demo

A plain HTML, CSS, and JavaScript demo app for the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API).

## Features

- Top-level tabs for **Text to Speech** and **Speech to Text**
- Speech synthesis controls for voice, rate, pitch, and volume
- Speech recognition controls for language, continuous mode, and interim results
- Browser support messaging for both Web Speech API capabilities
- Responsive layout that works well on desktop and mobile screens

## Running the demo

Because this is a static app, you can either:

- open `index.html` directly in a browser, or
- serve the repository root with any static file server

Example:

```bash
cd path/to/Web_Speech_API
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
