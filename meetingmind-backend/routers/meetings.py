# This file handles all meeting-related endpoints
# Upload a meeting, get all meetings, get a single meeting, and chat with a meeting

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from database import get_db
from datetime import datetime, timezone
from bson import ObjectId
from ai_processor import process_transcript
import cloudinary
import cloudinary.uploader
import os
import asyncio

router = APIRouter()

# Configure Cloudinary using our environment variables
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def format_meeting(meeting: dict) -> dict:
    # Convert MongoDB's _id object to a plain string called id
    meeting["id"] = str(meeting["_id"])
    del meeting["_id"]
    return meeting

async def process_meeting_ai(meeting_id: str, transcript: str):
    # This function runs in the background after a meeting is uploaded
    db = get_db()

    try:
        # Update status to processing so the user knows AI is working
        await db.meetings.update_one(
            {"_id": ObjectId(meeting_id)},
            {"$set": {"status": "processing"}}
        )

        # Send transcript to Gemini and get back summary, action items, key decisions
        ai_result = await process_transcript(transcript)

        # Save the AI results to MongoDB and mark as completed
        await db.meetings.update_one(
            {"_id": ObjectId(meeting_id)},
            {"$set": {
                "status": "completed",
                "summary": ai_result["summary"],
                "action_items": ai_result["action_items"],
                "key_decisions": ai_result["key_decisions"],
            }}
        )
        print(f"AI processing complete for meeting {meeting_id}")

    except Exception as e:
        print(f"AI processing failed for meeting {meeting_id}: {e}")
        await db.meetings.update_one(
            {"_id": ObjectId(meeting_id)},
            {"$set": {"status": "failed"}}
        )

@router.post("/meetings/upload")
async def upload_meeting(
    clerk_user_id: str = Form(...),
    title: str = Form(...),
    audio_file: Optional[UploadFile] = File(None),
    transcript: Optional[str] = Form(None),
):
    if not audio_file and not transcript:
        raise HTTPException(
            status_code=400,
            detail="Please provide either an audio file or a transcript"
        )

    db = get_db()

    # Check the user exists in our database
    user = await db.users.find_one({"clerk_id": clerk_user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    audio_url = None

    if audio_file:
        file_contents = await audio_file.read()
        upload_result = cloudinary.uploader.upload(
            file_contents,
            resource_type="video",
            folder="meetingmind/audio",
            public_id=f"{clerk_user_id}_{datetime.now().timestamp()}",
        )
        audio_url = upload_result.get("secure_url")

    meeting = {
        "user_id": clerk_user_id,
        "title": title,
        "created_at": datetime.now(timezone.utc),
        "status": "pending",
        "audio_url": audio_url,
        "transcript": transcript or "",
        "summary": "",
        "action_items": [],
        "key_decisions": [],
    }

    result = await db.meetings.insert_one(meeting)
    meeting_id = str(result.inserted_id)

    transcript_to_process = transcript or ""

    # Start AI processing in the background
    if transcript_to_process:
        asyncio.create_task(process_meeting_ai(meeting_id, transcript_to_process))

    return {
        "message": "Meeting uploaded successfully",
        "meeting_id": meeting_id,
        "status": "pending"
    }

@router.get("/meetings")
async def get_meetings(clerk_user_id: str):
    db = get_db()

    # Fetch all meetings for this user, newest first
    cursor = db.meetings.find(
        {"user_id": clerk_user_id}
    ).sort("created_at", -1)

    meetings = []
    async for meeting in cursor:
        meetings.append(format_meeting(meeting))

    return meetings

@router.get("/meetings/{meeting_id}")
async def get_meeting(meeting_id: str, clerk_user_id: str):
    db = get_db()

    try:
        meeting = await db.meetings.find_one({
            "_id": ObjectId(meeting_id),
            "user_id": clerk_user_id
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting ID")

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return format_meeting(meeting)

@router.post("/meetings/{meeting_id}/chat")
async def chat_with_meeting(
    meeting_id: str,
    clerk_user_id: str = Form(...),
    message: str = Form(...),
):
    db = get_db()

    # Fetch the meeting to get the transcript as context for Gemini
    try:
        meeting = await db.meetings.find_one({
            "_id": ObjectId(meeting_id),
            "user_id": clerk_user_id
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting ID")

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if not meeting.get("transcript"):
        raise HTTPException(status_code=400, detail="Meeting has no transcript to chat with")

    # Fetch previous chat messages to give Gemini conversation context
    previous_messages = await db.chat_messages.find(
        {"meeting_id": meeting_id}
    ).sort("created_at", 1).to_list(length=20)

    # Build conversation history string
    conversation_history = ""
    for msg in previous_messages:
        role = "User" if msg["role"] == "user" else "Assistant"
        conversation_history += f"{role}: {msg['content']}\n"

    # Build the prompt with transcript as context
    prompt = f"""You are a helpful assistant that answers questions about a meeting.
You must only answer based on the meeting transcript provided below.
If the answer is not in the transcript, say so honestly.

Meeting transcript:
{meeting['transcript']}

Previous conversation:
{conversation_history}

User question: {message}

Answer the question clearly and concisely based on the transcript."""

    try:
        from google import genai
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt
        )
        ai_response = response.text.strip()
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="AI chat failed")

    # Save the user's message to MongoDB
    await db.chat_messages.insert_one({
        "meeting_id": meeting_id,
        "user_id": clerk_user_id,
        "role": "user",
        "content": message,
        "created_at": datetime.now(timezone.utc)
    })

    # Save Gemini's response to MongoDB
    await db.chat_messages.insert_one({
        "meeting_id": meeting_id,
        "user_id": clerk_user_id,
        "role": "assistant",
        "content": ai_response,
        "created_at": datetime.now(timezone.utc)
    })

    return {"response": ai_response}

@router.get("/meetings/{meeting_id}/chat")
async def get_chat_history(meeting_id: str, clerk_user_id: str):
    db = get_db()

    # Verify the user owns this meeting before returning chat history
    try:
        meeting = await db.meetings.find_one({
            "_id": ObjectId(meeting_id),
            "user_id": clerk_user_id
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting ID")

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Fetch all chat messages oldest first
    messages = await db.chat_messages.find(
        {"meeting_id": meeting_id}
    ).sort("created_at", 1).to_list(length=100)

    # Convert MongoDB _id to string for each message
    for msg in messages:
        msg["id"] = str(msg["_id"])
        del msg["_id"]

    return messages