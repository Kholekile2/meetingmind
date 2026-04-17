# This is the entry point of our FastAPI backend
# It creates the app, connects to the database, and registers all the routers

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import connect_db, close_db
from routers import webhooks, meetings
import os

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="MeetingMind API")

# Read allowed origins from environment variable
# In development this is http://localhost:3000
# In production this will be our Vercel URL
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
print(f"Allowed origins: {origins}")

# Allow our Next.js frontend to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Connect to MongoDB when the server starts
@app.on_event("startup")
async def startup():
    await connect_db()

# Close the MongoDB connection when the server stops
@app.on_event("shutdown")
async def shutdown():
    await close_db()

# Register routers - this connects all the routes from each router file to the app
app.include_router(webhooks.router)
app.include_router(meetings.router)

@app.get("/")
async def root():
    return {"message": "MeetingMind API is running"}

@app.get("/health")
async def health():
    # Check if the database object exists and is connected
    # We use the existing connection instead of pinging again
    from database import get_db
    db = get_db()
    if db is None:
        return {"status": "unhealthy", "database": "not connected"}
    return {"status": "healthy", "database": "connected"}