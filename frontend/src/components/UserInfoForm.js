import React, { useState } from "react";

function UserInfoForm(props) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  return (
    <div className="bg-gray-800 rounded-xl p-8">
      <h2 className="text-2xl font-bold text-white mb-2">
        Welcome to AI Interview Simulator
      </h2>
      <p className="text-gray-400 mb-6">
        Enter your details to begin your practice interview
      </p>
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-rose-700"
        />
        <input
          type="text"
          placeholder="Role you are applying for"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-rose-700"
        />
        <button
          onClick={() => props.onSubmit(name, role)}
          className="bg-rose-800 hover:bg-rose-900 text-white font-semibold rounded-lg px-4 py-3 transition"
        >
          Start Interview
        </button>
      </div>
    </div>
  );
}

export default UserInfoForm;
