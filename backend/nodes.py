import state
from state import InterviewState
from mcp_server import get_random_question
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from supabase import create_client, Client
from pypdf import PdfReader
import asyncio
import json
import os
import io

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

api_key = os.getenv("DEEPSEEK_API_KEY")
if not api_key:
    raise RuntimeError(
        "DEEPSEEK_API_KEY is not set. "
        "Add it to your .env file before starting the server."
    )

llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=api_key,
    base_url="https://api.deepseek.com",
    timeout=120, 
    max_retries=1,
    streaming=True
)

async def interview_node(state: InterviewState):
    phase = state["current_phase"]
    count = state["topic_follow_up_count"]
    topic = state["current_topic"]
    history = state["questions_asked"]
    profile = state.get("candidate_profile", {})
    last_answer = state.get("user_response", [""])[-1] if state.get("user_response") else "No answer yet"

    if count < 2 and topic != "":
        prompt = f"""
        You are a Senior Lead Interviewer.
        PHASE: {phase}
        TOPIC: {topic}
        TARGET ROLE: {state.get('target_role', '')}
        REMAINING FOLLOW-UPS: {2 - count}
        PREVIOUSLY ASKED QUESTIONS ON THIS TOPIC:
        {history[-2:] if len(history) >= 2 else history}

        CANDIDATE'S LAST ANSWER:
        {last_answer}
        CONSTRAINT: 
        - Read the candidate's last answer carefully before generating the next question.
        - If they said "idk" or gave no answer — do not go deeper. Redirect to a simpler related angle or a different aspect of the same topic.
        - If they gave a strong answer — push harder on the strongest claim they made.
        - If they revealed they work alone or have no teammates — never ask about team dynamics. Ask about self-management, independent decision making, or learning from mistakes instead.
        - Never ask the same angle twice.


        CANDIDATE BACKGROUND:
        {profile}

        PHASE LOGIC (CRITICAL):
        - If Technical: Ask a deep, challenging question about the internals and code of the topic.
        - If System Design: Ask about architecture, scaling, and system integration.
        - If Behavioral: Ask about leadership, conflict, deadlines, or teamwork. ZERO technical or coding questions allowed in this phase.

        STRICT OUTPUT RULES:
        1. Output ONLY the question. No filler.
        2. Max length: 2 to 3 sentences.
        3. Tailor the question to their CANDIDATE BACKGROUND if relevant.
        """
        response = await llm.ainvoke(prompt)
        new_question = response.content
        new_count = count + 1
        new_topic = topic
        new_phase_count = state["phase_topic_count"]
    else:
        profile = state.get("candidate_profile", {})
        new_question = await asyncio.to_thread(
            get_random_question, phase, profile, state.get("target_role", "")
        )
        new_count = 0
        new_topic = new_question
        new_phase_count = state["phase_topic_count"] + 1

    return {
        "current_question": new_question,
        "questions_asked": history + [{"question": new_question, "phase": phase}],
        "topic_follow_up_count": new_count,
        "current_topic": new_topic,
        "phase_topic_count": new_phase_count
    }


def prepare_for_system_design(state: InterviewState):
    return {"current_phase": "system_design", "topic_follow_up_count": 0, "phase_topic_count": 0, "current_topic": ""}

def prepare_for_technical(state: InterviewState):
    return {"current_phase": "technical", "topic_follow_up_count": 0, "phase_topic_count": 0, "current_topic": ""}

def prepare_for_behavioral(state: InterviewState):
    return {"current_phase": "behavioral", "topic_follow_up_count": 0, "phase_topic_count": 0, "current_topic": ""}


