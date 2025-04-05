from flask import Flask, request, jsonify, send_file
from flask import after_this_request
from dotenv import load_dotenv
import os
import json
import google.generativeai as genai
from google.cloud import texttospeech
import uuid
from pymongo import MongoClient
from datetime import datetime

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
        #initialize the TTS client
        client = texttospeech.TextToSpeechClient()

        #use SSML with <mark> tags for timestamping
        ssml = f"<speak>{' '.join([f'<mark name=\"w{i}\"/>{word}' for i, word in enumerate(text.split())])}</speak>"

        input_text = texttospeech.SynthesisInput(ssml=ssml)

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
            audio_config=audio_config,
            enable_time_pointing=[texttospeech.SynthesizeSpeechRequest.TimepointType.SSML_MARK]
        )

        filename = f"{uuid.uuid4()}.mp3"
        with open(filename, "wb") as out:
            out.write(response.audio_content)

        #convert timepoints into a  list
        timepoints = [
            {"mark": tp.mark_name, "time": tp.time_seconds}
            for tp in response.timepoints
        ]

        @after_this_request
        def remove_file(response):
            try:
                os.remove(filename)
            except Exception as e:
                print(f"Error deleting file: {e}")
            return response

        return send_file(
            filename,
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="read.mp3",
            headers={
                "X-Timepoints": json.dumps(timepoints)
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500

#route to save things to read later
@app.route("/save", methods=["POST"])
def save_simplification():
    data = request.json
    session_id = data.get("sessionId", "anonymous")
    text = data.get("text", "")
    simplified = data.get("simplified", "")
    page_url = data.get("url", "")

    if not text or not simplified:
        return jsonify({"error": "Missing text or simplified content"}), 400

    try:
        collection.insert_one({
            "sessionId": session_id,
            "text": text,
            "simplified": simplified,
            "url": page_url,
            "timestamp": datetime.utcnow()
        })
        return jsonify({"message": "Saved for later."})
    except Exception as e:
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
