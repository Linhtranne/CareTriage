from google import genai

from app.core.config import get_settings

settings = get_settings()
api_key = settings["gemini_api_key"]
print("Using API Key: ***masked***" if api_key else "Using API Key: None")

client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(model=settings["gemini_model_name"], contents="Hello")
    print("Success!")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
