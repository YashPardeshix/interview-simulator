from typing import TypedDict

class InterviewState(TypedDict):
    user_id: str  
    current_phase: str
    questions_asked: list[str]
    user_response: list[str]
    current_question: str
    topic_follow_up_count: int
    current_topic: str
    phase_topic_count: int
    user_info: dict
    scores: dict
    is_complete: bool
    target_role: str
