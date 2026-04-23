import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaSignInAlt, FaExclamationTriangle } from "react-icons/fa";
import { MdSchool } from "react-icons/md";

export default function Login() {
  const [form, setForm]     = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const navigate            = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#f1f4fb] font-sans">

      {/* ── Left Banner ── */}
      <div className="hidden md:flex flex-col justify-center px-14 py-12 bg-gradient-to-br from-[#0f2444] via-[#1a3a6b] to-[#2453a0] relative overflow-hidden">

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "48px 48px" }}
        />
        {/* Glow blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full bg-amber-400/10 blur-2xl" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border-2 border-amber-400/50 flex items-center justify-center text-3xl mb-8">
            🎓
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Student<br />
            <span className="text-amber-400">Grievance</span> Portal
          </h1>

          <p className="text-white/60 text-sm leading-relaxed max-w-xs mb-10">
            A transparent and efficient system to submit, track, and resolve
            student concerns at your institution.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              "Submit grievances instantly",
              "Track complaint status in real time",
              "Secure JWT authentication",
              "Search and manage your complaints",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-white/75 text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form ── */}
      <div className="flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg">🎓</div>
            <span className="font-extrabold text-slate-800">GrievanceMS</span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-400 mb-8">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-indigo-600 font-semibold cursor-pointer hover:underline"
            >
              Register here
            </span>
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              <FaExclamationTriangle size={13} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={login} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="email"
                  placeholder="you@college.edu"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-slate-300"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-slate-300"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition shadow-sm text-sm mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <FaSignInAlt size={13} /> Sign In
                </>
              )}
            </button>

          </form>

          <p className="text-center text-xs text-slate-300 mt-8">
            Secured with bcrypt &amp; JWT authentication
          </p>
        </div>
      </div>
    </div>
  );
}