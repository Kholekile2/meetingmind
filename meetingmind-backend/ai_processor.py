# This file handles all AI processing using OpenAI
# It handles both audio transcription and transcript analysis
# For audio files: OpenAI Whisper transcribes the audio, then GPT-4o-mini analyses it
# For text transcripts: GPT-4o-mini analyses the transcript directly

from openai import OpenAI
import os
import json
import tempfile

def get_client():
    # Create OpenAI client using our API key from environment variables
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def transcribe_audio(audio_bytes: bytes, mime_type: str) -> str:
    # This function sends an audio file to OpenAI Whisper and gets back a transcript
    # Whisper is OpenAI's dedicated audio transcription model
    client = get_client()

    try:
        # Write audio bytes to a temporary file because OpenAI needs a file object
        suffix = ".mp4" if "mp4" in mime_type else ".m4a" if "m4a" in mime_type else ".mp3"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        # Send to OpenAI Whisper for transcription
        with open(tmp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
            )

        print(f"Audio transcribed successfully")
        return transcript.text

    except Exception as e:
        print(f"Audio transcription error: {e}")
        return ""

async def process_transcript(transcript: str) -> dict:
    # This function sends a transcript to GPT-4o-mini and gets back structured data
    # It returns a summary, action items, and key decisions
    client = get_client()

    prompt = f"""You are an AI assistant that analyses meeting transcripts.

Given the following meeting transcript, extract and return a JSON object with exactly these fields:

{{
  "summary": "A clear 2-3 paragraph summary of what the meeting was about",
  "action_items": [
    {{"task": "description of the task", "owner": "person responsible", "due_date": "due date if mentioned or null"}}
  ],
  "key_decisions": [
    "decision 1",
    "decision 2"
  ]
}}

Important rules:
- Return ONLY the JSON object, no extra text or markdown
- If no action items are found, return an empty array
- If no key decisions are found, return an empty array
- Keep the summary clear and professional

Meeting transcript:
{transcript}"""

    try:
        # Send to GPT-4o-mini - fast, cheap, and reliable
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            # response_format forces OpenAI to return valid JSON every time
            response_format={"type": "json_object"}
        )

        # Extract the response text
        response_text = response.choices[0].message.content.strip()

        # Parse the JSON into a Python dictionary
        result = json.loads(response_text)

        return {
            "summary": result.get("summary", ""),
            "action_items": result.get("action_items", []),
            "key_decisions": result.get("key_decisions", [])
        }

    except Exception as e:
        print(f"OpenAI processing error: {e}")
        return {
            "summary": "",
            "action_items": [],
            "key_decisions": []
        }