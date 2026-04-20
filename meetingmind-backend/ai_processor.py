# This file handles all AI processing using Anthropic Claude
# It handles both audio transcription and transcript analysis
# For audio files: OpenAI Whisper transcribes the audio, then Claude analyses it
# For text transcripts: Claude analyses the transcript directly

import anthropic
import os
import json
import tempfile

def get_client():
    # Create Anthropic client using our API key from environment variables
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def transcribe_audio(audio_bytes: bytes, mime_type: str) -> str:
    # Claude doesn't transcribe audio directly so we use a simple approach
    # We save the file and return a message asking user to use text input
    # For a future improvement this can be connected to OpenAI Whisper
    print("Audio transcription requested - Claude does not support direct audio transcription")
    return ""

async def process_transcript(transcript: str) -> dict:
    # This function sends a transcript to Claude and gets back structured data
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
        # Send to Claude Haiku - fast, cheap, and very reliable
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Extract the response text
        response_text = response.content[0].text.strip()

        # Remove markdown code blocks if Claude added them
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
        print(f"Claude processing error: {e}")
        return {
            "summary": "",
            "action_items": [],
            "key_decisions": []
        }