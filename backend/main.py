from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from graph import compiled_graph
from mcp_server import get_random_question



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
    result = compiled_graph.invoke(state)
    
    return result
    