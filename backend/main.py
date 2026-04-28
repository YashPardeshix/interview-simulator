from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from graph import compiled_graph
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

class AnswerInput(BaseModel):
    answer: str
    thread_id: str

@app.get("/start")
def start_interview():
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
  
    initial_state = {
        "current_phase": "system_design",
        "questions_asked": [],
        "user_response": [],
        "topic_follow_up_count": 0,
        "phase_topic_count": 0,
        "current_topic": ""
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
    current_state = compiled_graph.get_state(config).values
    updated_responses = current_state.get("user_response", []) + [input.answer]
    compiled_graph.update_state(config, {"user_response": updated_responses})
    result = compiled_graph.invoke(None, config)
    
    return {
        "current_phase": result["current_phase"],
        "current_question": result["current_question"],
        "is_complete": result.get("current_phase") == "complete"
    }