from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from graph import compiled_graph
import uuid
from nodes import supabase
from fastapi import FastAPI, File, UploadFile, Form
from nodes import extract_text_from_pdf 

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

@app.post("/start") 
async def start_interview(
    user_id: str = Form(...), 
    role: str = Form(...),
    resume: UploadFile = File(...) 
):
    print(f"DEBUG: Received interview request for User: {user_id}, Role: {role}")
    
    file_bytes = await resume.read()
    
    resume_text = extract_text_from_pdf(file_bytes)
    print(f"DEBUG: Extracted {len(resume_text)} characters from resume.")
   
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
  
    initial_state = {
        "user_id": user_id,
        "target_role": role,
        "resume_text": resume_text,
        "candidate_profile": {},    
        "current_phase": "system_design",
        "questions_asked": [],
        "user_response":[],
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
        "is_complete": result.get("current_phase") == "complete",
        "scores": result.get("scores", {})
    }

@app.get("/history/{user_id}")
def get_interview_history(user_id: str):
    print(f"DEBUG: Fetching history for User ID: {user_id}") 
    try:
        response = supabase.table("interviews") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
            
        print(f"DEBUG: Found {len(response.data)} rows.") 
        return response.data
    except Exception as e:
        print(f"DEBUG: Error: {e}")
        return {"error": str(e)}