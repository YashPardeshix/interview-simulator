from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from graph import compiled_graph
from mcp_server import get_random_question
import uuid
from langgraph.types import Command



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
    thread_id: str = ""

    @field_validator('answer')
    @classmethod
    def sanitize_answer(cls, v):
        if len(v) > 2000:
            raise ValueError('Answer exceeds maximum length of 2000 characters')
        return v.strip()

    @field_validator('current_phase')
    @classmethod
    def validate_phase(cls, v):
        allowed = {"system_design", "technical", "behavioral", "evaluation"}
        if v not in allowed:
            raise ValueError(f'Invalid phase: {v}')
        return v


@app.get("/start")
def start_interview():
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    initial_state = {
        "current_phase": "system_design",
        "questions_asked": [],
        "user_info": {},
        "scores": {},
        "is_complete": False,
        "current_question": "",
        "user_response": [],
    }
    
    result = compiled_graph.invoke(initial_state, config)
    
    return {
        "thread_id": thread_id,
        "current_phase": result["current_phase"],
        "current_question": result["current_question"]
    }

@app.post("/answer")
def submit_answer(input: AnswerInput):
    config = {"configurable": {"thread_id": input.thread_id}}
    
    compiled_graph.update_state(config, {
        "user_response": input.all_answers,
        "questions_asked": input.asked_questions,
    })
    
    result = compiled_graph.invoke(None, config)
    
    return {
        "current_phase": result["current_phase"],
        "current_question": result["current_question"],
        "scores": result.get("scores", {}),
        "is_complete": result.get("is_complete", False)
    }
  
    