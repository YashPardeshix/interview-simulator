import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Briefcase,
  ChevronRight,
  RefreshCcw,
  Loader2,
  FileText,
} from "lucide-react";
import { supabase } from "../supabaseClient";

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
const SignalBadge = ({ text }) => {
  const upper = text?.toUpperCase() || "";
  const color = upper.includes("STRONG")
    ? { bg: "#052e16", border: "#166534", text: "#4ade80" }
    : upper.includes("WEAK")
      ? { bg: "#450a0a", border: "#991b1b", text: "#f87171" }
      : { bg: "#451a03", border: "#92400e", text: "#fbbf24" };
  return (
    <span
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.text,
        padding: "2px 10px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: "700",
        letterSpacing: "0.15em",
        fontFamily: "monospace",
        textTransform: "uppercase",
      }}
    >
      {text}
    </span>
  );
};

const renderWithBadges = (text) => {
  return text.split(/(STRONG|MODERATE|WEAK)/).map((part, index) => {
    if (part === "STRONG" || part === "MODERATE" || part === "WEAK") {
      return <SignalBadge key={index} text={part} />;
    }
    return part;
  });
};

const VerdictStamp = ({ isHire }) => (
  <div
    style={{
      display: "inline-block",
      border: `3px solid ${isHire ? "#16a34a" : "#dc2626"}`,
      color: isHire ? "#16a34a" : "#dc2626",
      padding: "6px 20px",
      borderRadius: "4px",
      fontSize: "28px",
      fontWeight: "900",
      letterSpacing: "0.25em",
      fontFamily: "monospace",
      transform: "rotate(-2deg)",
      boxShadow: `0 0 0 1px ${isHire ? "#16a34a" : "#dc2626"}`,
      opacity: 0.9,
    }}
  >
    {isHire ? "HIRE" : "NO HIRE"}
  </div>
);

