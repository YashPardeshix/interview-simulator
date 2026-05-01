from langgraph.graph import StateGraph, END
from state import InterviewState
from nodes import interview_node, prepare_for_technical, prepare_for_system_design, prepare_for_behavioral, evaluation_node, profiler_node
from langgraph.checkpoint.memory import MemorySaver

memory = MemorySaver()

def router_function(state: InterviewState):
    if state["topic_follow_up_count"] < 2 and state["current_topic"] != "":
        return "interview_node"

    if state["phase_topic_count"] < 1:
        return "interview_node"


    current = state["current_phase"]
    if current == "system_design":
        return "prepare_for_technical"
    elif current == "technical":
        return "prepare_for_behavioral"
    else:
        return "evaluation_node"

workflow = StateGraph(InterviewState)

workflow.add_node("profiler_node", profiler_node) 
workflow.add_node("interview_node", interview_node)
workflow.add_node("evaluation_node", evaluation_node)

workflow.add_node("prepare_for_technical", prepare_for_technical)
workflow.add_node("prepare_for_system_design", prepare_for_system_design)
workflow.add_node("prepare_for_behavioral", prepare_for_behavioral)

workflow.set_entry_point("profiler_node")

workflow.add_edge("profiler_node", "prepare_for_system_design")

workflow.add_conditional_edges("interview_node", router_function)
workflow.add_edge("prepare_for_system_design", "interview_node")
workflow.add_edge("prepare_for_technical", "interview_node")
workflow.add_edge("prepare_for_behavioral", "interview_node")
workflow.add_edge("evaluation_node", END)

compiled_graph = workflow.compile(
    checkpointer=memory,
    interrupt_after=["interview_node"] 
)