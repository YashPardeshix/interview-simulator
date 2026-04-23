import React from "react";

function Scorecard(props) {
  return (
    <div>
      <h2>Your Scorecard</h2>
      <p>Name: {props.userInfo.name}</p>
      <p>Role: {props.userInfo.role}</p>
      {props.scores && props.scores.feedback && <p>{props.scores.feedback}</p>}
      <button onClick={props.onRestart}>Restart Interview</button>
    </div>
  );
}

export default Scorecard;
