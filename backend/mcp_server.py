import random
from fastmcp import FastMCP
mcp = FastMCP("Question Bank")

QUESTION_BANK = {
    "system_design": [
        "How would you design a URL shortener like bit.ly?",
        "How would you design a chat application like WhatsApp?",
        "How would you design a file storage system like Google Drive?"
    ],
    "technical": [
        "What is the difference between SQL and NoSQL databases?",
        "Explain how REST APIs work.",
        "What is the difference between authentication and authorization?"
    ],
    "behavioral": [
        "Tell me about a project you built and the biggest challenge you faced.",
        "How do you handle a situation where you don't know the answer to a problem?",
        "Where do you see yourself in 2 years?"
    ]
}


@mcp.tool()
def get_random_question(phase):
    if phase in QUESTION_BANK:
        return random.choice(QUESTION_BANK[phase])
    else:
        return "No questions available for this phase."
