import google.generativeai as genai

from app.core.config import get_settings

settings = get_settings()
api_key = settings["gemini_api_key"]
print(f"Using API Key: {api_key[:10]}...{api_key[-5:] if api_key else 'None'}")

genai.configure(api_key=api_key)
model = genai.GenerativeModel(settings["gemini_model_name"])

try:
    response = model.generate_content("Hello")
    print("Success!")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
