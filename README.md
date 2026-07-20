# 🚀 ResumePilot AI
### Intelligent Agentic AI Career Intelligence & ATS Optimization Platform

<p align="center">
  <strong>Analyze • Optimize • Match • Learn • Get Hired</strong>
</p>

---

# 📖 Overview

ResumePilot AI is an **Agentic AI-powered Career Intelligence Platform** that helps students, fresh graduates, and professionals build ATS-optimized resumes, identify skill gaps, receive personalized career guidance, and prepare for their dream roles.

Unlike traditional resume checkers that only assign a score, ResumePilot AI performs an end-to-end career analysis by combining:

- Resume Parsing
- ATS Analysis
- AI-powered Resume Review
- Skill Gap Detection
- Career Intelligence
- Job Matching
- AI Chat Assistant
- RAG-powered Knowledge Base

The platform is built using **LangGraph Multi-Agent Architecture**, enabling specialized AI agents to collaborate and generate comprehensive career insights.

---

# 🎯 Problem Statement

Recruiters today use Applicant Tracking Systems (ATS) to filter resumes before they reach a human recruiter.

More than **75% of resumes are rejected automatically** because they:

- Miss required keywords
- Lack relevant skills
- Use poor formatting
- Are not tailored to the target job
- Have weak project portfolios

Most applicants don't know why their resumes get rejected.

ResumePilot AI solves this problem by acting as an intelligent AI career mentor that analyzes resumes, compares them with the desired role, and provides actionable recommendations.

---

# 💡 Key Objectives

- Build ATS-friendly resumes
- Improve resume quality
- Identify missing technical skills
- Suggest real-world GitHub projects
- Provide AI-powered career guidance
- Compare resumes against target roles
- Improve interview readiness
- Help users continuously upskill

---

# ✨ Core Features

## 📄 Resume Upload

- Upload resumes in PDF format
- Secure file storage
- Resume validation
- Automatic parsing

---

## 🧠 Intelligent Resume Parsing

Uses **PyMuPDF** and custom parsing algorithms to extract:

- Name
- Email
- Phone
- LinkedIn
- GitHub
- Skills
- Education
- Experience
- Projects
- Certifications
- Summary

Structured JSON is generated for downstream AI processing.

---

## 🤖 Multi-Agent AI Architecture

ResumePilot AI uses LangGraph to orchestrate multiple AI agents.

### Workflow Coordinator (Supervisor)

Responsible for:

- Intent detection
- Agent routing
- Workflow orchestration
- Response aggregation

---

### Document Intelligence Agent

Responsible for:

- Resume validation
- Section normalization
- Data cleaning
- Resume context creation

---

### ATS Analyst Agent

Responsible for:

- ATS score calculation
- Keyword analysis
- Resume formatting evaluation
- Section completeness
- Resume health

---

### Knowledge Agent

Uses Retrieval-Augmented Generation (RAG) to answer career-related questions using curated knowledge documents.

---

### Resume Architect Agent

Provides:

- Resume rewrite suggestions
- Professional bullet improvements
- Resume enhancement recommendations

---

### Project Recommendation Agent

Suggests open-source GitHub projects based on:

- Current skills
- Missing skills
- Target career role

---

### Report Agent

Compiles outputs from all agents into a comprehensive Career Report.

---

# 📊 ATS Analysis

ResumePilot AI evaluates resumes using industry-standard ATS principles.

The ATS score is calculated based on:

### ✅ Keyword Matching

Compares resume keywords with:

- Target Role
- Job Description (optional)

---

### ✅ Skill Matching

Evaluates:

- Technical Skills
- Frameworks
- Languages
- Libraries
- Tools

---

### ✅ Experience Relevance

Checks:

- Work experience
- Project relevance
- Role alignment

---

### ✅ Resume Formatting

Analyzes:

- Headings
- Layout
- ATS compatibility
- Readability

---

### ✅ Section Completeness

Ensures the resume contains:

- Summary
- Skills
- Experience
- Education
- Projects
- Certifications

---

# 📈 Career Intelligence Dashboard

Interactive dashboard displaying:

- ATS Score
- Resume Health
- Skill Analysis
- Career Insights
- Latest Resume Analysis
- Quick Actions
- AI Activity Timeline

---

# 🎯 Job Matching

Users can compare their resume against:

- Desired Job Role
- Specific Job Description

ResumePilot AI identifies:

- Missing Keywords
- Missing Skills
- Experience Gaps
- Match Percentage

---

