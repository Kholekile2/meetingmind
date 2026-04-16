# This file handles all AI processing using Google Gemini
# It handles both audio transcription and transcript analysis
# For audio files: Gemini first transcribes the audio, then analyses the transcript
# For text transcripts: Gemini analyses the transcript directly

from google import genai
from google.genai import types
import os
import json
import tempfile

async def transcribe_audio(audio_bytes: bytes, mime_type: str) -> str:
    # This function sends an audio file to Gemini and gets back a transcript
    # We upload the file first then wait for it to become active before using it
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    try:
        import time
        import asyncio

        # Write audio bytes to a temporary file so we can upload it to Gemini
        with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        # Upload the file to Gemini's file API
        uploaded_file = client.files.upload(
            file=tmp_path,
            config={"mime_type": mime_type}
        )

        print(f"File uploaded to Gemini with state: {uploaded_file.state}")

        # Wait for the file to become ACTIVE before using it
        # Gemini needs time to process the uploaded file
        max_wait = 60  # Maximum seconds to wait
        waited = 0
        while str(uploaded_file.state) != "FileState.ACTIVE" and waited < max_wait:
            print(f"Waiting for file to become active... current state: {uploaded_file.state}")
            await asyncio.sleep(3)
            # Refresh the file status
            uploaded_file = client.files.get(name=uploaded_file.name)
            waited += 3

        if str(uploaded_file.state) != "FileState.ACTIVE":
            raise Exception(f"File never became active, final state: {uploaded_file.state}")

        print(f"File is now active, transcribing...")

        # Ask Gemini to transcribe the audio
        # Retry up to 3 times in case Gemini is temporarily busy
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model="models/gemini-2.5-flash",
                    contents=[
                        "Please transcribe this audio recording accurately. Include speaker names if you can identify them. Return only the transcript text, nothing else.",
                        uploaded_file
                    ]
                )
                return response.text.strip()
            except Exception as retry_error:
                print(f"Transcription attempt {attempt + 1} failed: {retry_error}")
                if attempt < max_retries - 1:
                    # Wait a few seconds before retrying
                    await asyncio.sleep(5)
                else:
                    raise retry_error

    except Exception as e:
        print(f"Audio transcription error: {e}")
        return ""

async def process_transcript(transcript: str) -> dict:
    # This function sends a transcript to Gemini and gets back structured data
    # It returns a summary, action items, and key decisions
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = f"""
You are an AI assistant that analyses meeting transcripts.

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
{transcript}
"""

    try:
        # Send the prompt to Gemini and wait for the response
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt
        )

        # Get the text content from Gemini's response
        response_text = response.text.strip()

        # Sometimes Gemini wraps JSON in markdown code blocks - remove them if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]

        # Parse the JSON string into a Python dictionary
        result = json.loads(response_text)

        return {
            "summary": result.get("summary", ""),
            "action_items": result.get("action_items", []),
            "key_decisions": result.get("key_decisions", [])
        }

    except Exception as e:
        print(f"Gemini processing error: {e}")
        return {
            "summary": "",
            "action_items": [],
            "key_decisions": []
        }