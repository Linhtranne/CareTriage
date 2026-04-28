import os
import google.generativeai as genai
from app.services.prompt_templates import SYSTEM_PROMPT

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))


class TriageService:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=SYSTEM_PROMPT,
        )
        self.sessions: dict = {}

    async def analyze(self, session_id: str, message: str, history: list[dict]) -> dict:
        """Process a triage message and return AI response."""
        # Build conversation history for Gemini
        gemini_history = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg["content"]]})

        # Create or resume chat session
        chat = self.model.start_chat(history=gemini_history)
        response = chat.send_message(message)
        reply_text = response.text

        # Check if triage is complete (AI includes [TRIAGE_COMPLETE] marker)
        is_complete = "[TRIAGE_COMPLETE]" in reply_text
        triage_result = None

        if is_complete:
            reply_text = reply_text.replace("[TRIAGE_COMPLETE]", "").strip()
            triage_result = await self._extract_triage_result(reply_text)

        return {
            "reply": reply_text,
            "is_complete": is_complete,
            "triage_result": triage_result,
        }

    async def _extract_triage_result(self, text: str) -> dict:
        """Extract structured triage data from AI response."""
        prompt = f"""From this medical triage response, extract:
1. suggested_department (Vietnamese name)
2. urgency_level (LOW/MEDIUM/HIGH/EMERGENCY)
3. possible_conditions (list of possible conditions)
4. summary (brief summary in Vietnamese)

Response: {text}

Return as JSON only, no markdown."""

        result = self.model.generate_content(prompt)
        try:
            import json
            return json.loads(result.text.strip().removeprefix("```json").removesuffix("```").strip())
        except Exception:
            return {
                "suggested_department": "Nội tổng quát",
                "urgency_level": "MEDIUM",
                "possible_conditions": [],
                "summary": text[:200],
            }
