import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

const NeuCard = ({ children, className = "" }) => (
  <div
    className={`bg-gray-800 rounded-2xl shadow-lg border border-gray-700 ${className}`}
  >
    {children}
  </div>
);

const PhaseBadge = ({ phase }) => (
  <span className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
    {phase}
  </span>
);

const Button = ({ onClick, children, className = "" }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none bg-red-600 hover:bg-red-700 text-white shadow-lg ${className}`}
  >
    {children}
  </button>
);

const WelcomeScreen = ({ onStart }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center p-4">
      <NeuCard className="w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Interview Simulator
          </h1>
          <p className="text-gray-400">Prepare for your technical interview</p>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-gray-300 font-semibold text-sm">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-gray-300 font-semibold text-sm">
              Target Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
            />
          </div>
          <Button
            onClick={() => {
              if (name.trim() && role.trim()) onStart({ name, role });
            }}
            className="w-full py-3 text-lg"
          >
            Start Interview
          </Button>
        </div>
      </NeuCard>
    </div>
  );
};

const InterviewScreen = ({ currentQuestion, currentPhase, onSubmitAnswer }) => {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmitAnswer(answer);
      setAnswer("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 flex items-center justify-center">
      <NeuCard className="w-full max-w-2xl p-8">
        <div className="mb-8">
          <PhaseBadge phase={currentPhase} />
        </div>
        <div className="mb-8">
          <NeuCard className="p-6 bg-gray-900 border-gray-600">
            <p className="text-gray-300 text-sm font-semibold mb-3">Question</p>
            <p className="text-white text-lg leading-relaxed">
              {currentQuestion}
            </p>
          </NeuCard>
        </div>
        <div className="mb-6">
          <label className="text-gray-300 font-semibold text-sm block mb-2">
            Your Answer
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-red-600 focus:outline-none resize-none"
          />
          <p className="text-gray-500 text-xs mt-2">
            {answer.length} characters
          </p>
        </div>
        <Button onClick={handleSubmit} className="w-full py-3 text-lg">
          Submit Answer
        </Button>
      </NeuCard>
    </div>
  );
};

const ScorecardScreen = ({ candidate, feedback, onRestart }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 flex items-center justify-center">
    <NeuCard className="w-full max-w-md p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Interview Complete
        </h2>
        <p className="text-gray-400">Here's your performance summary</p>
      </div>
      <NeuCard className="p-6 bg-gray-900 border-gray-600 mb-6">
        <p className="text-gray-300 text-sm font-semibold mb-2">
          Candidate Info
        </p>
        <p className="text-white mb-1">
          <span className="text-gray-400">Name:</span> {candidate.name}
        </p>
        <p className="text-white">
          <span className="text-gray-400">Role:</span> {candidate.role}
        </p>
      </NeuCard>
      <div className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-700">
        <p className="text-gray-400 text-sm font-semibold mb-3">AI Feedback</p>
        <div className="text-gray-200 text-sm leading-relaxed prose prose-invert">
          <ReactMarkdown>{feedback}</ReactMarkdown>
        </div>
      </div>
      <Button onClick={onRestart} className="w-full py-3 text-lg">
        Restart Interview
      </Button>
    </NeuCard>
  </div>
);

export default function InterviewSimulator() {
  const [screen, setScreen] = useState("welcome");
  const [candidate, setCandidate] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");
  const [allAnswers, setAllAnswers] = useState([]);
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState("");

  const handleStartInterview = async (candidateData) => {
    setCandidate(candidateData);
    const response = await fetch("http://localhost:8000/start");
    const data = await response.json();
    setCurrentQuestion(data.current_question);
    setCurrentPhase(data.current_phase);
    setThreadId(data.thread_id);
    setAllAnswers([]);
    setAskedQuestions([data.current_question]);
    setScreen("interview");
  };

  const handleSubmitAnswer = async (answer) => {
    const updatedAnswers = [...allAnswers, answer];
    const updatedQuestions = [...askedQuestions];
    setAllAnswers(updatedAnswers);

    const response = await fetch("http://localhost:8000/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer,
        current_phase: currentPhase,
        all_answers: updatedAnswers,
        asked_questions: updatedQuestions,
        hread_id: threadId,
      }),
    });
    const data = await response.json();

    if (data.current_phase === "evaluation") {
      setLoading(true);
      const evalResponse = await fetch("http://localhost:8000/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: "",
          current_phase: "evaluation",
          all_answers: updatedAnswers,
          asked_questions: updatedQuestions,
          thread_id: threadId,
        }),
      });
      setLoading(true);
      const evalData = await evalResponse.json();
      if (evalData.scores && evalData.scores.feedback) {
        setFeedback(evalData.scores.feedback);
      }
      setScreen("scorecard");
      setLoading(false);
    } else {
      setCurrentQuestion(data.current_question);
      setCurrentPhase(data.current_phase);
      setAskedQuestions([...updatedQuestions, data.current_question]);
    }
  };

  const handleRestart = () => {
    setScreen("welcome");
    setCandidate(null);
    setCurrentQuestion("");
    setCurrentPhase("");
    setAllAnswers([]);
    setAskedQuestions([]);
    setFeedback("");
  };

  return (
    <div className="bg-gray-900">
      {loading && (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white text-2xl font-bold mb-2">
              Evaluating your answers...
            </p>
            <p className="text-gray-400">
              DeepSeek is analyzing your responses
            </p>
          </div>
        </div>
      )}
      {!loading && screen === "welcome" && (
        <WelcomeScreen onStart={handleStartInterview} />
      )}
      {!loading && screen === "interview" && (
        <InterviewScreen
          currentQuestion={currentQuestion}
          currentPhase={currentPhase}
          onSubmitAnswer={handleSubmitAnswer}
        />
      )}
      {!loading && screen === "scorecard" && (
        <ScorecardScreen
          candidate={candidate}
          feedback={feedback}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