const ScorecardScreen = ({ candidate, feedback, onBack, previousScreen }) => {
  const isHire = feedback?.includes("NO HIRE")
    ? false
    : feedback?.includes("HIRE");

  return (
    <motion.div
      key="scorecard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        width: "100%",
        maxWidth: "800px",
        background: "#0a0a0a",
        border: "1px solid #1f1f1f",
        borderRadius: "8px",
        padding: "0",
        overflow: "hidden",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          borderBottom: "1px solid #1f1f1f",
          padding: "32px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-block",
              background: "#1a0000",
              border: "1px solid #7f1d1d",
              color: "#ef4444",
              padding: "3px 12px",
              fontSize: "9px",
              fontWeight: "700",
              letterSpacing: "0.3em",
              fontFamily: "monospace",
              marginBottom: "16px",
            }}
          >
            CONFIDENTIAL — POST-INTERVIEW EVALUATION
          </div>
          <h2
            style={{
              fontSize: "36px",
              fontWeight: "800",
              color: "#ffffff",
              margin: "0 0 8px",
              letterSpacing: "-0.02em",
            }}
          >
            Performance Brief
          </h2>
          <div
            style={{ fontSize: "13px", color: "#555", fontFamily: "monospace" }}
          >
            <span style={{ color: "#888" }}>CANDIDATE:</span>{" "}
            <span style={{ color: "#ccc" }}>{candidate.name || "Unknown"}</span>
            <span style={{ margin: "0 12px", color: "#333" }}>|</span>
            <span style={{ color: "#888" }}>ROLE:</span>{" "}
            <span style={{ color: "#ccc" }}>{candidate.role || "Unknown"}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "12px",
          }}
        >
          <VerdictStamp isHire={isHire} />
          <button
            onClick={() => window.print()}
            style={{
              background: "transparent",
              border: "1px solid #222",
              color: "#555",
              padding: "8px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "monospace",
            }}
          >
            PRINT
          </button>
        </div>
      </div>

      <div style={{ padding: "40px 48px" }}>
        <div
          className="prose prose-invert max-w-none"
          style={{ fontFamily: "monospace" }}
        >
          <style>{`
            .scorecard-body h2 {
              font-size: 10px !important;
              font-weight: 700 !important;
              letter-spacing: 0.3em !important;
              color: #444 !important;
              text-transform: uppercase !important;
              margin: 32px 0 12px !important;
              padding-bottom: 8px !important;
              border-bottom: 1px solid #1a1a1a !important;
            }
            .scorecard-body p {
              font-size: 14px !important;
              line-height: 1.8 !important;
              color: #aaa !important;
              font-family: monospace !important;
            }
            .scorecard-body strong {
              color: #e5e5e5 !important;
              font-weight: 600 !important;
            }
            .scorecard-body ul {
              padding-left: 16px !important;
            }
            .scorecard-body li {
              font-size: 14px !important;
              color: #aaa !important;
              line-height: 1.8 !important;
              font-family: monospace !important;
            }
          `}</style>
          <div className="scorecard-body">
            <ReactMarkdown
              components={{
                p: ({ children }) => {
                  const processChildren = (kids) => {
                    return React.Children.map(kids, (child) => {
                      if (typeof child === "string") {
                        return renderWithBadges(child);
                      }
                      return child;
                    });
                  };
                  return (
                    <p
                      style={{
                        fontSize: "14px",
                        lineHeight: "1.8",
                        color: "#aaa",
                        fontFamily: "monospace",
                      }}
                    >
                      {processChildren(children)}
                    </p>
                  );
                },
                code: ({ children }) => (
                  <code
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      color: "#e2e8f0",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  >
                    {children}
                  </code>
                ),
                strong: ({ children }) => {
                  const text = Array.isArray(children)
                    ? children.join("")
                    : typeof children === "string"
                      ? children
                      : "";

                  if (
                    text.includes("STRONG") ||
                    text.includes("WEAK") ||
                    text.includes("MODERATE")
                  ) {
                    const parts = text.split(/(STRONG|MODERATE|WEAK)/);
                    return (
                      <strong style={{ color: "#e5e5e5", fontWeight: "600" }}>
                        {parts.map((part, i) =>
                          part === "STRONG" ||
                          part === "WEAK" ||
                          part === "MODERATE" ? (
                            <SignalBadge key={i} text={part} />
                          ) : (
                            part
                          ),
                        )}
                      </strong>
                    );
                  }
                  return (
                    <strong style={{ color: "#e5e5e5", fontWeight: "600" }}>
                      {children}
                    </strong>
                  );
                },
              }}
            >
              {feedback}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #1a1a1a",
          padding: "24px 48px",
          display: "flex",
          gap: "12px",
        }}
      >
        {previousScreen === "history" && (
          <button
            onClick={onBack}
            style={{
              background: "transparent",
              border: "1px solid #222",
              color: "#555",
              padding: "16px",
              borderRadius: "8px",
              fontSize: "11px",
              fontFamily: "monospace",
              cursor: "pointer",
              letterSpacing: "0.15em",
            }}
          >
            ← BACK
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          style={{
            flex: 1,
            background: "#ffffff",
            color: "#000000",
            border: "none",
            padding: "16px",
            borderRadius: "8px",
            fontWeight: "900",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Start New Evaluation
        </button>
      </div>
    </motion.div>
  );
};

export default function InterviewSimulator({ session }) {
  const [screen, setScreen] = useState("welcome");
  const [candidate, setCandidate] = useState({
    name: "",
    role: "",
  });
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [previousScreen, setPreviousScreen] = useState("welcome");
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionRef, setRecognitionRef] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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

  const handleDeleteInterview = async (id) => {
    try {
      const { error } = await supabase.from("interviews").delete().eq("id", id);

      if (error) {
        alert("Could not delete: " + error.message);
        return;
      }

      setHistory(history.filter((item) => item.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      alert("Could not delete record.");
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
      formData.append("name", candidate.name);
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
    setIsStreaming(true);
    setLoading(true);
    setCurrentQuestion("");

    try {
      const response = await fetch("http://localhost:8000/answer/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, thread_id: threadId }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) {
          finished = true;
          setIsStreaming(false);
          setLoading(false);
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        setLoading(false);
        setCurrentQuestion((prev) => prev + chunk);
      }

      const statusRes = await axios.get(
        `http://localhost:8000/state/${threadId}`,
      );
      const status = statusRes.data;

      if (status.is_complete) {
        setFeedback(status.scores?.feedback || "Evaluation data missing.");
        setPreviousScreen("interview");
        setScreen("scorecard");
      } else {
        setCurrentPhase(status.current_phase);
        const textArea = document.getElementById("answer-input");
        if (textArea) textArea.value = "";
      }
    } catch (err) {
      console.error("Streaming error:", err);
      alert("The connection was interrupted. Please try again.");
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (isRecording) {
      recognitionRef.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const textarea = document.getElementById("answer-input");
      if (!textarea) return;

      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        textarea.value += finalTranscript + " ";
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        alert(
          "Microphone access denied. Please allow microphone access to use voice input.",
        );
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };

    recognition.start();
    setRecognitionRef(recognition);
    setIsRecording(true);
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
                  Xiphos is analyzing the depth of your response...
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
                  Xiphos
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
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="w-full bg-transparent text-zinc-600 py-3 rounded-3xl font-bold uppercase tracking-widest text-[10px] border border-white/5 hover:text-zinc-400 transition-all"
                  >
                    Sign Out
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
                          if (confirmDeleteId === item.id) {
                            handleDeleteInterview(item.id);
                          } else {
                            setConfirmDeleteId(item.id);
                          }
                        }}
                        className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 mb-2 ${
                          confirmDeleteId === item.id
                            ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                            : "bg-white/5 border-white/5 text-zinc-600 hover:text-zinc-400 hover:bg-white/10"
                        }`}
                      >
                        {confirmDeleteId === item.id
                          ? "Confirm Delete"
                          : "Delete"}
                      </button>
                      <button
                        onClick={() => {
                          setFeedback(item.feedback_report);
                          setCandidate({
                            name: item.name || "—",
                            role: item.target_role,
                          });
                          setPreviousScreen("history");
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
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <span>{children}</span>,
                    code: ({ children }) => (
                      <code
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid #2a2a2a",
                          color: "#93c5fd",
                          padding: "1px 8px",
                          borderRadius: "4px",
                          fontSize: "28px",
                          fontFamily: "monospace",
                          fontStyle: "normal",
                        }}
                      >
                        {children}
                      </code>
                    ),
                  }}
                >
                  {currentQuestion}
                </ReactMarkdown>
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
                      if (!isStreaming) {
                        handleSubmitAnswer(e.target.value);
                      }
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
                  <div className="flex items-center gap-3">
                    {(window.SpeechRecognition ||
                      window.webkitSpeechRecognition) && (
                      <button
                        onClick={handleVoiceInput}
                        disabled={isStreaming}
                        className={`relative p-4 rounded-2xl transition-all border ${
                          isRecording
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {isRecording ? (
                          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                            Stop
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                            🎙 Speak
                          </span>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() =>
                        !isStreaming &&
                        handleSubmitAnswer(
                          document.getElementById("answer-input").value,
                        )
                      }
                      disabled={isStreaming}
                      className={`px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl active:scale-95 ${
                        isStreaming
                          ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                      }`}
                    >
                      {isStreaming ? "Receiving..." : "Submit Response"}
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : screen === "scorecard" ? (
            <ScorecardScreen
              candidate={candidate}
              feedback={feedback}
              onBack={() => setScreen(previousScreen)}
              previousScreen={previousScreen}
            />
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
