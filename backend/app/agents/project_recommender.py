import time
import logging
from typing import Dict, Any, List
from app.agents.state import ResumePilotState

logger = logging.getLogger("app.agents.project_recommender")

async def project_recommender_agent(state: ResumePilotState) -> Dict[str, Any]:
    """Compares candidate skills against target gaps and recommends learning projects from the career matrix."""
    start_time = time.time()
    logger.info("Project Recommender Agent executing...")

    current_profile = state.get("CurrentProfile") or {}
    target_profile = state.get("TargetProfile") or {}
    gap_analysis = state.get("GapAnalysis") or {}

    missing_skills = gap_analysis.get("missing_skills", [])
    matrix = target_profile.get("matrix", {})
    matrix_projects = matrix.get("recommended_projects", [])

    recommendations = []

    # If the matrix provides custom projects, filter and use them!
    if matrix_projects:
        matched_projects = []
        other_projects = []
        for proj in matrix_projects:
            # Check if any missing skill is addressed by this project
            target_skills = [s.lower() for s in proj.get("skills_learned", []) + proj.get("stack", [])]
            has_match = any(ms.lower() in target_skills or any(ts in ms.lower() for ts in target_skills) for ms in missing_skills)
            
            project_item = {
                "title": proj.get("title"),
                "description": proj.get("description") or proj.get("desc") or "",
                "skills_learned": proj.get("skills_learned", []),
                "stack": proj.get("stack", []),
                "difficulty": proj.get("difficulty", "Medium"),
                "duration": proj.get("duration", "4 Weeks"),
                "learning_outcome": proj.get("learning_outcome", ""),
                "repo_link": proj.get("repo_link", "https://github.com"),
                "docs_link": proj.get("docs_link", "https://docs.github.com"),
                "tutorial_link": proj.get("tutorial_link", "https://youtube.com"),
                "resume_impact": proj.get("resume_impact", {
                    "value_description": f"Tailored project targeting key {matrix.get('ats_keywords', [state.get('target_role')])[0]} capabilities.",
                    "section_strengthened": "Projects",
                    "ats_keywords": proj.get("stack", [])
                })
            }
            if has_match:
                matched_projects.append(project_item)
            else:
                other_projects.append(project_item)
        recommendations = matched_projects + other_projects

    # Fallback to general high-quality project lists if matrix recommended projects list is empty
    if not recommendations:
        target = state.get("target_role", "").lower()
        if "devops" in target or "sre" in target or "cloud" in target:
            recommendations = [
                {
                    "title": "Multi-Stage Docker React Build",
                    "description": "Containerize a React/Next.js application using Docker. Configure a multi-stage Dockerfile containing a lightweight Alpine Node environment and an Nginx production server.",
                    "skills_learned": ["Containerization", "Multi-stage building", "Nginx server routing"],
                    "stack": ["Docker", "Nginx", "Alpine Linux", "React"],
                    "difficulty": "Easy",
                    "duration": "2 Weeks",
                    "learning_outcome": "Understand Docker networking, container orchestration, image creation, Docker Compose, and production deployment.",
                    "repo_link": "https://github.com/vercel/next.js/tree/canary/examples/with-docker",
                    "docs_link": "https://docs.docker.com/",
                    "tutorial_link": "https://docs.docker.com/get-started/workshop/",
                    "resume_impact": {
                        "value_description": "Establishes core containerization and deployment pipelines for modern Single Page Applications (SPA).",
                        "section_strengthened": "DevOps / Production Experience",
                        "ats_keywords": ["Docker", "Nginx", "Containerization", "Multi-stage Build", "Alpine Linux"]
                    }
                },
                {
                    "title": "GitHub Actions CI/CD Pipeline Setup",
                    "description": "Establish a complete Continuous Integration/Continuous Deployment flow. Automate linting, unit testing compliance checks, and Docker container compilation on repository commits.",
                    "skills_learned": ["CI/CD Pipeline design", "Build automation", "Task runner setups"],
                    "stack": ["GitHub Actions", "Docker", "ESLint", "Node.js"],
                    "difficulty": "Medium",
                    "duration": "3 Weeks",
                    "learning_outcome": "Understand GitHub Actions YAML syntax, secrets configuration, continuous integration, and automated Docker repository deployments.",
                    "repo_link": "https://github.com/actions/starter-workflows",
                    "docs_link": "https://docs.github.com/en/actions",
                    "tutorial_link": "https://docs.github.com/en/actions/writing-workflows/quickstart",
                    "resume_impact": {
                        "value_description": "Demonstrates automation of verification and delivery flows, reducing release cycle times.",
                        "section_strengthened": "DevOps / Release Engineering",
                        "ats_keywords": ["GitHub Actions", "CI/CD Pipeline", "Build Automation", "Task Runners", "ESLint"]
                    }
                }
            ]
        elif "ai" in target or "ml" in target or "machine" in target or "data" in target:
            recommendations = [
                {
                    "title": "LangGraph Multi-Agent Assistant",
                    "description": "Build a stateful multi-agent system using LangGraph and LangChain. Implement supervisor routing nodes, human-in-the-loop validation, and shared state memory configurations.",
                    "skills_learned": ["Multi-agent coordination", "Stateful graph routing", "LLM tool calling", "Human-in-the-loop loops"],
                    "stack": ["LangGraph", "LangChain", "Python", "Groq"],
                    "difficulty": "Hard",
                    "duration": "6 Weeks",
                    "learning_outcome": "Understand LangGraph StateGraph, supervisor architectures, state persistence, agent tool bindings, and cognitive architectures.",
                    "repo_link": "https://github.com/langchain-ai/langgraph-studio-template",
                    "docs_link": "https://langchain-ai.github.io/langgraph/",
                    "tutorial_link": "https://langchain-ai.github.io/langgraph/tutorials/introduction/",
                    "resume_impact": {
                        "value_description": "Multi-agent systems are at the forefront of automation technology, demonstrating high-level LLM reasoning orchestration.",
                        "section_strengthened": "AI Engineering / Advanced Projects",
                        "ats_keywords": ["LangGraph", "LangChain", "Multi-Agent System", "Stateful Graph Routing", "LLM Tool Calling"]
                    }
                }
            ]
        else:
            recommendations = [
                {
                    "title": "Next.js & Tailwind CSS Responsive Dashboard",
                    "description": "Build a highly responsive, pixel-perfect dashboard using Next.js and Tailwind CSS. Implement dynamic charting, dark mode toggle, and optimized mobile-first grid layout.",
                    "skills_learned": ["Responsive Design", "Tailwind CSS layout grid", "Next.js routing", "Dynamic Charting"],
                    "stack": ["Next.js", "React", "Tailwind CSS", "Recharts"],
                    "difficulty": "Easy",
                    "duration": "2 Weeks",
                    "learning_outcome": "Understand utility-first styling, grid layouts, responsive breakpoints, and charting integrations.",
                    "repo_link": "https://github.com/vercel/next.js/tree/canary/examples/with-tailwindcss",
                    "docs_link": "https://tailwindcss.com/docs",
                    "tutorial_link": "https://nextjs.org/docs",
                    "resume_impact": {
                        "value_description": "Showcases modern styling conventions, responsive layouts, and standard dashboard interaction models.",
                        "section_strengthened": "Technical Skills / Projects",
                        "ats_keywords": ["Tailwind CSS", "Next.js", "Responsive Layout", "CSS Grid", "MUI", "Recharts"]
                    }
                }
            ]

    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    timeline_log = {
        "agent": "Project Recommender",
        "status": "completed",
        "duration_ms": round(duration_ms, 2)
    }

    return {
        "current_agent": "Project Recommender",
        "completed_agents": state.get("completed_agents", []) + ["Project Recommender"],
        "execution_timeline": state.get("execution_timeline", []) + [timeline_log],
        "ProjectRecommendations": {
            "recommendations": recommendations
        },
        "intermediate_results": {
            **state.get("intermediate_results", {}),
            "project_recommender": {
                "recommendations": recommendations
            }
        }
    }
