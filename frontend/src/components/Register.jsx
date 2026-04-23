import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const register = async (e) => {
    e.preventDefault();
    try {
      await API.post("/register", form);

      // auto login
      const res = await API.post("/login", {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-r from-blue-400 to-purple-500">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-80">

        {/* HEADER */}
        <h2 className="text-3xl font-bold text-center text-purple-600 mb-5">
          📝 Register
        </h2>

        {/* FORM */}
        <form onSubmit={register}>
          <div className="flex items-center border p-2 mb-3 rounded">
            <FaUser className="mr-2" />
            <input
              placeholder="Name"
              className="w-full outline-none"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="flex items-center border p-2 mb-3 rounded">
            <FaEnvelope className="mr-2" />
            <input
              placeholder="Email"
              className="w-full outline-none"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="flex items-center border p-2 mb-3 rounded">
            <FaLock className="mr-2" />
            <input
              type="password"
              placeholder="Password"
              className="w-full outline-none"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button className="w-full bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600">
            Register
          </button>
        </form>

        {/* 🔥 LOGIN LINK */}
        <div className="text-center mt-4">
          <p className="text-sm">
            Already have an account?
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-2 flex items-center justify-center gap-2 w-full border border-purple-500 text-purple-600 p-2 rounded-lg hover:bg-purple-100"
          >
            <FaSignInAlt /> Go to Login
          </button>
        </div>

      </div>
    </div>
  );
}