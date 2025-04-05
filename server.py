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
from datetime import datetime, timezone
from flask_cors import CORS
#load environment variables from .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))


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
    
@app.route("/save", methods=["POST"])
def save_simplification():
    data = request.json
    print("Payload received at /save:", data)

    session_id = data.get("sessionId", "anonymous")
    original = data.get("text", "")
    note = data.get("note", "") 
    page_url = data.get("url", "")

    if not original and not note:
        return jsonify({"error": "Missing content to save."}), 400

    try:
        #save general content to MongoDB
        collection.insert_one({
            "sessionId": session_id,
            "text": original,
            "note": note,
            "url": page_url,
            "timestamp": datetime.now(timezone.utc)
        })
        return jsonify({"message": "Text saved successfully."})

    except Exception as e:
        print("error as ", e)
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
    
@app.route("/get-saved-texts", methods=["GET"])
def get_saved_texts():
    try:
        session_id = request.args.get("sessionId", "anonymous")
        print(f"Fetching texts for session: {session_id}") 
        
        saved_texts = list(
            collection.find(
                {"sessionId": session_id, "text": {"$exists": True}}
            ).sort("timestamp", -1)
        )
        
        print(f"Found {len(saved_texts)} texts")  
        
        # Serialize ObjectId for JSON
        for text in saved_texts:
            text["_id"] = str(text["_id"])
            text["timestamp"] = text["timestamp"].isoformat()
            
        print("Returning texts:", saved_texts)  
        return jsonify(saved_texts)

    except Exception as e:
        print("Error in get-saved-texts:", e)  
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(port=5000)

