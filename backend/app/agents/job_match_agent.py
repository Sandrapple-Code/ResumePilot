import time
import logging
import json
from typing import Dict, Any
from app.agents.state import ResumePilotState
from app.services.ai_provider import map_model_name
from app.prompts.templates import JOB_MATCH_ANALYSIS_PROMPT

logger = logging.getLogger("app.agents.job_match")

async def job_match_agent(state: ResumePilotState) -> Dict[str, Any]:
    """Compares candidate resume against job description using Groq LLM or deterministic mock fallbacks."""
    start_time = time.time()
    logger.info("Job Match Agent executing...")

    # 1. Fetch input details
    parsed_resume = state.get("parsed_resume", {})
    job_description_raw = state.get("job_description_raw", "")
    target_role = state.get("target_role", "Senior Frontend Engineer")
    api_key = state.get("api_key", "")
    model = state.get("model", "Llama 3.3 70B")

    # If no job description is provided, return empty
    if not job_description_raw or not job_description_raw.strip():
        logger.warning("No Job Description available in state. Skipping comparison.")
        return {
            "current_agent": "Job Match",
            "completed_agents": state.get("completed_agents", []) + ["Job Match"],
            "execution_timeline": state.get("execution_timeline", []) + [{
                "agent": "Job Match",
                "status": "skipped",
                "duration_ms": 0.0
            }]
        }

    # 2. Invoke Groq or use role-tailored deterministic fallback
    result_data = None
    if api_key:
        try:
            from groq import Groq
            client = Groq(api_key=api_key.strip())
            mapped_model = map_model_name(model)
            
            prompt = JOB_MATCH_ANALYSIS_PROMPT.format(
                parsed_resume=json.dumps(parsed_resume, indent=2, ensure_ascii=False),
                job_description=job_description_raw
            )
            
            completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a professional recruiting coordinator that outputs ONLY structured JSON summaries."},
                    {"role": "user", "content": prompt}
                ],
                model=mapped_model,
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            response_text = completion.choices[0].message.content
            result_data = json.loads(response_text)
            logger.info("Groq job description comparison successful.")
        except Exception as e:
            logger.error(f"Groq comparison call failed: {str(e)}. Engaging fallback mock.")
            
    if not result_data:
        # Generate role-tailored deterministic fallbacks
        target = target_role.lower()
        if "devops" in target or "sre" in target or "cloud" in target:
            result_data = get_devops_mock()
        elif "ai" in target or "ml" in target or "machine" in target or "data" in target:
            result_data = get_aiml_mock()
        elif "fullstack" in target or "full-stack" in target or "backend" in target:
            result_data = get_fullstack_mock()
        else:
            result_data = get_frontend_mock()

    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    timeline_log = {
        "agent": "Job Match",
        "status": "completed",
        "duration_ms": round(duration_ms, 2)
    }

    return {
        "current_agent": "Job Match",
        "completed_agents": state.get("completed_agents", []) + ["Job Match"],
        "execution_timeline": state.get("execution_timeline", []) + [timeline_log],
        "intermediate_results": {
            **state.get("intermediate_results", {}),
            "job_match": result_data
        }
    }

