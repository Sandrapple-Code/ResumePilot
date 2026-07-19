from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user query or prompt message")
    history: List[Dict[str, Any]] = Field(
        default=[],
        description="The chat history log, represented as list of dicts: {'sender': 'user'|'pilo', 'text': '...'}"
    )
    target_role: Optional[str] = Field(None, description="The target role context, e.g. Senior Frontend Engineer")
    api_key: Optional[str] = Field(None, description="Saved Groq API Key context passed from client browser")
    model: Optional[str] = Field(None, description="Preferred AI model for chat replies")
    conversation_id: Optional[str] = Field(None, description="Unique conversation session id for persisting chat logs")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Pilo the bear co-pilot response")
    mascot_state: str = Field(
        default="happy",
        description="Mascot visual expression recommendation: happy, thinking, confused, pointing, welcoming"
    )
    suggested_prompts: List[str] = Field(
        default=[],
        description="Next step question suggestion choices to present in UI"
    )
    execution_timeline: Optional[List[Dict[str, Any]]] = Field(None, description="Sequential agent execution timeline logs")
    sources: Optional[List[str]] = Field(None, description="Curated markdown knowledge documents retrieved for answering query")
