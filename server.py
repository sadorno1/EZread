from flask import Flask, request, jsonify, Response, after_this_request
from dotenv import load_dotenv
import os
import json
import html
import google.generativeai as genai
from google.cloud import texttospeech_v1beta1 as texttospeech
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
CORS(app, expose_headers=["X-Timepoints"])


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
        client = texttospeech.TextToSpeechClient()

        # Add SSML marks before each word
        ssml = "<speak>" + " ".join(
            [f'<mark name="w{i}"/>{html.escape(word)}' for i, word in enumerate(text.split())]
        ) + "</speak>"

        # Create the request
        request_obj = texttospeech.SynthesizeSpeechRequest(
            input=texttospeech.SynthesisInput(ssml=ssml),
            voice=texttospeech.VoiceSelectionParams(
                language_code="en-US",
                ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
            ),
            audio_config=texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            ),
            enable_time_pointing=["SSML_MARK"]
        )

        response = client.synthesize_speech(request=request_obj)

        # Save audio temporarily
        filename = f"{uuid.uuid4()}.mp3"
        with open(filename, "wb") as out:
            out.write(response.audio_content)

        # Prepare timepoints
        timepoints = [
            {"mark": tp.mark_name, "time": tp.time_seconds}
            for tp in response.timepoints
        ]

        @after_this_request
        def cleanup(response):
            try:
                os.remove(filename)
            except Exception as e:
                print(f"Error deleting {filename}: {str(e)}")
            return response

        # Create and return response
        with open(filename, "rb") as f:
            audio_data = f.read()

        response = Response(
            audio_data,
            mimetype="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=read.mp3",
                "X-Timepoints": json.dumps(timepoints)
            }
        )
        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/save", methods=["POST"])
def save_simplification():
    data = request.json
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
        print(f"Fetching texts for session: {session_id}")  # Debug print
        
        saved_texts = list(
            collection.find(
                {"sessionId": session_id, "text": {"$exists": True}}
            ).sort("timestamp", -1)
        )
        
        print(f"Found {len(saved_texts)} texts")  # Debug print
        
        # Serialize ObjectId for JSON
        for text in saved_texts:
            text["_id"] = str(text["_id"])
            text["timestamp"] = text["timestamp"].isoformat()
            
        print("Returning texts:", saved_texts)  # Debug print
        return jsonify(saved_texts)

    except Exception as e:
        print("Error in get-saved-texts:", e)  # Debug print
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(port=5000, debug=True)

