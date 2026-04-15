# This file handles all AI processing using Google Gemini
# It takes a transcript and returns a summary, action items, and key decisions

from google import genai
import os
import json

async def process_transcript(transcript: str) -> dict:
    # Create the Gemini client using our API key from .env
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