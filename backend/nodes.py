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
        prompt = f"We are in the {phase} phase. The topic is {topic}. Ask a follow-up. You have {2-count} follow-ups left."
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
    questions = state["questions_asked"]
    answers = state["user_response"]
    
    pairs = list(zip(questions, answers))
    
    prompt = "You are an expert technical interviewer. Evaluate these interview answers:\n\n"
    
    for i, (question, answer) in enumerate(pairs):
        prompt += f"Q{i+1}: {question}\nA{i+1}: {answer}\n\n"
    
    prompt += "Give a score out of 10 for each answer and an overall score. Be specific about strengths and weaknesses."
    
    response = llm.invoke(prompt)
    
    return {
        "current_phase": "complete",
        "current_question": "",
        "is_complete": True,
        "scores": {"feedback": response.content}
    }
