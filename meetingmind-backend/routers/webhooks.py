# This file handles incoming webhook events from Clerk
# Clerk calls this endpoint automatically when a new user signs up

from fastapi import APIRouter, HTTPException, Request
from svix import Webhook, WebhookVerificationError
from database import get_db
import os

# APIRouter lets us define routes in a separate file from main.py
router = APIRouter()

@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request):
    # Read the special headers Clerk sends with every webhook request
    svix_id = request.headers.get("svix-id")
    svix_timestamp = request.headers.get("svix-timestamp")
    svix_signature = request.headers.get("svix-signature")

    if not svix_id or not svix_timestamp or not svix_signature:
        raise HTTPException(status_code=400, detail="Missing webhook headers")

    body = await request.body()

    try:
        # Verify the request actually came from Clerk using our webhook secret
        wh = Webhook(os.getenv("CLERK_WEBHOOK_SECRET"))
        payload = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        })
    except WebhookVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # Only handle the user.created event - ignore everything else
    if payload.get("type") == "user.created":
        data = payload.get("data", {})
        clerk_id = data.get("id")
        email_addresses = data.get("email_addresses", [])
        email = email_addresses[0].get("email_address", "") if email_addresses else ""
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        name = f"{first_name} {last_name}".strip()

        try:
            db = get_db()

            # Only save the user if they don't already exist in MongoDB
            existing_user = await db.users.find_one({"clerk_id": clerk_id})
            if not existing_user:
                await db.users.insert_one({
                    "clerk_id": clerk_id,
                    "email": email,
                    "name": name,
                    "created_at": data.get("created_at")
                })
                print(f"New user saved: {email}")
        except Exception as e:
            print(f"Failed to save user to MongoDB: {e}")

    return {"status": "ok"}