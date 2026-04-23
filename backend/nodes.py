from state import InterviewState
from mcp_server import get_random_question
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

def system_design_node(state: InterviewState):
    question = get_random_question("technical")
    return {
        "current_phase": "technical",
        "questions_asked": state["questions_asked"] + [question],
         "current_question": question
        }

def technical_node(state: InterviewState):
    question = get_random_question("behavioral")
    return {
        "current_phase": "behavioral",
        "questions_asked": state["questions_asked"] + [question],
         "current_question": question
        }


def behavioral_node(state: InterviewState):
    return {
        "current_phase": "evaluation",
        "questions_asked": state["questions_asked"], 
        "current_question": ""
        }

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