def evaluation_node(state: InterviewState):
  
    questions = state.get("questions_asked", [])
    answers = state.get("user_response", [])
   
   
    interview_transcript = f"**Candidate:** {state.get('name', 'Unknown')}\n**Target Role:** {state.get('target_role', 'Unknown')}\n\n"
    for i, (q, a) in enumerate(zip(questions, answers)):
        interview_transcript += f"### Round {i+1} — {q['phase'].upper()}\n**Question:** {q['question']}\n**Candidate Answer:** {a}\n\n"

    evaluation_prompt = f"""
    You are a senior software engineering interviewer with 15 years 
of experience conducting and evaluating technical interviews. 
You have assessed thousands of candidates across system design, 
technical depth, and behavioral dimensions. You know exactly 
what separates genuine engineering capability from polished 
interview performance — and you know that these two things 
are frequently confused, in both directions, by less 
experienced evaluators.

You respect candidates enough to tell them the truth. 
Corporate softening is disrespect. Honest assessment 
delivered with precision is the highest form of respect 
you can show someone whose career depends on accurate 
feedback. An inflated evaluation that gets a candidate 
hired into a role they cannot perform harms them more 
than a hard truth delivered now.

---

BEFORE WRITING A SINGLE WORD:

Read the complete transcript from start to finish. 
Do not form impressions as you read. Read once to 
understand the full arc. Then identify:

THE STRONGEST MOMENT IN THE TRANSCRIPT:
The single exchange that shows the candidate at 
their best — not their most polished, their most 
genuinely capable.

THE WEAKEST MOMENT IN THE TRANSCRIPT:
The single exchange that reveals the most 
significant gap — not the most awkward, 
the most diagnostically important.

Hold both of these. Neither contaminates your 
evaluation of the other dimensions. Each section 
below is evaluated on its own evidence only — 
not through the lens of the strongest or weakest 
moment. This is how experienced interviewers 
prevent halo and horn effects.

---

TRANSCRIPT QUALITY CHECK:

Before evaluating, assess the transcript itself:

If a labeled phase is missing entirely — flag it: 
"[PHASE NAME] phase not present in transcript. 
This section cannot be evaluated." Do not 
fabricate an evaluation for a missing phase.

If the transcript is too short to provide 
meaningful signal on any dimension — state this 
precisely before proceeding: "Transcript length 
is insufficient to evaluate [specific dimension] 
with confidence. The following reflects limited 
signal."

If exchanges are ambiguous — do not resolve the 
ambiguity in the candidate's favor or against 
them. Note the ambiguity and evaluate what can 
be evaluated with confidence.

---

OUTPUT — EXACTLY 5 SECTIONS. NOTHING ELSE.
No preamble. No summary after Section 5. 
Start directly with Section 1.

---

## 1. SIGNAL PER PHASE

Rate each labeled phase: STRONG / MODERATE / WEAK

One sentence per phase. The sentence must cite 
the specific exchange or response that determined 
the rating — not a general impression of the phase. 
If no specific exchange can be cited, the rating 
cannot be STRONG.

Do not average phases together. A STRONG system 
design phase and a WEAK technical phase are two 
separate findings, not one MODERATE candidate.

---

## 2. MOMENT CITATIONS

Maximum 3 citations. Minimum 1.

Select only moments with the highest diagnostic 
value — the moments that reveal something 
significant about how this candidate actually 
thinks, not moments that are merely impressive 
or merely poor on the surface.

If fewer than 3 genuinely diagnostic moments 
exist in the transcript — cite fewer. Do not 
pad to reach 3.

Format each citation exactly as:

PHASE: [which labeled phase this occurred in]
MOMENT: [what the candidate said or did — 
quote directly where possible, paraphrase 
where the transcript requires it]
SIGNAL: [POSITIVE / NEGATIVE / AMBIGUOUS]
REVEALED: [what this moment shows about how 
they think — not what they know, how they think. 
One to three sentences. Be specific.]

---

## 3. PRESSURE RESPONSE

Classify using exactly one of these four terms:

IMPROVES — candidate's quality of thinking 
visibly increases when challenged. They produce 
better analysis, catch their own errors, or 
reframe the problem more accurately under 
follow-up pressure than in their initial response.

HOLDS — candidate maintains the same quality 
under follow-up pressure that they demonstrated 
initially. Neither better nor worse. Consistent.

DEFLECTS — candidate changes the subject, 
becomes vague, or pivots to adjacent topics 
when challenged rather than engaging with the 
specific challenge directly.

COLLAPSES — candidate's quality of thinking 
visibly degrades under follow-up pressure. 
Initial answers were stronger than challenged 
answers. They abandon correct positions, 
accept incorrect interviewer suggestions, 
or lose coherence.

After the classification, cite the specific 
follow-up exchange that proves it. One sentence. 
The exchange, not the impression.

---

## 4. ONE THING TO FIX

One thing. Not a list. Not "primarily X but also Y."
One thing.

This is the single change that produces the 
largest improvement in this candidate's 
interview performance — given their specific 
pattern of strengths and gaps as revealed 
in this transcript.

State what FIXED looks like concretely: 
not "improve system design communication" 
but what the candidate would specifically 
say or do differently in their next interview 
if they fixed this. Make it executable, 
not aspirational.

---

## 5. VERDICT

First word of this section: HIRE or NO HIRE. 
Nothing before it. Nothing between the section 
header and this word.

Then:

REASON: The exact reason for this verdict — 
grounded in the evidence from sections 1-4, 
not a general impression. One to three sentences.

WHAT CHANGES IT: If HIRE — what would make 
you more confident, or what would make you 
reverse this. If NO HIRE — the single most 
important thing the candidate would need to 
demonstrate differently for this verdict to 
change. This must be specific and achievable, 
not "be a better engineer."

CONFIDENCE: State your confidence in this 
verdict as HIGH, MODERATE, or LOW — and 
give one sentence explaining why. A verdict 
with LOW confidence because the transcript 
was too short or a key phase was missing 
is still a verdict — but the confidence 
level is information the hiring team needs.

---

SELF-EVALUATION before delivering output:

1. Did every phase rating in Section 1 cite 
   a specific exchange — not a general impression? 
   If any rating lacks a specific citation — 
   revise it or downgrade to MODERATE with 
   a note on insufficient evidence.

2. Did Section 2 cite only genuinely diagnostic 
   moments — or did any citation slip in because 
   it was memorable rather than revealing? 
   Remove any citation that shows what the 
   candidate knows rather than how they think.

3. Does the pressure response classification 
   match the transcript evidence precisely? 
   DEFLECTS and COLLAPSES are frequently 
   confused — DEFLECTS is strategic avoidance, 
   COLLAPSES is degradation under pressure. 
   Verify which actually occurred.

4. Is Section 4 genuinely one thing — or did 
   two things get merged into one sentence? 
   If merged — choose the one with higher 
   impact and cut the other.

5. Does the WHAT CHANGES IT field in Section 5 
   contain something specific and executable — 
   or a principle restated as an action? 
   If a principle — convert it to a concrete 
   behavior the candidate could demonstrate 
   in their next interview.

---

CANDIDATE: {state.get('name', 'Unknown')}
TARGET ROLE: {state.get('target_role', 'Unknown')}

TRANSCRIPT:
{interview_transcript}
"""
   

    
    try:
        response = llm.invoke(evaluation_prompt)
        report = response.content 
    except Exception as e:
        print(f"LLM Timeout Error: {e}")
        report = "### System Notice\n\nThe AI evaluation engine timed out due to heavy global server load on DeepSeek. Your interview was completed successfully and saved, but the scorecard generation failed. Please try again later."

    try:
        supabase.table("interviews").insert({
            "user_id": state.get("user_id"),
            "name": state.get("name", "Unknown"),
            "feedback_report": report,
            "target_role": state.get("target_role", "Software Engineer")
        }).execute()
    except Exception as e:
        print(f"Database error: {e}")

    return {
        "current_phase": "complete",
        "is_complete": True,
        "current_question": "", 
        "scores": {"feedback": report}
    }



def extract_text_from_pdf(file_bytes):
    reader = PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text



def profiler_node(state: InterviewState):
    resume = state.get("resume_text", "")
    
    prompt = f"""
    You are an Expert Resume Profiler. 
    Analyze the following resume text and extract ONLY the technical skills and major projects.
    
    RESUME TEXT:
    {resume}
    
    OUTPUT FORMAT:
    You MUST return a valid JSON object with this exact structure:
    {{
        "skills": ["skill1", "skill2"],
        "projects": [
            {{"name": "Project Name", "tech_stack": ["tech1"], "summary": "Brief description"}}
        ]
    }}
    Do not include any other text. Only the JSON.
    """
    
    response = llm.invoke(prompt)
    
    try:
        clean_profile = json.loads(response.content)
    except:
        clean_profile = {"skills": [], "projects": []}

    return {"candidate_profile": clean_profile}