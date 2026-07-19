from pydantic import BaseModel, Field
from typing import List, Optional

class ModelSelection(BaseModel):
    model_name: str = Field(..., description="Selected model identifier, e.g. Llama 3.3 70B")
    provider_name: str = Field(..., description="Corresponding provider, e.g. Groq")

class ProviderConfiguration(BaseModel):
    provider: str = Field(..., description="Provider identifier, e.g. Groq")
    enabled: bool = Field(default=True, description="Whether this provider is active")
    models: List[str] = Field(default=[], description="Supported models array")

class AISettings(BaseModel):
    provider: str = Field(..., description="Active AI Provider identifier")
    model: str = Field(..., description="Active AI model identifier")
    has_api_key: bool = Field(default=False, description="Indicator if API key is stored locally in client browser")

class APIKeyValidationRequest(BaseModel):
    provider: str = Field(..., description="Target AI Provider to validate key against, e.g. Groq")
    api_key: str = Field(..., description="API Key string to test connection")
    model: Optional[str] = Field(None, description="Model to test validation request against")

class APIKeyValidationResponse(BaseModel):
    provider: str = Field(..., description="AI Provider validated")
    model: str = Field(..., description="AI model tested")
    latency_ms: float = Field(..., description="Latency of the validation query in milliseconds")
    status: str = Field(..., description="Status description text")
    valid: bool = Field(..., description="True if validation request succeeded")
    message: str = Field(..., description="Provider response confirmation or error description")

