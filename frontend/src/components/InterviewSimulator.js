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
  FileText,
  AlertCircle,
  Trophy,
} from "lucide-react";

const GlassCard = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className={`bg-[#111113]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
);

const StyledInput = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">
      {label}
    </label>
    <div className="relative group">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
      <input
        {...props}
        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
      />
    </div>
  </div>
);

const ScorecardScreen = ({ candidate, feedback }) => (
  <GlassCard
    key="scorecard"
    className="w-full max-w-4xl p-16 space-y-12 max-h-[90vh] overflow-y-auto custom-scrollbar border-t-blue-500/30 border-t-2"
  >
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-10 border-b border-white/5">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <Trophy className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
            Official Evaluation
          </span>
        </div>
        <h2 className="text-5xl font-bold tracking-tighter text-white">
          Performance Brief
        </h2>
        <div className="flex items-center gap-4 text-zinc-500 font-light italic">
          <span>
            Candidate:{" "}
            <span className="text-white font-normal not-italic">
              {candidate.name}
            </span>
          </span>
          <span className="w-1 h-1 bg-zinc-800 rounded-full" />
          <span>
            Role:{" "}
            <span className="text-white font-normal not-italic">
              {candidate.role}
            </span>
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => window.print()}
          className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group border border-white/5"
        >
          <Printer className="w-5 h-5 text-zinc-400 group-hover:text-white" />
        </button>
      </div>
    </div>

    <div className="relative">
      <div className="absolute -left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-white/5 to-transparent" />
      <div
        className="prose prose-zinc prose-invert max-w-none 
          prose-headings:font-bold prose-headings:tracking-tighter prose-headings:text-white
          prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-12
          prose-h3:text-[11px] prose-h3:uppercase prose-h3:tracking-[0.3em] prose-h3:text-blue-400 prose-h3:font-black prose-h3:bg-blue-500/5 prose-h3:w-fit prose-h3:px-3 prose-h3:py-1 prose-h3:rounded-md
          prose-p:text-zinc-400 prose-p:leading-[1.8] prose-p:text-lg prose-p:font-light
          prose-strong:text-white prose-strong:font-semibold
          prose-li:text-zinc-400 prose-li:marker:text-blue-500"
      >
        <ReactMarkdown>{feedback}</ReactMarkdown>
      </div>
    </div>

    {/* Footer */}
    <div className="pt-10 flex gap-4">
      <button
        onClick={() => window.location.reload()}
        className="flex-1 bg-white text-black py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl shadow-white/5"
      >
        Start New Evaluation
      </button>
    </div>
  </GlassCard>
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
  const [resumeFile, setResumeFile] = useState(null);

  const handleViewHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8000/history/${session.user.id}`,
      );
      setHistory(response.data);
      setScreen("history");
    } catch (err) {
      alert("Could not load history.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!candidate.name || !candidate.role || !resumeFile) {
      alert("Please fill all fields and upload your resume.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("user_id", session.user.id);
      formData.append("role", candidate.role);
      formData.append("resume", resumeFile);

      const response = await axios.post(
        "http://localhost:8000/start",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setThreadId(response.data.thread_id);
      setCurrentQuestion(response.data.current_question);
      setCurrentPhase(response.data.current_phase);
      setScreen("interview");
    } catch (err) {
      alert("Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer) => {
    if (!answer.trim()) return;
    setLoading(true);
    setCurrentQuestion("");
    try {
      const response = await axios.post("http://localhost:8000/answer", {
        answer: answer,
        thread_id: threadId,
      });

      const data = response.data;
      if (data.is_complete || data.current_phase === "complete") {
        setFeedback(data.scores?.feedback || "Evaluation data missing.");
        setScreen("scorecard");
      } else {
        setCurrentQuestion(data.current_question);
        setCurrentPhase(data.current_phase);
        const textArea = document.getElementById("answer-input");
        if (textArea) textArea.value = "";
      }
    } catch (err) {
      alert("Session interrupted.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans selection:bg-blue-500/30 antialiased">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[150px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto min-h-screen flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-zinc-500 font-bold tracking-[0.4em] uppercase text-[10px]">
                  Processing Context
                </p>
                <p className="text-zinc-400 text-sm font-light italic">
                  Lumina is analyzing the depth of your response...
                </p>
              </div>
            </motion.div>
          ) : screen === "welcome" ? (
            <GlassCard
              key="welcome"
              className="w-full max-w-lg p-12 space-y-10"
            >
              <div className="text-center space-y-3">
                <h1 className="text-6xl font-bold tracking-tighter bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent">
                  Lumina
                </h1>
                <p className="text-zinc-500 font-light tracking-wide">
                  Elite AI Interview Simulation
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
                <div className="space-y-2">
                  <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">
                    Professional Resume (PDF)
                  </label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-blue-400 transition-colors w-5 h-5" />
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>
                <div className="pt-4 space-y-4">
                  <button
                    onClick={handleStartInterview}
                    className="w-full bg-white text-black py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group"
                  >
                    Begin Experience{" "}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={handleViewHistory}
                    className="w-full bg-white/5 text-white py-5 rounded-3xl font-bold uppercase tracking-widest text-[10px] border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 text-zinc-500" /> Access
                    Records Vault
                  </button>
                </div>
              </div>
            </GlassCard>
          ) : screen === "history" ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-4xl space-y-8"
            >
              <div className="flex items-center justify-between bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                <div>
                  <h2 className="text-3xl font-bold tracking-tighter">
                    Records Vault
                  </h2>
                  <p className="text-zinc-500 text-sm font-light tracking-wide">
                    Historical performance analytics
                  </p>
                </div>
                <button
                  onClick={() => setScreen("welcome")}
                  className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5"
                >
                  <RefreshCcw className="w-3 h-3 rotate-180 text-zinc-500" />{" "}
                  Lobby
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.length > 0 ? (
                  history.map((item) => (
                    <GlassCard
                      key={item.id}
                      className="p-8 group hover:border-blue-500/30 transition-all border border-white/5"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                          <Briefcase className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold tracking-widest bg-white/5 px-3 py-1.5 rounded-full uppercase">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="space-y-1 mb-8">
                        <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-[0.2em]">
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
                        className="w-full py-4 bg-white/5 group-hover:bg-blue-600 group-hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center justify-center gap-2"
                      >
                        Review Brief <ChevronRight className="w-4 h-4" />
                      </button>
                    </GlassCard>
                  ))
                ) : (
                  <div className="col-span-full py-24 text-center space-y-4 bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10">
                    <Loader2 className="w-8 h-8 text-zinc-800 mx-auto" />
                    <p className="text-zinc-600 font-light italic tracking-wide">
                      The vault is currently awaiting historical data.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : screen === "interview" ? (
            <GlassCard
              key="interview"
              className="w-full max-w-3xl p-16 space-y-12 border-t-white/10 border-t-2"
            >
              <div className="flex items-center justify-between">
                <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">
                  Current Segment: {currentPhase.replace("_", " ")}
                </div>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                </div>
              </div>
              <h2 className="text-4xl font-light leading-relaxed text-zinc-100 tracking-tight italic">
                "{currentQuestion}"
              </h2>
              <div className="space-y-6 pt-12 border-t border-white/5 relative">
                <textarea
                  id="answer-input"
                  autoFocus
                  placeholder="Articulate your response here..."
                  className="w-full bg-transparent py-4 text-xl text-white placeholder-zinc-800 focus:outline-none transition-all resize-none min-h-[200px] leading-relaxed font-light"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmitAnswer(e.target.value);
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-600">
                    <kbd className="bg-white/5 px-2 py-1 rounded text-[9px] font-bold border border-white/5">
                      CMD
                    </kbd>
                    <span className="text-[10px] font-bold tracking-widest text-zinc-700">
                      +
                    </span>
                    <kbd className="bg-white/5 px-2 py-1 rounded text-[9px] font-bold border border-white/5">
                      ENTER
                    </kbd>
                    <span className="text-[10px] uppercase tracking-widest ml-2 text-zinc-700">
                      to transmit
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleSubmitAnswer(
                        document.getElementById("answer-input").value,
                      )
                    }
                    className="bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
                  >
                    Submit Response
                  </button>
                </div>
              </div>
            </GlassCard>
          ) : screen === "scorecard" ? (
            <ScorecardScreen candidate={candidate} feedback={feedback} />
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
