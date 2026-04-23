import React, { useEffect, useState } from "react";

function InterviewRoom(props) {
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");
  const [answer, setAnswer] = useState("");
  const [allAnswers, setAllAnswers] = useState([]);
  const [scores, setScores] = useState({});
  const [askedQuestions, setAskedQuestions] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/start")
      .then((res) => res.json())
      .then((data) => {
        setCurrentQuestion(data.current_question);
        setCurrentPhase(data.current_phase);
      });
  }, []);

  useEffect(() => {
    if (currentPhase === "evaluation") {
      fetch("http://localhost:8000/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: "",
          current_phase: "evaluation",
          all_answers: allAnswers,
          asked_questions: askedQuestions,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.scores) {
            setScores(data.scores);
          }
          setCurrentPhase(data.current_phase);
        });
    }
  }, [currentPhase]);

  useEffect(() => {
    if (currentQuestion !== "") {
      setAskedQuestions((prev) => [...prev, currentQuestion]);
    }
  }, [currentQuestion]);

  if (currentPhase === "complete") {
    props.onComplete(scores);
    return null;
  }

  return (
    <div>
      <h2>Current Phase: {currentPhase}</h2>
      <h3>Question: {currentQuestion}</h3>
      <input
        type="text"
        placeholder="Your answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <button
        onClick={() => {
          const updatedAnswers = [...allAnswers, answer];
          setAllAnswers(updatedAnswers);

          fetch("http://localhost:8000/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answer,
              current_phase: currentPhase,
              all_answers: updatedAnswers,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              setCurrentQuestion(data.current_question);
              setCurrentPhase(data.current_phase);
              setAnswer("");
              if (data.scores) {
                setScores(data.scores);
              }
            });
        }}
      >
        Submit Answer
      </button>
    </div>
  );
}

export default InterviewRoom;
