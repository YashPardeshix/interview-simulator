from langgraph.graph import StateGraph, END
from state import InterviewState
from nodes import system_design_node, technical_node, behavioral_node, evaluation_node

def router_function(state: InterviewState):
    if state["current_phase"] == "technical":
        return "technical_node"
    elif state["current_phase"] == "behavioral":
        return "behavioral_node"
    elif state["current_phase"] == "evaluation":
        return "evaluation_node"
    else:
        return "END"
    

graph = StateGraph(InterviewState)
graph.add_node("system_design_node", system_design_node)
graph.add_node("technical_node", technical_node)
graph.add_node("behavioral_node", behavioral_node)
graph.add_node("evaluation_node", evaluation_node)
graph.set_entry_point("system_design_node")
graph.add_conditional_edges("system_design_node", router_function)
graph.add_conditional_edges("technical_node", router_function)
graph.add_conditional_edges("behavioral_node", router_function)
compiled_graph = graph.compile()


