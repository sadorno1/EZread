# EZRead

EZRead is a Chrome extension designed to make online reading easier, more inclusive, and less overwhelming. It was created with a focus on accessibility and digital well-being, especially for people who experience reading fatigue, have ADHD, dyslexia, or just prefer a more supportive reading environment.

---

## Features

- Simplify selected text with three levels of rephrasing (minimal → maximum)
- Read aloud with Google TTS and real-time word highlighting
- Save and revisit important content and notes
- Toggle dark mode for low-light or light-sensitive users
- Switch to a dyslexia-friendly font (OpenDyslexic)
- Adjust speech speed and simplification strength

---

## Instructions to Run (Locally)

### 1. Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the root folder of this project

You’ll now see the EZRead icon in your extensions bar. Click it to open the popup, or highlight text on any webpage to activate the floating toolbar.

---

### 2. Backend (Flask)

This extension uses a local Flask server to handle text simplification and speech generation. It connects to both Gemini (for simplification) and Google Cloud's Text-to-Speech API, so you’ll need credentials for both.

#### Prerequisites

- Python 3.x
- A MongoDB connection string (local or hosted)
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app)
- A Google Cloud service account key (JSON) with the Text-to-Speech API enabled  
  (Enable it via the [Google Cloud Console](https://console.cloud.google.com/apis/library/texttospeech.googleapis.com))

#### Setup

## 1. Create and activate a virtual environment, and install dependencies:

```bash
python -m venv venv
source venv/bin/activate  # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Install the dependencies:

```bash
pip install -r requirements.txt
```

## 3. Create a .env file in the root directory:

```env
GOOGLE_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
```

## 4. Set your Google Cloud credentials (service account JSON):

```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account.json"
```
---

## Run the Server

```bash
python server.py
```

The Chrome extension will communicate with the backend at `http://localhost:5000`.

---

## Bug Reports

If something breaks or doesn’t behave as expected, feel free to open an issue or reach out directly.

---

## Authors

| Samantha Adorno            | Emma Roy               |
|----------------------------|------------------------|
| samantha.adorno@ku.edu     | emmaroy@ku.edu         |