def get_frontend_mock() -> Dict[str, Any]:
    return {
        "parsed_job_description": {
            "company_name": "NextGen UI Labs",
            "role": "Senior Frontend Engineer (React/Next.js)",
            "required_skills": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Jest", "State Management"],
            "preferred_skills": ["CI/CD workflows", "Webpack", "CSS Grid/Flexbox", "Storybook"],
            "experience_required": "4+ years of professional web app delivery",
            "responsibilities": [
                "Develop accessible, pixel-perfect user interfaces using React and Next.js.",
                "Implement modular frontend testing infrastructure using Jest and Testing Library.",
                "Optimize assets delivery and load latency budgets using code splitting."
            ],
            "qualifications": "B.S. in Computer Science, software engineering, or equivalent practical experience",
            "technologies": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Webpack", "Jest", "Framer Motion"],
            "certifications": [],
            "soft_skills": ["Technical Mentorship", "Cross-team Collaboration", "Product Ownership"]
        },
        "job_match": {
            "overall_match_score": 78,
            "ats_match_percentage": 74,
            "matched_skills": ["React", "TypeScript", "Tailwind CSS", "Next.js", "Git", "Redux"],
            "missing_skills": ["Jest", "Webpack Customization", "CI/CD Actions"],
            "missing_keywords": ["Jest testing harness", "Webpack bundle optimizations", "CI/CD automations"],
            "missing_technologies": ["Jest", "Webpack", "GitHub Actions"],
            "experience_match": "Partial Match. Candidate has 3 years of experience, while the role requests 4+ years.",
            "education_match": "Full Match. Candidate holds a relevant B.S. in Computer Science.",
            "certification_match": "Not requested by job description.",
            "actionable_suggestions": [
                "Highlight automated testing credentials like Jest and React Testing Library on your resume.",
                "Emphasize asset optimization and bundler experiences (Webpack/Turbopack) in frontend bullet points.",
                "Quantify application performance improvements using Lighthouse metric percentages."
            ],
            "projects_to_build": [
                {
                    "title": "React Component Testing Harness",
                    "desc": "Builds and tests mock API hooks using Jest, testing custom context state changes up to 90% coverage."
                },
                {
                    "title": "Next.js & Tailwind CSS Responsive Dashboard",
                    "desc": "Integrates responsive CSS layouts with charting tools, supporting custom themes and dark mode."
                }
            ],
            "skills_to_learn": ["Jest", "Webpack custom chunking", "CI/CD YAML workflows"],
            "keywords_to_add": ["Jest", "React Testing Library", "Asset Optimization", "Webpack Configs", "Lighthouse Index"],
            "experience_improvements": [
                "Mention testing frameworks (Jest/RTL) explicitly inside TechCorp Solutions job bullets.",
                "Highlight Webpack or Next.js configurations used during responsive dashboard assembly."
            ],
            "certifications_to_earn": [],
            "bullet_rewrites": [
                {
                    "original": "Helped the team build the React frontend and style the website.",
                    "improved": "Co-engineered Next.js responsive frontend layout using Tailwind CSS, increasing Lighthouse UI speed index by 25%.",
                    "rationale": "Uses strong active verbs and quantifies user-centric performance impact."
                },
                {
                    "original": "Worked on Python script optimization and handled docker container deployment.",
                    "improved": "Streamlined release workflows by authoring GitHub Actions pipelines, decreasing local container build times by 40%.",
                    "rationale": "Emphasizes automation, CI/CD keywords, and performance metrics."
                }
            ]
        }
    }

def get_devops_mock() -> Dict[str, Any]:
    return {
        "parsed_job_description": {
            "company_name": "CloudScale Systems",
            "role": "Cloud DevOps Specialist",
            "required_skills": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD Pipelines", "Linux Shell"],
            "preferred_skills": ["Nginx", "GitHub Actions", "Prometheus/Grafana", "Python script automation"],
            "experience_required": "5+ years managing AWS Cloud Infrastructure",
            "responsibilities": [
                "Automate VPC and ECS cluster deployments using Terraform Infrastructure as Code (IaC).",
                "Construct and optimize multi-stage Docker build automation pipelines.",
                "Monitor and maintain high-availability systems with Prometheus metrics and log aggregators."
            ],
            "qualifications": "B.S. in Computer Science or similar engineering major",
            "technologies": ["Docker", "Kubernetes", "AWS", "Terraform", "Nginx", "GitHub Actions", "Python", "Linux"],
            "certifications": ["AWS Certified Solutions Architect", "Certified Kubernetes Administrator (CKA)"],
            "soft_skills": ["Site Reliability Engineering", "Incident Response", "On-call coordination"]
        },
        "job_match": {
            "overall_match_score": 68,
            "ats_match_percentage": 62,
            "matched_skills": ["Docker", "Git", "Python", "Linux"],
            "missing_skills": ["Kubernetes", "AWS ECS/EKS", "Terraform IaC", "CI/CD Pipeline Setup", "Monitoring"],
            "missing_keywords": ["Terraform IaC", "AWS ECS cluster provisioning", "Kubernetes container orchestration", "GitHub Actions CI/CD"],
            "missing_technologies": ["Kubernetes", "Terraform", "AWS ECS", "GitHub Actions"],
            "experience_match": "Partial Match. Candidate has 3 years of engineering experience, while the role requests 5+ years of AWS DevOps management.",
            "education_match": "Full Match. Candidate holds a relevant B.S. in Computer Science.",
            "certification_match": "Partial Match. Candidate holds AWS Certified Cloud Practitioner but lacks the Solutions Architect or CKA licenses.",
            "actionable_suggestions": [
                "Add a dedicated Projects section highlighting Terraform Infrastructure as Code deployments.",
                "Emphasize multi-stage Docker container builds to decrease production deployment footprint.",
                "Incorporate CI/CD metrics (e.g. build duration reduction, automated deployments) into experience bullets."
            ],
            "projects_to_build": [
                {
                    "title": "Terraform AWS Infrastructure Deployment",
                    "desc": "Automates VPC networking, subnets, and ECS cluster configuration using Terraform declarative layouts."
                },
                {
                    "title": "GitHub Actions CI/CD Pipeline Setup",
                    "desc": "Creates full linting, unit testing, and Docker compilation triggers automated on GitHub commits."
                }
            ],
            "skills_to_learn": ["Kubernetes", "Terraform", "AWS ECS", "GitHub Actions", "Prometheus"],
            "keywords_to_add": ["Terraform", "Kubernetes", "Infrastructure as Code", "CI/CD Pipeline", "AWS ECS", "YAML workflows"],
            "experience_improvements": [
                "Quantify Docker container optimizations performed during internship (e.g. reduced image size by 45%).",
                "Highlight automated release scripting using Python and Bash under internship details."
            ],
            "certifications_to_earn": ["AWS Certified Solutions Architect", "Certified Kubernetes Administrator (CKA)"],
            "bullet_rewrites": [
                {
                    "original": "Worked on Python script optimization and handled docker container deployment.",
                    "improved": "Configured multi-stage Docker builds and automated Nginx deployments, reducing container sizes by 45%.",
                    "rationale": "Incorporates clear DevOps achievements, container sizing metrics, and web routing keywords."
                },
                {
                    "original": "Helped the team build the React frontend and style the website.",
                    "improved": "Collaborated on React frontend builds and engineered automated GitHub Actions build pipelines, decreasing cycle times by 30%.",
                    "rationale": "Introduces GitHub Actions, CI/CD keyword density, and release lifecycle metrics."
                }
            ]
        }
    }

