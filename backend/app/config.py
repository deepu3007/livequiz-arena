from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = Field(default="LiveQuiz Arena", alias="APP_NAME")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    mongo_uri: str = Field(default="mongodb://localhost:27017", alias="MONGO_URI")
    mongo_db_name: str = Field(default="livequiz_arena", alias="MONGO_DB_NAME")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")

    class Config:
        env_file = ".env"


settings = Settings()