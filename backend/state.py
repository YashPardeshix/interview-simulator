from typing import TypedDict

class InterviewState(TypedDict):
    current_phase: str
    questions_asked: list[str]
    user_response: list[str]
    user_info: dict
    scores: dict
    is_complete: bool
    current_question: str



