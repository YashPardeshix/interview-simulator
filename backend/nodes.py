import state
from state import InterviewState
from mcp_server import get_random_question
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from supabase import create_client, Client
from pypdf import PdfReader
import json
import os
import io

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

api_key = os.getenv("DEEPSEEK_API_KEY")
if not api_key:
    raise RuntimeError(
        "DEEPSEEK_API_KEY is not set. "
        "Add it to your .env file before starting the server."
    )

llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=api_key,
    base_url="https://api.deepseek.com",
    timeout=30, 
    max_retries=1
)

def interview_node(state: InterviewState):
    phase = state["current_phase"]
    count = state["topic_follow_up_count"]
    topic = state["current_topic"]
    history = state["questions_asked"]

    profile = state.get("candidate_profile", {})

    if count < 2 and topic != "":
        prompt = f"""
        You are a Senior Lead Interviewer.
        PHASE: {phase}
        TOPIC: {topic}
        REMAINING FOLLOW-UPS: {2 - count}

        CANDIDATE BACKGROUND:
        {profile}

        PHASE LOGIC (CRITICAL):
        - If Technical: Ask a deep, challenging question about the internals and code of the topic.
        - If System Design: Ask about architecture, scaling, and system integration.
        - If Behavioral: Ask about leadership, conflict, deadlines, or teamwork. ZERO technical or coding questions allowed in this phase.

        STRICT OUTPUT RULES:
        1. Output ONLY the question. No filler.
        2. Max length: 2 to 3 sentences.
        3. Tailor the question to their CANDIDATE BACKGROUND if relevant.
        """
        response = llm.invoke(prompt)
        
        new_question = response.content
        new_count = count + 1
        new_topic = topic 
        new_phase_count = state["phase_topic_count"] 
    else:
        profile = state.get("candidate_profile", {})
        new_question = get_random_question(phase, profile)
        new_count = 0
        new_topic = new_question 
        new_phase_count = state["phase_topic_count"] + 1 

    return {
        "current_question": new_question,
        "questions_asked": history + [new_question],
        "topic_follow_up_count": new_count,
        "current_topic": new_topic,
        "phase_topic_count": new_phase_count
    }


def prepare_for_system_design(state: InterviewState):
    return {"current_phase": "system_design", "topic_follow_up_count": 0, "phase_topic_count": 0, "current_topic": ""}

def prepare_for_technical(state: InterviewState):
    return {"current_phase": "technical", "topic_follow_up_count": 0, "phase_topic_count": 0, "current_topic": ""}

def prepare_for_behavioral(state: InterviewState):
    return {"current_phase": "behavioral", "topic_follow_up_count": 0, "phase_topic_count": 0, "current_topic": ""}


def evaluation_node(state: InterviewState):
  
    questions = state.get("questions_asked", [])
    answers = state.get("user_response", [])
   
   
    interview_transcript = ""
    for i, (q, a) in enumerate(zip(questions, answers)):
        interview_transcript += f"### Round {i+1}\n**Question:** {q}\n**Candidate Answer:** {a}\n\n"

    evaluation_prompt = f"""
    You are a Senior Lead Engineer. 
    Review this interview transcript and provide a brief, punchy performance evaluation.

    TRANSCRIPT:
    {interview_transcript}

    OUTPUT FORMAT RULES (CRITICAL):
    1. KEEP IT SHORT. Maximum 200 words total. Do not write long paragraphs.
    2. Use professional Markdown (Headers, Bullet points).
    3. Include exactly 4 sections: 
       ### Overall Impression
       ### Top Strength (1 bullet)
       ### Area for Improvement (1 bullet)
       ### Final Verdict (Hire / No Hire)
    
    IMPORTANT: Output ONLY the evaluation. Start immediately.
    """

    
    try:
        response = llm.invoke(evaluation_prompt)
        report = response.content 
    except Exception as e:
        print(f"LLM Timeout Error: {e}")
        report = "### System Notice\n\nThe AI evaluation engine timed out due to heavy global server load on DeepSeek. Your interview was completed successfully and saved, but the scorecard generation failed. Please try again later."

    try:
        supabase.table("interviews").insert({
            "user_id": state.get("user_id"),
            "feedback_report": report,
            "target_role": state.get("target_role", "Software Engineer")
        }).execute()
    except Exception as e:
        print(f"Database error: {e}")

    return {
        "current_phase": "complete",
        "is_complete": True,
        "current_question": "", 
        "scores": {"feedback": report}
    }



def extract_text_from_pdf(file_bytes):
    reader = PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text



def profiler_node(state: InterviewState):
    resume = state.get("resume_text", "")
    
    prompt = f"""
    You are an Expert Resume Profiler. 
    Analyze the following resume text and extract ONLY the technical skills and major projects.
    
    RESUME TEXT:
    {resume}
    
    OUTPUT FORMAT:
    You MUST return a valid JSON object with this exact structure:
    {{
        "skills": ["skill1", "skill2"],
        "projects": [
            {{"name": "Project Name", "tech_stack": ["tech1"], "summary": "Brief description"}}
        ]
    }}
    Do not include any other text. Only the JSON.
    """
    
    response = llm.invoke(prompt)
    
    try:
        clean_profile = json.loads(response.content)
    except:
        clean_profile = {"skills": [], "projects": []}

    return {"candidate_profile": clean_profile}