def get_aiml_mock() -> Dict[str, Any]:
    return {
        "parsed_job_description": {
            "company_name": "Cognitive AI Lab",
            "role": "Machine Learning Engineer (NLP / Agents)",
            "required_skills": ["Python", "PyTorch", "Hugging Face", "LLM Fine-tuning", "LangGraph", "ChromaDB RAG"],
            "preferred_skills": ["TensorFlow", "FastAPI", "Vector Databases", "Docker containerization"],
            "experience_required": "3+ years engineering AI/ML architectures",
            "responsibilities": [
                "Design stateful multi-agent pipelines using LangGraph and LangChain.",
                "Construct high-concurrency RAG services with FastAPI and ChromaDB vector indexing.",
                "Optimize transformer model weights and fine-tune NLP models with PyTorch."
            ],
            "qualifications": "B.S., M.S., or Ph.D. in Computer Science, Data Science, or Mathematics",
            "technologies": ["Python", "PyTorch", "Hugging Face", "LangGraph", "LangChain", "ChromaDB", "FastAPI", "Docker"],
            "certifications": [],
            "soft_skills": ["Analytical Reasoning", "Research translation", "Technical writing"]
        },
        "job_match": {
            "overall_match_score": 74,
            "ats_match_percentage": 68,
            "matched_skills": ["Python", "React", "TypeScript", "Git", "Docker"],
            "missing_skills": ["PyTorch", "LangGraph multi-agents", "ChromaDB RAG", "LLM fine-tuning", "FastAPI"],
            "missing_keywords": ["stateful graph routing", "vector store retrievals", "multi-agent systems", "fine-tuning transformers"],
            "missing_technologies": ["PyTorch", "LangGraph", "LangChain", "ChromaDB", "FastAPI"],
            "experience_match": "Full Match. Candidate has 3+ years experience with software engineering and Python scripting.",
            "education_match": "Full Match. Candidate holds a relevant B.S. in Computer Science.",
            "certification_match": "Not requested by job description.",
            "actionable_suggestions": [
                "Explicitly describe projects using LangGraph cognitive architectures and RAG retrievals on your resume.",
                "Highlight FastAPI REST endpoint design for high-performance python API deployments.",
                "Mention model training, validation, or tensor manipulation libraries (NumPy, PyTorch) in skills lists."
            ],
            "projects_to_build": [
                {
                    "title": "LangGraph Multi-Agent Assistant",
                    "desc": "Builds stateful graph routing and LLM tool calling systems with human-in-the-loop triggers."
                },
                {
                    "title": "FastAPI Realworld Backend API",
                    "desc": "Establishes asynchronous Python endpoints with SQLModel ORM and PostgreSQL data layers."
                }
            ],
            "skills_to_learn": ["PyTorch", "LangGraph", "FastAPI", "ChromaDB RAG pipelines", "Hugging Face Hub"],
            "keywords_to_add": ["LangGraph", "ChromaDB", "RAG Retriever", "Stateful Graph Routing", "FastAPI", "PyTorch", "LLM tool calling"],
            "experience_improvements": [
                "Reframe Python script optimizations to highlight model weights indexing and memory caching improvements.",
                "Detail Next.js/React dashboard builds to highlight telemetry/monitoring charts for AI metrics."
            ],
            "certifications_to_earn": [],
            "bullet_rewrites": [
                {
                    "original": "Worked on Python script optimization and handled docker container deployment.",
                    "improved": "Optimized Python retrieval scripts and configured ChromaDB vector stores, speeding up semantic search indexing by 50%.",
                    "rationale": "Incorporates key AI/ML RAG technologies, indexing processes, and speed metrics."
                },
                {
                    "original": "Helped the team build the React frontend and style the website.",
                    "improved": "Engineered Next.js frontend interfaces to visual telemetry streams for AI pipelines, boosting user engagement by 20%.",
                    "rationale": "Emphasizes technical dashboard integrations, telemetry keywords, and metrics."
                }
            ]
        }
    }

