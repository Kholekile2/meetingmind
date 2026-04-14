# This file handles our connection to MongoDB Atlas (our cloud database)
# We put the connection here so every other file can use it without repeating code

from motor.motor_asyncio import AsyncIOMotorClient
import os

mongo_client: AsyncIOMotorClient = None
db = None

async def connect_db():
    global mongo_client, db

    # os.getenv reads secret values from our .env file
    mongodb_url = os.getenv("MONGODB_URL")

    # Add tlsVersion to the connection string to fix SSL issues on Python 3.14
    if "?" in mongodb_url:
        mongodb_url += "&tlsVersion=TLS1_2"
    else:
        mongodb_url += "?tlsVersion=TLS1_2"

    mongo_client = AsyncIOMotorClient(mongodb_url)
    db = mongo_client[os.getenv("DB_NAME")]
    print("Connected to MongoDB Atlas")

async def close_db():
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("MongoDB connection closed")

def get_db():
    # Returns the database object so other files can use it
    return db