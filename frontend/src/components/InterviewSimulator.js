import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Briefcase,
  ChevronRight,
  CheckCircle,
  RefreshCcw,
  Loader2,
  Printer,
} from "lucide-react";

const GlassCard = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
);

const StyledInput = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-zinc-400 text-xs font-medium uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
      <input
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
      />
    </div>
  </div>
);

export default function InterviewSimulator({ session }) {
  const [screen, setScreen] = useState("welcome");
  const [candidate, setCandidate] = useState({ name: "", role: "" });
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);

  const handleViewHistory = async () => {
    setLoading(true);
    console.log("DEBUG: Current session user ID:", session.user.id);
    try {
      const response = await axios.get(
        `http://localhost:8000/history/${session.user.id}`,
      );
      console.log("DEBUG: Data received from server:", response.data);
      setHistory(response.data);
      setScreen("history");
    } catch (err) {
      alert("Could not load history.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!candidate.name || !candidate.role) return;
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/start", {
        params: {
          user_id: session.user.id,
          role: candidate.role,
        },
      });

      setThreadId(response.data.thread_id);
      setCurrentQuestion(response.data.current_question);
      setCurrentPhase(response.data.current_phase);
      setScreen("interview");
    } catch (err) {
      alert("System could not start. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer) => {
    setLoading(true);
    setCurrentQuestion("");

    try {
      const response = await axios.post("http://localhost:8000/answer", {
        answer: answer,
        thread_id: threadId,
      });

      const data = response.data;

      if (data.is_complete || data.current_phase === "complete") {
        setFeedback(data.scores?.feedback || "Evaluation complete.");
        setScreen("scorecard");
      } else {
        setCurrentQuestion(data.current_question);
        setCurrentPhase(data.current_phase);
        const textArea = document.getElementById("answer-input");
        if (textArea) textArea.value = "";
      }
    } catch (err) {
      alert("Error connection lost.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto min-h-screen flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {screen === "welcome" && (
            <GlassCard key="welcome" className="w-full max-w-lg p-10 space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                  Lumina
                </h1>
                <p className="text-zinc-400 font-light">
                  Your professional AI interview partner.
                </p>
              </div>

              <div className="space-y-6">
                <StyledInput
                  label="Full Name"
                  icon={User}
                  placeholder="Steve Rogers"
                  value={candidate.name}
                  onChange={(e) =>
                    setCandidate({ ...candidate, name: e.target.value })
                  }
                />
                <StyledInput
                  label="Target Role"
                  icon={Briefcase}
                  placeholder="Senior Software Engineer"
                  value={candidate.role}
                  onChange={(e) =>
                    setCandidate({ ...candidate, role: e.target.value })
                  }
                />
                <button
                  onClick={handleStartInterview}
                  className="w-full bg-white text-black py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors group"
                >
                  Begin Experience
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={handleViewHistory}
                  className="w-full bg-white/5 text-white py-4 rounded-2xl font-semibold border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <RefreshCcw className="w-4 h-4 text-zinc-400" />
                  View Past Interviews
                </button>
              </div>
            </GlassCard>
          )}

          {screen === "history" && (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-4xl space-y-8"
            >
              <div className="flex items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Vault</h2>
                  <p className="text-zinc-500 text-sm">
                    Your past performance records
                  </p>
                </div>
                <button
                  onClick={() => setScreen("welcome")}
                  className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 border border-white/10"
                >
                  <RefreshCcw className="w-4 h-4 rotate-180" />
                  Return to Lobby
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.length > 0 ? (
                  history.map((item) => (
                    <GlassCard
                      key={item.id}
                      className="p-8 group hover:border-blue-500/50 transition-all cursor-default"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                          <Briefcase className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono tracking-widest bg-white/5 px-2 py-1 rounded-md">
                          {new Date(item.created_at).toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </span>
                      </div>

                      <div className="space-y-1 mb-8">
                        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em]">
                          Target Role
                        </p>
                        <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors capitalize">
                          {item.target_role}
                        </h3>
                      </div>

                      <button
                        onClick={() => {
                          setFeedback(item.feedback_report);
                          setScreen("scorecard");
                        }}
                        className="w-full py-4 bg-white/5 group-hover:bg-blue-600 group-hover:text-white rounded-2xl text-sm font-semibold transition-all border border-white/10 flex items-center justify-center gap-2"
                      >
                        Open Full Report
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </GlassCard>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Loader2 className="w-8 h-8 text-zinc-700 mx-auto" />
                    <p className="text-zinc-500 font-light italic">
                      The vault is currently empty. Complete an interview to see
                      it here.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {screen === "interview" && !loading && (
            <GlassCard key="interview" className="w-full p-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Phase: {currentPhase.replace("_", " ")}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-blue-500" : "bg-white/10"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-medium leading-tight text-zinc-100">
                  {currentQuestion}
                </h2>
              </div>

              <div className="space-y-4">
                <textarea
                  autoFocus
                  placeholder="Type your response..."
                  className="w-full bg-transparent border-b border-white/10 py-4 text-xl text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-all resize-none min-h-[150px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey)
                      handleSubmitAnswer(e.target.value);
                  }}
                  id="answer-input"
                />
                <div className="flex items-center justify-between">
                  <p className="text-zinc-500 text-xs">
                    Press{" "}
                    <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                      CMD + ENTER
                    </kbd>{" "}
                    to submit
                  </p>
                  <button
                    onClick={() =>
                      handleSubmitAnswer(
                        document.getElementById("answer-input").value,
                      )
                    }
                    className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </GlassCard>
          )}

          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-zinc-400 font-light tracking-widest animate-pulse">
                ANALYZING DEPTH
              </p>
            </motion.div>
          )}

          {screen === "scorecard" && (
            <GlassCard
              key="scorecard"
              className="w-full max-w-3xl p-12 space-y-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-blue-500 mb-2">
                    <CheckCircle className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase tracking-[0.3em]">
                      Certification Issued
                    </span>
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">
                    Performance Report
                  </h2>
                  <p className="text-zinc-400 font-light text-lg">
                    Candidate:{" "}
                    <span className="text-white font-medium">
                      {candidate.name}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">
                    Target Role
                  </p>
                  <p className="text-xl font-medium text-zinc-200">
                    {candidate.role}
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-500/50 to-transparent rounded-full opacity-20" />
                <div
                  className="pl-8 prose prose-zinc prose-invert max-w-none 
                    prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
                    prose-h3:text-blue-400 prose-h3:text-sm prose-h3:uppercase prose-h3:tracking-[0.2em]
                    prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-lg
                    prose-li:text-zinc-300 prose-strong:text-white prose-strong:font-semibold"
                >
                  <ReactMarkdown>{feedback}</ReactMarkdown>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98]"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Start New Evaluation
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-zinc-400" />
                  Download PDF
                </button>
              </div>
            </GlassCard>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
