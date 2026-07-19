# ResumePilot AI Backend

This is the FastAPI backend service for **ResumePilot AI**.

## 🚀 Setup & Execution

1. **Create Python Virtual Environment**:
   ```bash
   python -m venv .venv
   ```
2. **Activate Environment**:
   * Windows PowerShell:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   * macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Start local FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload
   ```

Exposes:
- API endpoint base: `http://localhost:8000`
- Interactive Swagger documentation: `http://localhost:8000/docs`