# 📚 Project Hub

One of ResumePilot AI's unique features.

Based on missing skills, the platform recommends:

- Open-source GitHub repositories
- Learning resources
- Documentation
- Tutorials

Each recommendation includes:

- Difficulty
- Skills Learned
- Estimated Time
- Resume Impact
- Learning Outcome

---

# 📄 Career Report

Automatically generates a comprehensive report containing:

- Resume Summary
- ATS Analysis
- Skill Gap Analysis
- Resume Strengths
- Weaknesses
- Resume Rewrite Suggestions
- Learning Recommendations
- Project Suggestions

Reports can be exported as PDF.

---

# 💬 AI Career Assistant

Chat with **Pilo**, the AI Career Assistant.

Capabilities include:

- Resume questions
- Career advice
- Interview preparation
- Skill guidance
- Resume optimization
- Career planning

---

# 📚 Retrieval-Augmented Generation (RAG)

ResumePilot AI uses RAG to provide trustworthy answers.

Knowledge Base includes:

- Resume Writing
- ATS Best Practices
- Interview Tips
- Career Guides
- Job Search Strategies

Technologies:

- ChromaDB
- Sentence Transformers
- HuggingFace Embeddings

---

# ⚙️ Tech Stack

## Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide Icons

---

## Backend

- FastAPI
- Python 3.12+
- Pydantic
- Uvicorn

---

## AI

- LangGraph
- LangChain
- Groq API
- Llama 3.3 70B
- DeepSeek R1
- Kimi K2

---

## Resume Parsing

- PyMuPDF
- Regex
- Custom Resume Parser

---

## RAG

- ChromaDB
- Sentence Transformers
- HuggingFace Embeddings
- Markdown Loader

---

## Authentication

- Firebase Authentication

---

## Database

- Firebase Firestore

---

## Deployment

Frontend

- Vercel

Backend

- Render

---

# 🏗️ Project Architecture

```
                    Resume Upload
                          │
                          ▼
                 Resume Parser (PyMuPDF)
                          │
                          ▼
                Structured Resume JSON
                          │
                          ▼
                LangGraph Supervisor
                          │
      ┌──────────┬──────────┬───────────┐
      ▼          ▼          ▼           ▼
Document     ATS Agent   Knowledge   Resume Agent
Agent                     Agent
      ▼          ▼          ▼           ▼
     Project Recommendation Agent
                  │
                  ▼
             Report Generator
                  │
                  ▼
         Dashboard + Career Report
```

---

# 🔄 Application Workflow

```
User Login

↓

Complete Profile

↓

Select Target Role

↓

Upload Resume

↓

Resume Parsing

↓

ATS Analysis

↓

Skill Gap Detection

↓

Project Recommendations

↓

Career Report

↓

AI Career Chat

↓

Resume Improvement
```

---

# 📂 Project Structure

```
ResumePilot-AI/

├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   ├── api/
│   │   ├── parser/
│   │   ├── prompts/
│   │   ├── rag/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── firebase/
│   │
│   ├── scripts/
│   ├── uploads/
│   └── knowledge_base/
│
├── public/
├── README.md
└── requirements.txt
```

---

# 🔒 Security

- Firebase Authentication
- Secure API Key Storage
- Protected Backend APIs
- Input Validation
- File Validation
- Error Handling
- Environment Variable Support

---

# 🌟 Unique Features

- Agentic AI Architecture
- Multi-Agent Workflow
- LangGraph Orchestration
- ATS Optimization
- Resume Intelligence
- AI Career Assistant
- GitHub Project Recommendation Engine
- RAG-based Knowledge System
- Dynamic Career Reports
- Modern Glassmorphism UI

---

# 🚀 Future Enhancements

- Resume Version Control
- Voice-based Career Assistant
- Interview Simulation
- Live Job Scraping
- LinkedIn Profile Analysis
- AI Cover Letter Generator
- Portfolio Website Generator
- AI Mock Interviews
- Team/Admin Dashboard
- Resume Benchmarking

---

# 🛠️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/resumepilot-ai.git
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

# ResumePilot AI Backend Setup

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



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


# 🌍 Deployment

### Frontend

Deploy using:

- Vercel

### Backend

Deploy using:

- Render

---


# 👨‍💻 Developed By

**Sanskriti**  
AI/ML Enthusiast | Full Stack Developer | Agentic AI Explorer

---

## 💙 ResumePilot AI

**"Helping every resume reach the interview stage with the power of Agentic AI."**



