from flask import Flask, request, jsonify, send_file
from flask import after_this_request
from dotenv import load_dotenv
import os
import google.generativeai as genai
from gtts import gTTS
import uuid

#load environment variables from .env
load_dotenv()

#set up Gemini model with API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("models/gemini-1.5-pro-latest")

app = Flask(__name__)

#root route to check if its running
@app.route("/")
def home():
    return "EZRead backend is running!"

#route to simplify complex text
@app.route("/simplify", methods=["POST"])
def simplify_text():
    data = request.json
    user_text = data.get("text", "")

    # Prompt sent to Gemini
    prompt = f"Rewrite this in plain English for someone with ADHD or dyslexia:\n\n{user_text}"

    try:
        response = model.generate_content(prompt)
        return jsonify({"simplified": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#route to convert text to speech and return an MP3 file
@app.route("/speak", methods=["POST"])
def speak():
    data = request.json
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        #generate MP3 using gTTS
        tts = gTTS(text=text, lang="en")
        filename = f"{uuid.uuid4()}.mp3"
        tts.save(filename)

        #delete the MP3 file after it's sent back to the client
        @after_this_request
        def remove_file(response):
            try:
                os.remove(filename)
            except Exception as e:
                print(f"Error deleting file: {e}")
            return response

        return send_file(filename, mimetype="audio/mpeg")

    except Exception as e:
        return jsonify({"error": str(e)}), 500
