from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import os
import json
import logging
from fastapi import HTTPException
from groq import Groq, AuthenticationError, APIConnectionError
from app.prompts.templates import SYSTEM_PROMPT, CAREER_CHAT_PROMPT, RESUME_ANALYSIS_PROMPT

logger = logging.getLogger("app.services.ai")

def map_model_name(selected_model: str) -> str:
    """Maps frontend dropdown options to official Groq API model strings."""
    if not selected_model:
        return "llama-3.3-70b-versatile"
    
    m = selected_model.lower()
    if "deepseek" in m or "r1" in m:
        return "deepseek-r1-distill-llama-70b"
    elif "kimi" in m:
        # Fallback to stable Llama 3.3 for unsupported Groq model
        return "llama-3.3-70b-versatile"
    elif "llama" in m:
        return "llama-3.3-70b-versatile"
    return "llama-3.3-70b-versatile"


class AIProvider(ABC):
    """Abstract base class defining pluggable interface for future AI model providers."""
    
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = map_model_name(model_name)

    @abstractmethod
    async def chat(self, message: str, history: List[Dict[str, Any]], target_role: Optional[str] = None) -> Dict[str, Any]:
        """Sends a message and chat history logs, returning structured co-pilot reply."""
        pass

    @abstractmethod
    async def analyze_resume(self, parsed_resume: Dict[str, Any], target_role: str) -> Dict[str, Any]:
        """Performs a structured ATS and keyword review of candidate resume text."""
        pass


class GroqProvider(AIProvider):
    """Pluggable provider for Groq Cloud API model invocations."""

    def _get_client(self) -> Groq:
        if not self.api_key:
            raise HTTPException(status_code=400, detail="No API Key Configured")
        try:
            return Groq(api_key=self.api_key)
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid API Key configuration")

    async def chat(self, message: str, history: List[Dict[str, Any]], target_role: Optional[str] = None) -> Dict[str, Any]:
        client = self._get_client()
        role_label = target_role or "Software Engineer"
        
        # 1. Format history context
        history_text = ""
        for turn in history[-5:]: # limit to last 5 turns to preserve tokens
            sender = "User" if turn.get("sender") == "user" else "Pilo"
            content = turn.get("text", "")
            history_text += f"{sender}: {content}\n"
            
        # 2. Build system and user prompt
        system_instructions = SYSTEM_PROMPT
        user_prompt = CAREER_CHAT_PROMPT.format(
            target_role=role_label,
            history_context=history_text,
            user_message=message
        )
        
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instructions},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.model_name,
                temperature=0.7,
                max_tokens=800
            )
            reply_text = chat_completion.choices[0].message.content
            
            # Simple heuristic mapping for Pilo expression based on reply tone
            mascot_state = "happy"
            lower_reply = reply_text.lower()
            if any(w in lower_reply for w in ["warning", "caution", "improve", "fix", "missing", "error"]):
                mascot_state = "thinking"
            elif any(w in lower_reply for w in ["great", "excellent", "awesome", "congrats", "perfect"]):
                mascot_state = "happy"
                
            return {
                "reply": reply_text,
                "mascot_state": mascot_state
            }
            
        except AuthenticationError as ae:
            logger.error(f"Groq auth failure: {str(ae)}")
            raise HTTPException(status_code=401, detail="Invalid API Key")
        except APIConnectionError as ce:
            logger.error(f"Groq connection failure: {str(ce)}")
            raise HTTPException(status_code=503, detail="Unable to reach Groq")
        except Exception as e:
            logger.error(f"Groq generic API error: {str(e)}")
            raise HTTPException(status_code=500, detail="Groq API request failed")

    async def analyze_resume(self, parsed_resume: Dict[str, Any], target_role: str) -> Dict[str, Any]:
        client = self._get_client()
        
        # Format resume json string
        resume_str = json.dumps(parsed_resume, indent=2)
        analysis_prompt = RESUME_ANALYSIS_PROMPT.format(
            target_role=target_role,
            parsed_resume=resume_str
        )
        
        try:
            # Request JSON structured output from Groq
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a professional resume parser that output ONLY JSON structured summaries."},
                    {"role": "user", "content": analysis_prompt}
                ],
                model=self.model_name,
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            response_text = chat_completion.choices[0].message.content
            parsed_analysis = json.loads(response_text)
            return parsed_analysis
            
        except AuthenticationError as ae:
            logger.error(f"Groq auth failure: {str(ae)}")
            raise HTTPException(status_code=401, detail="Invalid API Key")
        except APIConnectionError as ce:
            logger.error(f"Groq connection failure: {str(ce)}")
            raise HTTPException(status_code=503, detail="Unable to reach Groq")
        except json.JSONDecodeError as je:
            logger.error(f"Groq failed to return valid JSON output: {str(je)}")
            raise HTTPException(status_code=500, detail="Failed to parse AI resume critique")
        except Exception as e:
            logger.error(f"Groq generic API error: {str(e)}")
            raise HTTPException(status_code=500, detail="Groq API request failed")


class FutureGeminiProvider(AIProvider):
    """Pluggable provider placeholder for Google Gemini API integration."""

    async def chat(self, message: str, history: List[Dict[str, Any]], target_role: Optional[str] = None) -> Dict[str, Any]:
        logger.info(f"FutureGeminiProvider: Mocking chat using model {self.model_name}")
        return {
            "reply": "This is a placeholder reply from FutureGeminiProvider.",
            "mascot_state": "thinking"
        }

    async def analyze_resume(self, parsed_resume: Dict[str, Any], target_role: str) -> Dict[str, Any]:
        logger.info(f"FutureGeminiProvider: Mocking resume analysis")
        return {
            "summary_feedback": "Gemini summary feedback placeholder",
            "experience_feedback": "Gemini experience feedback placeholder",
            "suggested_revisions": []
        }
