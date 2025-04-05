from flask import Flask, request, jsonify, send_file
from flask import after_this_request
from dotenv import load_dotenv
import os
import json
import html
import google.generativeai as genai
from google.cloud import texttospeech
import uuid
from pymongo import MongoClient
from datetime import datetime
from flask_cors import CORS
#load environment variables from .env
load_dotenv()

#set up Gemini model with API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("models/gemini-1.5-pro-latest")

#load Mongo URI
client = MongoClient(os.getenv("MONGODB_URI"))
db = client["ezread"]
collection = db["simplifications"]
app = Flask(__name__)
CORS(app)

#root route to check if its running
@app.route("/")
def home():
    return "EZRead backend is running!"

#route to simplify complex text
@app.route("/simplify", methods=["POST"])
def simplify_text():
    data = request.json
    user_text = data.get("text", "")
    session_id = data.get("sessionId", "anonymous")
    page_url = data.get("url", "")

    #prompt sent to Gemini
    prompt = f"Rewrite this in simple English for someone with ADHD or dyslexia:\n\n{user_text}"

    try:
        response = model.generate_content(prompt)
        simplified = response.text

        return jsonify({"simplified": simplified})
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
        print(" Converting plain text to speech...")
        client = texttospeech.TextToSpeechClient()

        input_text = texttospeech.SynthesisInput(text=text)

        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        response = client.synthesize_speech(
            input=input_text,
            voice=voice,
            audio_config=audio_config
        )

        filename = f"{uuid.uuid4()}.mp3"
        with open(filename, "wb") as out:
            out.write(response.audio_content)

        return send_file(
            filename,
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="read.mp3"
        )

    except Exception as e:
        print(" Exception occurred:", e)
        return jsonify({"error": str(e)}), 500
    
#route to get history of simplifications
@app.route("/history", methods=["GET"])
def get_history():
    try: 
        session_id = request.args.get("sessionId", "anonymous")
        history = list(
            collection.find({"sessionId": session_id})
            .sort("timestamp", -1)
            .limit(10)
        )

        #serialize ObjectId for JSON
        for h in history:
            h["_id"] = str(h["_id"])

        return jsonify(history)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#route to clear saved later
@app.route("/clear-history", methods=["POST"])
def clear_history():
    session_id = request.json.get("sessionId", "anonymous")
    collection.delete_many({"sessionId": session_id})
    return jsonify({"message": "History cleared."})

if __name__ == "__main__":
    app.run(port=5000)
