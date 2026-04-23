import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">

      <div className="bg-white/20 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-80 border border-white/30">

        <h2 className="text-3xl font-bold text-white text-center mb-6">
          🔐 Login
        </h2>

        <form onSubmit={login}>

          {/* EMAIL */}
          <div className="flex items-center bg-white/30 p-2 rounded mb-4">
            <FaEnvelope className="text-white mr-2" />
            <input
              type="email"
              placeholder="Email"
              className="bg-transparent outline-none text-white w-full placeholder-white"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* PASSWORD */}
          <div className="flex items-center bg-white/30 p-2 rounded mb-4">
            <FaLock className="text-white mr-2" />
            <input
              type="password"
              placeholder="Password"
              className="bg-transparent outline-none text-white w-full placeholder-white"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {/* BUTTON */}
          <button className="w-full bg-white text-purple-600 font-semibold p-2 rounded-lg hover:bg-gray-200 transition">
            Login
          </button>

        </form>

        {/* REGISTER LINK */}
        <p className="text-center text-white mt-4">
          New user?{" "}
          <span
            onClick={() => navigate("/register")}
            className="underline cursor-pointer font-semibold"
          >
            Register
          </span>
        </p>

      </div>
    </div>
  );
}