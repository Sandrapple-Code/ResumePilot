import time
import logging
from typing import Dict, Any
from app.agents.state import ResumePilotState
from app.services.ai_provider import GroqProvider

logger = logging.getLogger("app.agents.knowledge_agent")

async def knowledge_agent(state: ResumePilotState) -> Dict[str, Any]:
    """Retrieves trusted resume documents using Retriever and constructs grounded responses using Groq."""
    start_time = time.time()
    logger.info("Knowledge Agent executing RAG pipeline...")
    
    user_msg = ""
    history = state.get("history", [])
    if history:
        user_msg = history[-1].get("text", "")
        
    api_key = state.get("api_key", "")
    model = state.get("model", "Llama 3.3 70B")
    target_role = state.get("target_role", "Senior Frontend Engineer")
    
    reply = "Hello, pilot! How can I help you improve your career roadmap today?"
    mascot_state = "happy"
    sources = []
    
    if api_key and user_msg:
        try:
            # 1. Initialize retriever and perform document search
            from app.rag.retriever import Retriever
            retriever = Retriever()
            merged_context, sources, matches = retriever.retrieve_context(user_msg, top_k=3)
            
            # 2. Augment prompt with retrieved guidelines
            prompt_with_context = user_msg
            if merged_context:
                prompt_with_context = (
                    "You are Pilo, the AI Career Autopilot guide. Answer the user's question by grounding your advice "
                    "in the following trusted career guides. If the retrieved guides are not directly relevant to the question, "
                    "feel free to provide general career coaching advice, but highlight that you are using general standards.\n\n"
                    "=== RETRIEVED TRUSTED GUIDES ===\n"
                    f"{merged_context}\n"
                    "================================\n\n"
                    f"User Question: {user_msg}"
                )
            
            # 3. Call GroqProvider with grounded prompt
            provider = GroqProvider(api_key=api_key, model_name=model)
            chat_history = history[:-1] if len(history) > 1 else []
            res = await provider.chat(
                message=prompt_with_context,
                history=chat_history,
                target_role=target_role
            )
            reply = res.get("reply", reply)
            mascot_state = res.get("mascot_state", mascot_state)
            
        except Exception as e:
            logger.error(f"RAG Knowledge Agent execution failed: {str(e)}")
            reply = f"I encountered an error querying my knowledge database: {str(e)}"
            mascot_state = "confused"
            
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    timeline_log = {
        "agent": "Knowledge Agent",
        "status": "completed",
        "duration_ms": round(duration_ms, 2)
    }
    
    return {
        "current_agent": "Knowledge Agent",
        "completed_agents": state.get("completed_agents", []) + ["Knowledge Agent"],
        "execution_timeline": state.get("execution_timeline", []) + [timeline_log],
        "intermediate_results": {
            **state.get("intermediate_results", {}),
            "knowledge_agent": {
                "reply": reply,
                "mascot_state": mascot_state,
                "sources": sources
            }
        }
    }
