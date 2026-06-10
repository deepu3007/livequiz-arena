import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

mongo_client: AsyncIOMotorClient | None = None


async def connect_to_mongo():
    global mongo_client

    mongo_client = AsyncIOMotorClient(
    settings.mongo_uri
)

    # This checks if MongoDB is actually reachable
    await mongo_client.admin.command("ping")

    print("MongoDB connected successfully")


async def close_mongo_connection():
    global mongo_client

    if mongo_client:
        mongo_client.close()
        print("MongoDB connection closed")


def get_database():
    if mongo_client is None:
        raise RuntimeError("MongoDB client is not initialized")

    return mongo_client[settings.mongo_db_name]