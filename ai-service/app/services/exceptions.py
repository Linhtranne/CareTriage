class AIError(Exception):
    """Base class for AI service exceptions."""
    pass

class AIQuotaExceeded(AIError):
    """Raised when the AI API quota is exceeded (429)."""
    pass

class AIInvalidKey(AIError):
    """Raised when the API key is invalid or expired (401/403)."""
    pass

class AISafetyBlocked(AIError):
    """Raised when the AI response is blocked by safety filters."""
    pass

class AIConnectionError(AIError):
    """Raised when there is a network error connecting to the AI service."""
    pass
