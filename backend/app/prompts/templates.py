# Prompt Templates for ResumePilot AI LLM Invocations

SYSTEM_PROMPT = """
You are Pilo, a friendly and experienced pilot bear mascot and AI Career Assistant for the ResumePilot AI platform.
Your tone is professional, encouraging, spacious, and friendly. You love helping candidates land their dream roles.
"""

CAREER_CHAT_PROMPT = """
You are Pilo, the friendly bear co-pilot career assistant. 

Context Details:
- Target Job Role: {target_role}

Conversation History Logs:
{history_context}

User's Input Message: {user_message}

Provide a helpful, friendly, and structured response. Keep it conversational but concise. Use bullet points if listing ideas. Incorporate active verbs and metric-driven career coaching advice.
"""

RESUME_ANALYSIS_PROMPT = """
Analyze the following parsed resume details against the candidate's target job role.

Target Job Role: {target_role}

Parsed Resume Data Structure:
{parsed_resume}

Conduct a comprehensive review of the resume details. Output your review ONLY as a valid, parsable JSON object with the following structure. Do not wrap in markdown blocks other than JSON, and do not append additional text.

{{
  "summary_feedback": "AI-generated feedback for the Professional Summary section.",
  "experience_feedback": "AI-generated feedback for the Work Experience section.",
  "projects_feedback": "AI-generated feedback for the Projects section.",
  "skills_feedback": "AI-generated feedback for the Skills section.",
  "education_feedback": "AI-generated feedback for the Education section.",
  "certifications_feedback": "AI-generated feedback for the Certifications section.",
  "achievements_feedback": "AI-generated feedback for the Achievements & Honors section.",
  "grammar_feedback": "AI-generated feedback on Grammar, phrasing, and typos.",
  "formatting_feedback": "AI-generated feedback on structural Layout and PDF flow.",
  "keywords_feedback": "AI-generated feedback on key industry keywords matching.",
  "action_verbs_feedback": "AI-generated feedback on active verbs and metric impact.",
  "overall_quality_feedback": "Overall summary review and general encouragement.",
  "suggested_revisions": [
    {{
      "original": "Original passive/weak bullet point found in work experience.",
      "improved": "AI-suggested metric-driven bullet starting with an active verb.",
      "rationale": "Rationale explaining why this change improves ATS compatibility."
    }}
  ]
}}
"""

FUTURE_JOB_MATCHING_PROMPT = """
You are Pilo. Evaluate the candidate's parsed skills against the specific job requirement description.
Candidate Skills: {skills}
Job Requirement: {requirement}

Provide a match score (0-100), key matching highlights, and missing recommendations.
"""

JOB_MATCH_ANALYSIS_PROMPT = """
Analyze the candidate's parsed resume details against the provided Job Description.

Candidate Resume Data Structure:
{parsed_resume}

Job Description Text:
{job_description}

Perform a deep semantic matching between the candidate's skills/experience and the job description requirements.
Output your analysis ONLY as a valid, parsable JSON object with the following structure. Do not wrap in markdown blocks other than JSON, and do not append additional text.

{{
  "parsed_job_description": {{
    "company_name": "Name of company hiring, or 'Unknown' if not mentioned.",
    "role": "Target role title.",
    "required_skills": ["List of required skills/technologies."],
    "preferred_skills": ["List of preferred or optional skills/technologies."],
    "experience_required": "Summary of experience requested.",
    "responsibilities": ["List of core responsibilities."],
    "qualifications": "Summary of educational or general qualifications requested.",
    "technologies": ["List of tools, frameworks, and technologies mentioned in the JD."],
    "certifications": ["List of requested certifications if any."],
    "soft_skills": ["List of soft skills mentioned."]
  }},
  "job_match": {{
    "overall_match_score": 75,
    "ats_match_percentage": 70,
    "matched_skills": ["Skills from candidate's resume that match required/preferred skills (use semantic matching)."],
    "missing_skills": ["Required/preferred skills from the job description that the candidate lacks on their resume."],
    "missing_keywords": ["Specific keywords/phrases from the JD that are absent in the resume."],
    "missing_technologies": ["Specific tools/technologies from the JD that are not on the candidate's resume."],
    "experience_match": "Analysis of candidate experience vs job requirement.",
    "education_match": "Analysis of candidate education vs job requirement.",
    "certification_match": "Analysis of candidate certifications vs job requirement.",
    "actionable_suggestions": ["Actionable items to bridge gaps on the resume."],
    "projects_to_build": [
      {{
        "title": "Project title to build to bridge gaps",
        "desc": "Short description of the project."
      }}
    ],
    "skills_to_learn": ["Skills to acquire to become a stronger match."],
    "keywords_to_add": ["ATS keywords/phrases to incorporate into the resume."],
    "experience_improvements": ["Suggestions on how to improve experience descriptions."],
    "certifications_to_earn": ["Certifications to acquire."],
    "bullet_rewrites": [
      {{
        "original": "Weak/passive bullet from candidate's resume work experience.",
        "improved": "An improved, metrics-driven bullet tailored to this job description starting with an active verb.",
        "rationale": "Explanation of why this rewrite fits the job description better."
      }}
    ]
  }}
}}
"""

