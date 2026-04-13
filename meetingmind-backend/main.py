from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from svix import Webhook, WebhookVerificationError
import os

load_dotenv()

app = FastAPI(title="MeetingMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mongo_client = None
db = None

@app.on_event("startup")
async def startup_db():
    global mongo_client, db
    mongo_client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = mongo_client[os.getenv("DB_NAME")]
    print("Connected to MongoDB Atlas")

@app.on_event("shutdown")
async def shutdown_db():
    global mongo_client
    if mongo_client:
        mongo_client.close()

@app.get("/")
async def root():
    return {"message": "MeetingMind API is running"}

@app.get("/health")
async def health():
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

@app.post("/webhooks/clerk")
async def clerk_webhook(request: Request):
    svix_id = request.headers.get("svix-id")
    svix_timestamp = request.headers.get("svix-timestamp")
    svix_signature = request.headers.get("svix-signature")

    if not svix_id or not svix_timestamp or not svix_signature:
        raise HTTPException(status_code=400, detail="Missing webhook headers")

    body = await request.body()

    try:
        wh = Webhook(os.getenv("CLERK_WEBHOOK_SECRET"))
        payload = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        })
    except WebhookVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = payload.get("type")

    if event_type == "user.created":
        data = payload.get("data", {})
        clerk_id = data.get("id")
        email_addresses = data.get("email_addresses", [])
        email = email_addresses[0].get("email_address", "") if email_addresses else ""        
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        name = f"{first_name} {last_name}".strip()

        existing_user = await db.users.find_one({"clerk_id": clerk_id})
        if not existing_user:
            await db.users.insert_one({
                "clerk_id": clerk_id,
                "email": email,
                "name": name,
                "created_at": data.get("created_at")
            })
            print(f"New user saved: {email}")

    return {"status": "ok"}