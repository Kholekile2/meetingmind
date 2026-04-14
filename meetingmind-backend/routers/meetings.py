# This file handles all meeting-related endpoints
# Upload a meeting, get all meetings for a user

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from database import get_db
from datetime import datetime, timezone
from bson import ObjectId
import cloudinary
import cloudinary.uploader
import os

router = APIRouter()

# Configure Cloudinary using our environment variables
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def format_meeting(meeting: dict) -> dict:
    # MongoDB uses "_id" but we expose it as "id" in our API responses
    # We also convert it to a string because MongoDB IDs are objects, not strings
    meeting["id"] = str(meeting["_id"])
    del meeting["_id"]
    return meeting

@router.post("/meetings/upload")
async def upload_meeting(
    clerk_user_id: str = Form(...),
    title: str = Form(...),
    audio_file: Optional[UploadFile] = File(None),
    transcript: Optional[str] = Form(None),
):
    # Make sure the user provided either an audio file or a transcript
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

    # If an audio file was uploaded, send it to Cloudinary for storage
    if audio_file:
        file_contents = await audio_file.read()

        # Upload to Cloudinary - resource_type "video" covers audio files too
        upload_result = cloudinary.uploader.upload(
            file_contents,
            resource_type="video",
            folder="meetingmind/audio",
            public_id=f"{clerk_user_id}_{datetime.now().timestamp()}",
        )
        audio_url = upload_result.get("secure_url")

    # Build the meeting record to save in MongoDB
    meeting = {
        "user_id": clerk_user_id,
        "title": title,
        "created_at": datetime.now(timezone.utc),
        # Status starts as "pending" until AI processing is done
        "status": "pending",
        "audio_url": audio_url,
        "transcript": transcript or "",
        "summary": "",
        "action_items": [],
        "key_decisions": [],
    }

    result = await db.meetings.insert_one(meeting)

    return {
        "message": "Meeting uploaded successfully",
        "meeting_id": str(result.inserted_id),
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