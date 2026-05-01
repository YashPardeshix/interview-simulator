import random
from fastmcp import FastMCP
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

mcp = FastMCP("Question Bank")

llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

QUESTION_BANK = {
    "system_design":["How would you design a URL shortener like bit.ly?"],
    "technical": ["What is the difference between SQL and NoSQL databases?"],
    "behavioral": ["Tell me about a project you built and the biggest challenge you faced."]
}

@mcp.tool()
def get_random_question(phase: str, profile: dict = None):
    if profile and "skills" in profile and len(profile["skills"]) > 0:
        skill = random.choice(profile["skills"])
        
        prompt = f"""
        You are a Senior Lead Engineer at a top-tier technology company.
        You have conducted hundreds of technical interviews. You are
        precise, direct, and sophisticated. You do not waste words.

        INPUTS:
        - CANDIDATE_SKILL: {skill}
        - CURRENT_PHASE: {phase}

        ---
        ## YOUR ONLY JOB
        Generate exactly one interview question based on the phase logic
        below. Output the question and nothing else.

        ---
        ## PHASE LOGIC
        - If Technical: Ask a deep, challenging question about the internals of {skill}.
        - If System Design: Ask how to integrate {skill} in a high-scale, production system.
        - If Behavioral: Ask about a real human situation (leadership/conflict) connected to {skill}. Zero technical questions.

        ---
        ## ABSOLUTE CONSTRAINTS — NEVER BREAK THESE
        - Output ONLY the question. Nothing before or after.
        - No greetings, no affirmations, no filler ("Based on your resume", etc).
        - No explaining reasoning or thinking out loud.
        - Maximum length: 2 to 3 sentences.
        - Use professional Markdown ONLY for clarity.
        """
        
        response = llm.invoke(prompt)
        return response.content
            

    if phase in QUESTION_BANK:
        return random.choice(QUESTION_BANK[phase])
    else:
        return "Are you ready for your next question?"
    