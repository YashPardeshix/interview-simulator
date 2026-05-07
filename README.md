# Xiphos

An AI-powered interview simulator that actually reads your resume before asking questions.

Most mock interview tools ask the same generic questions to everyone. Xiphos pulls your resume,
figures out what you've actually built, and runs you through three phases — system design,
technical, and behavioral — with follow-up questions based on your specific answers.
When you're done it gives you a brutally honest scorecard.

## What it does

- Parses your resume and builds a candidate profile before the interview starts
- Runs a structured interview across three phases with adaptive follow-up questions
- Streams responses word by word so it doesn't feel like you're staring at a loading spinner
- Saves every session so you can review past scorecards
- Gives a detailed post-interview evaluation with a hire/no-hire verdict

## Stack

**Frontend** — React, Tailwind, Framer Motion, deployed on Vercel  
**Backend** — FastAPI, LangGraph, deployed on Render  
**AI** — DeepSeek via LangChain  
**Auth + DB** — Supabase

## Running it locally

You'll need API keys for DeepSeek and a Supabase project before anything works.

**Backend**

```bash
cd backend
pip install -r requirements.txt

# create a .env file with:
# DEEPSEEK_API_KEY=your_key
# SUPABASE_URL=your_url
# SUPABASE_KEY=your_anon_key

uvicorn main:app --reload
```

**Frontend**

```bash
cd frontend
npm install

# create a .env file with:
# REACT_APP_SUPABASE_URL=your_url
# REACT_APP_SUPABASE_ANON_KEY=your_anon_key
# REACT_APP_API_URL=http://localhost:8000

npm start
```

## How the interview works

The graph runs system design first, then technical, then behavioral. Each topic gets
up to two follow-up questions before moving on. The follow-ups are generated based on
what you actually said — if you gave a weak answer it redirects, if you gave a strong
one it pushes harder.

After all three phases the evaluation node runs and writes a scorecard to Supabase.

## Notes

The backend is on Render's free tier so the first request after inactivity will be slow.
That's not a bug, just Render spinning the server back up. Give it 30-60 seconds.