def get_fullstack_mock() -> Dict[str, Any]:
    return {
        "parsed_job_description": {
            "company_name": "ScaleDev Inc",
            "role": "Full-Stack Engineer (React & FastAPI)",
            "required_skills": ["React", "Next.js", "FastAPI", "Python", "PostgreSQL ORM", "TypeScript"],
            "preferred_skills": ["Docker", "Supabase realtime", "REST API design", "Tailwind CSS"],
            "experience_required": "3+ years delivering commercial web applications",
            "responsibilities": [
                "Design high-performance database schemas and implement FastAPI ORM routes.",
                "Build stateful, responsive Next.js frontend layouts styled with Tailwind CSS.",
                "Integrate real-time updates and secure OAuth2 login credentials."
            ],
            "qualifications": "B.S. in Computer Science or equivalent experience",
            "technologies": ["React", "TypeScript", "Next.js", "FastAPI", "Python", "PostgreSQL", "Supabase", "Docker", "Tailwind CSS"],
            "certifications": [],
            "soft_skills": ["Fullstack ownership", "System Design", "Agile delivery"]
        },
        "job_match": {
            "overall_match_score": 82,
            "ats_match_percentage": 78,
            "matched_skills": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Python", "Git", "Docker"],
            "missing_skills": ["FastAPI", "PostgreSQL ORM", "Supabase database", "OAuth2 login"],
            "missing_keywords": ["FastAPI asynchronous routes", "PostgreSQL schema design", "Supabase realtime listeners"],
            "missing_technologies": ["FastAPI", "PostgreSQL", "Supabase"],
            "experience_match": "Full Match. Candidate has 3+ years experience spanning React and Python scripting.",
            "education_match": "Full Match. Candidate holds a relevant B.S. in Computer Science.",
            "certification_match": "Not requested by job description.",
            "actionable_suggestions": [
                "Showcase FastAPI RESTful APIs and schema modeling (SQLModel, Pydantic) on your resume.",
                "Highlight Supabase realtime socket integration or row-level security policy creation.",
                "Incorporate quantitative metrics regarding SQL query optimization and endpoint speedups."
            ],
            "projects_to_build": [
                {
                    "title": "FastAPI Realworld Backend API",
                    "desc": "Establishes async python REST API with SQLModel, PostgreSQL migrations, and Pydantic validation."
                },
                {
                    "title": "Supabase Next.js Realtime Chat Hub",
                    "desc": "Implements collaborative chat channels, Supabase authorization listeners, and row-level security policies."
                }
            ],
            "skills_to_learn": ["FastAPI", "PostgreSQL", "Supabase realtime", "OAuth2 auth mechanisms"],
            "keywords_to_add": ["FastAPI", "PostgreSQL", "Supabase", "OAuth2", "Pydantic validation", "Asynchronous endpoints"],
            "experience_improvements": [
                "Explicitly describe SQL migrations and database session handling inside backend bullet points.",
                "Highlight REST API integrations performed when configuring React contexts."
            ],
            "certifications_to_earn": [],
            "bullet_rewrites": [
                {
                    "original": "Worked on Python script optimization and handled docker container deployment.",
                    "improved": "Optimized backend Python scripts and database queries, decreasing REST API server response latencies by 35%.",
                    "rationale": "Tailored to Fullstack API demands, highlighting latency optimization and backend profiling."
                },
                {
                    "original": "Helped the team build the React frontend and style the website.",
                    "improved": "Built modular Next.js dashboard UI styled with Tailwind CSS, accelerating first-contentful paint by 1.8s.",
                    "rationale": "Focuses on premium styling benchmarks, loading speed metrics, and responsive Next.js stack."
                }
            ]
        }
    }
