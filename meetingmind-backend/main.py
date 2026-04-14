# This is the entry point of our FastAPI backend
# It creates the app, connects to the database, and registers all the routers

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import connect_db, close_db
from routers import webhooks, meetings

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="MeetingMind API")

# Allow our Next.js frontend (localhost:3000) to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    from database import get_db
    try:
        await get_db().command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}