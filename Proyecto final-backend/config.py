from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    """Se lee de variables de entorno o del archivo .env."""

    mongo_url: str = "mongodb://localhost:27017"
    mongo_db: str = "sweetlist"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


config = Config()
