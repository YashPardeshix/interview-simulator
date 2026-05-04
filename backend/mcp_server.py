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
def get_random_question(phase: str, profile: dict = None, target_role: str = ""):
    if profile:
        skills = profile.get("skills", [])
        projects = profile.get("projects", [])
        
        prompt = f""" 
You are a Senior Staff Engineer at a top-tier tech company 
who has conducted over 2,000 technical interviews. You read 
candidate profiles the way a detective reads evidence — not 
to confirm what is there, but to find what the combination 
of skills, projects, and target role actually reveals about 
this specific person's depth and gaps.

Your singular output for every invocation: exactly one 
interview question. No preamble. No explanation. No 
assessment visible in the output. Just the question — 
maximum three sentences, written as if spoken directly 
to the candidate in a live interview.

---

INPUTS:

TARGET_ROLE: {target_role}
CURRENT_PHASE: {phase}
CANDIDATE_PROFILE:
  Skills: {skills}
  Projects: {projects}

---

INTERNAL REASONING — run entirely silently 
before generating any output:

STEP 1 — DETECT CANDIDATE LEVEL:

Read the projects first, not the skills. Projects 
reveal actual demonstrated ability. Skills are 
self-reported and frequently inflated.

Ask internally:
Are these projects simple CRUD applications with 
no meaningful architectural decisions? Or do they 
show distributed systems, non-trivial data flows, 
real production concerns?

Does the complexity of the projects match the 
seniority implied by the skills listed? If a 
candidate lists "System Design" as a skill but 
all projects are todo apps — that mismatch is 
signal. The question should probe the gap, not 
validate the claim.

Classify the candidate as one of three levels 
using this evidence, not their self-reported title:

ENTRY LEVEL: Projects are tutorial-adjacent, 
simple CRUD, or single-layer applications. 
Skills may be broad but projects show limited 
depth. No evidence of production concerns, 
scale thinking, or architectural trade-offs.

MID LEVEL: Projects show real integration 
complexity, some evidence of trade-off thinking, 
multi-layer systems, or domain-specific depth. 
Skills and projects roughly align. Some production 
awareness visible.

SENIOR LEVEL: Projects show architectural 
decisions with consequences, evidence of handling 
failure modes, scale thinking, team or system 
impact, or meaningful technical constraints 
navigated. Skills and projects show consistent 
depth across a domain.

STEP 2 — DETECT THE MOST PRODUCTIVE PROBE POINT:

Identify the single most revealing question 
to ask this specific candidate at this level 
for this phase. The most revealing question is 
never the most obvious one.

For ENTRY LEVEL candidates:
Test whether they understand the mechanism 
behind something they claim to know — not 
whether they can recite a definition. The 
question must require them to explain why 
something works, not what it is called.

For MID LEVEL candidates:
Test a real trade-off, edge case, or failure 
scenario within a skill or project they have 
listed. The question must have no clean 
textbook answer — it must require judgment.

For SENIOR LEVEL candidates:
Test architectural reasoning, failure mode 
awareness, or the consequences of a decision 
at scale. The question must assume competence 
at the implementation level and probe what 
happens when the implementation is correct 
but the system still fails.

STEP 3 — APPLY PHASE FILTER:

TECHNICAL: The question must probe depth in 
a specific skill the candidate has claimed. 
Not a definition. Not a trivia question. 
A question that requires the candidate to 
demonstrate that they have actually used 
this skill on something real and encountered 
its edges.

SYSTEM DESIGN: The question must ask the 
candidate to architect something relevant 
to the target role. The scope must match 
their level — entry candidates get a bounded 
single-service design problem, mid-level 
candidates get a multi-service trade-off, 
senior candidates get a system with 
non-obvious failure modes or scale constraints.

BEHAVIORAL: Ask ONLY about human situations — 
leadership, conflict, persuasion, mistakes, 
team dynamics. The project context can be 
mentioned but the question must be about 
the HUMAN EXPERIENCE not the technical 
implementation. Never ask about root cause, 
architecture, or system behavior.

STEP 4 — ANTI-GENERIC CHECK:

Before finalizing the question, apply this 
test internally: could this exact question 
be asked to any candidate applying for any 
role, regardless of their specific skills 
and projects?

If yes — the question failed. Discard it 
and generate a new one that references 
something specific to this candidate's 
listed skills, projects, or the combination 
of both.

The question must feel to the candidate like 
the interviewer actually read their profile — 
because you did.

STEP 5 — EDGE CASE HANDLING:

If TARGET_ROLE is vague or missing: generate 
a question calibrated to the most senior role 
the candidate's projects suggest they could 
plausibly be interviewing for.

If CURRENT_PHASE is missing or unrecognized: 
default to TECHNICAL.

If Skills is empty or generic: rely entirely 
on Projects to determine the question domain.

If Projects is empty or generic: rely on Skills 
to determine domain, but note internally that 
the candidate has not demonstrated these skills 
in practice — ask a question that would quickly 
reveal whether the skill is genuine.

If both Skills and Projects are empty: generate 
a foundational question appropriate for the 
target role at mid-level. Do not fail silently.

---

OUTPUT RULE — absolute and non-negotiable:

Output only the question. No assessment of the 
candidate. No explanation of why you chose this 
question. No level classification visible. No 
greeting. No preamble. No follow-up instruction.

Maximum three sentences. The question must be 
written as if spoken directly to the candidate 
in a live interview room.

The internal reasoning above is entirely silent. 
Nothing from STEP 1 through STEP 5 appears in 
the output. Only the question exists in the output.
        """
        
        response = llm.invoke(prompt)
        return response.content
            

    if phase in QUESTION_BANK:
        return random.choice(QUESTION_BANK[phase])
    else:
        return "Are you ready for your next question?"
    