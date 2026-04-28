from state import InterviewState
from mcp_server import get_random_question
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("DEEPSEEK_API_KEY")
if not api_key:
    raise RuntimeError(
        "DEEPSEEK_API_KEY is not set. "
        "Add it to your .env file before starting the server."
    )

llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=api_key,
    base_url="https://api.deepseek.com"
)

def interview_node(state: InterviewState):
    phase = state["current_phase"]
    count = state["topic_follow_up_count"]
    topic = state["current_topic"]
    history = state["questions_asked"]

    if count < 2 and topic != "":
        # FIXED: Changed variable name from system_prompt to prompt to match the invoke call below
        prompt = f"""
ROLE: Senior Technical Interviewer ({phase} phase).
TOPIC: {topic}
REMAINING FOLLOW-UPS: {2 - count}

STRICT OUTPUT RULES:
1. Output ONLY the question or hint. 
2. NEVER output "Candidate Response", "Hypothetical", or "Reasoning".
3. NEVER output internal labels like "Your Follow-Up Question".
4. If you have 0 follow-ups left, you MUST call 'get_random_question' immediately.
5. Do not be overly polite. Be professional and direct.
"""
        response = llm.invoke(prompt)
        
        new_question = response.content
        new_count = count + 1
        new_topic = topic 
        new_phase_count = state["phase_topic_count"] 
    else:
        new_question = get_random_question(phase)
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
    You are a Senior Lead Engineer and Hiring Manager. 
    Review the following interview transcript and provide a world-class performance evaluation.

    TRANSCRIPT:
    {interview_transcript}

    OUTPUT FORMAT RULES:
    1. Use professional Markdown (Headers, Bold text, Bullet points).
    2. Section 1: **Overall Impression** (2-3 sentences).
    3. Section 2: **Technical Strengths** (Bullet points).
    4. Section 3: **Areas for Improvement** (Bullet points).
    5. Section 4: **Final Verdict** (Strong Hire / Hire / No Hire) and a Score out of 100.
    
    IMPORTANT: Do not output any conversational filler. Start directly with the evaluation.
    """

    response = llm.invoke(evaluation_prompt)
    
    return {
        "current_phase": "complete",
        "is_complete": True,
        "current_question": "", 
        "scores": {
            "feedback": response.content 
        }
    }