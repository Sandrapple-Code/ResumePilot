# ResumePilot - Updated Upload → Analysis Workflow

## Core Principles
1. **Target Role is King**: The ONLY source of career goals is the user's stored `targetRole` from the user's profile/settings. NEVER guess the target role from resume content.
2. **Skill Matrix First**: Predefined skill matrices (in `backend/app/data/skill_matrices/`) are the single source of truth for required skills per target role.
3. **Single Analysis Flow**: All modules (Dashboard, Report, Project Hub, Roadmap) consume the same cached analysis result to ensure consistency.

---

## Complete Pipeline Breakdown

### Step 1: User Uploads Resume
- **Frontend**: `upload/page.tsx` calls `POST /upload` with the PDF file via `FormData`.
- **Backend Endpoint**: `/upload` (in `routes.py`):
  - Creates a unique `upload_id`.
  - Saves the uploaded PDF locally as `resume_{upload_id}.pdf` in `settings.UPLOAD_DIR/{uid}`.
  - Calls `parse_pdf_resume()` (from `pdf_parser.py`) to extract structured data.
  - Saves parsed data as `parsed_resume_{upload_id}.json`.
  - Saves metadata (`upload_id`, `filename`) as `{upload_id}_meta.json`.
  - Saves an initial entry in the user's `history.json` via `save_resume_version()`.
  - Returns `filename`, `upload_id`, `size_bytes`, and `parsed_data`.

### Step 2: Frontend Triggers Analysis
- After receiving a successful response from `/upload`, frontend:
  - Calls `saveResumeMetadata` (which calls `POST /users/resumes/metadata`).
  - Calls `setCurrentResume` (which calls `POST /users/resumes/current`).
  - Calls `refreshResume`.
  - Waits 300ms and then calls `POST /analyze` (triggerActualAnalysis).

### Step 3: Determine Target Role
- **Source of Truth**: `get_user_profile(uid)` returns user's stored `targetRole`.
- **Fallback**: If user hasn't set a target role, defaults to "Software Engineer".

### Step 4: Load Skill Matrix
- **File Load**: Loads predefined JSON skill matrix from `skill_matrices/{cleaned_role}.json` (e.g., "ai_ml_engineer.json" for "AI/ML Engineer").
- **Dynamic Generation**: If no predefined matrix exists, use LLM to generate one (only if API key is provided).

### Step 5: Run Analysis Pipeline (`run_analysis_pipeline` in routes.py)
- **Check Cache**: If analysis for `(target_role, upload_id)` already exists, return cached data immediately.
- **Parse Resume**: Use parsed resume from `get_parsed_resume`.
- **LangGraph Agents**: Runs multi‑agent pipeline:
  1. **Document Intelligence**: Normalizes parsed resume data.
  2. **Career Goal Agent**: Loads skill matrix and target profile.
  3. **ATS Analyst**: Scores resume against target role/job description.
  4. **Gap Analysis**: Compares user's skills to skill matrix.
  5. **Roadmap Generator**: Creates learning roadmap using matrix's `learning_order`.
  6. **Project Recommender**: Recommends projects based on skill matrix + missing skills.
  7. **Report Agent**: Compiles final career report.

### Step 6: Persist Analysis Results
- Saves all analysis files in `settings.UPLOAD_DIR/{uid}`:
  - `ats_analysis_{upload_id}.json`
  - `career_analysis_{upload_id}.json`
  - `roadmap_{upload_id}.json`
  - `projects_{upload_id}.json`
  - `keyword_analytics_{upload_id}.json`
  - `job_match_{upload_id}.json`
  - `dashboard_summary_{upload_id}.json`
  - `report_{upload_id}.json`
  - `metadata_{upload_id}.json` (for cache invalidation)
- Updates `history.json` entry (via `save_resume_version`) with the new ATS score and parsed data.

### Step 7: Dashboard and Other Pages Fetch Analysis
- **Endpoint**: `GET /users/resumes/{upload_id}/ats-context`.
- **Function**: `compile_ats_context()` compiles all analysis files into `ATSAnalysisContext` object.
- **Usage**: All frontend pages (Dashboard, Skills, Project Hub, Career Report) use this single context for consistent data.

---

## Verification Scenarios

### Scenario 1: User Uploads Resume
1. Login (Auth is already working).
2. Upload a resume (PDF).
3. **Expected**:
   - Resume uploads successfully.
   - Parser runs automatically.
   - ATS analysis runs automatically (after a 300ms delay).
   - Dashboard immediately displays ATS score.
   - Resume Analysis page loads without requiring another upload.
   - Project Hub receives parsed resume data and target‑role‑specific projects.
   - Career Report displays the generated report.

### Scenario 2: User Changes Target Role
1. User changes their `targetRole` in profile/settings.
2. Refresh Dashboard.
3. **Expected**:
   - New analysis is generated (if not already cached for new role).
   - Skill gaps, ATS score, career roadmap, and project recommendations are all updated for new role.

---

## Key Changes Made
1. **`/upload` endpoint**: Added call to `save_resume_version` to save initial resume data to `history.json`.
2. **`getLatestResume`**:
   - Loads `parsedData` from `parsed_resume_{upload_id}.json` (instead of returning empty object).
   - Reads `ATS score` from `dashboard_summary_{upload_id}.json`.
   - Sets `analysisStatus` correctly based on whether analysis exists.
3. **`save_resume_version`**:
   - Now checks for existing entry only by `upload_id`.
   - Merges new entry data into existing entry (instead of overwriting completely).
4. **`run_analysis_pipeline`**: Added call to `save_resume_version` to update history.json with new ATS score and parsed data after analysis runs.
5. **`/analyze` endpoint**: Modified to *always* use user's stored `targetRole` (ignores `request.target_role`).
