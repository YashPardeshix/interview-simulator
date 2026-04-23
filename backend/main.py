from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from graph import compiled_graph
from mcp_server import get_random_question
from nodes import system_design_node, technical_node, behavioral_node, evaluation_node
import json


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

class AnswerInput(BaseModel):
    answer: str
    current_phase: str
    all_answers: list = []
    asked_questions: list = []


@app.get("/start")
def start_interview():
    question = get_random_question("system_design")
    return {
        "current_phase": "system_design",
        "current_question": question
    }

@app.post("/answer")
def submit_answer(input: AnswerInput):
    state = {
        "current_phase": input.current_phase,
        "questions_asked": input.asked_questions,
        "user_info": {},
        "scores": {},
        "is_complete": False,
        "current_question": "",
        "user_response": input.all_answers,
    }
    if input.current_phase == "system_design":
        result = system_design_node(state)
    elif input.current_phase == "technical":
        result = technical_node(state)
    elif input.current_phase == "behavioral":
        result = behavioral_node(state)
    else:
        result = evaluation_node(state)
    
    return result
    