import { useEffect, useState, useCallback } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import {
  FaSearch, FaEdit, FaTrash, FaSignOutAlt, FaPlus,
  FaTimes, FaCheckCircle, FaClock, FaLayerGroup,
  FaExclamationTriangle, FaSave, FaUndo, FaBell,
} from "react-icons/fa";
import { MdDashboard, MdOutlineLibraryBooks } from "react-icons/md";

/* ─── helpers ─────────────────────────────────── */
const CATEGORIES = ["Academic", "Hostel", "Transport", "Other"];

const CAT_STYLE = {
  Academic:  "bg-blue-100   text-blue-700",
  Hostel:    "bg-amber-100  text-amber-700",
  Transport: "bg-teal-100   text-teal-700",
  Other:     "bg-gray-100   text-gray-600",
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

const EMPTY = { title: "", description: "", category: "Academic" };

/* ─── Stat Card ────────────────────────────────── */
function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-800 leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

/* ─── Badge ────────────────────────────────────── */
function Badge({ text, cls }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      {text}
    </span>
  );
}

/* ─── Edit / Add Modal ─────────────────────────── */
function GrievanceModal({ form, setForm, onSave, onClose, isEdit, saving }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-700 text-base flex items-center gap-2">
            {isEdit ? <><FaEdit className="text-amber-500" /> Edit Grievance</> : <><FaPlus className="text-indigo-500" /> New Grievance</>}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg p-1.5 transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-slate-50 transition"
              placeholder="Brief title of your complaint"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 transition"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 transition resize-none"
              placeholder="Describe your grievance in detail…"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-100 transition"
          >
            <FaUndo size={12} /> Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm"
          >
            <FaSave size={12} />
            {saving ? "Saving…" : isEdit ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ───────────────────────────── */
export default function Dashboard() {
  const [data, setData]           = useState([]);
  const [search, setSearch]       = useState("");
  const [editId, setEditId]       = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);          // { msg, type }
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const navigate = useNavigate();

  /* toast helper */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* fetch */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/grievances");
      setData(res.data.grievances || []);
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* open add modal */
  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY);
    setShowModal(true);
  };

  /* open edit modal */
  const openEdit = (g) => {
    setEditId(g._id);
    setForm({ title: g.title, description: g.description, category: g.category, status: g.status });
    setShowModal(true);
  };

  /* save (add or edit) */
  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      showToast("Title and description are required.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await API.put(`/grievances/${editId}`, form);
        showToast("Grievance updated successfully.");
      } else {
        await API.post("/grievances", form);
        showToast("Grievance submitted successfully.");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* delete */
  const handleDelete = async (id) => {
    try {
      await API.delete(`/grievances/${id}`);
      setDeleteConfirm(null);
      showToast("Grievance deleted.");
      fetchData();
    } catch {
      showToast("Delete failed.", "error");
    }
  };

  /* status toggle */
  const changeStatus = async (id, status) => {
    try {
      await API.put(`/grievances/${id}`, { status });
      fetchData();
    } catch {
      showToast("Status update failed.", "error");
    }
  };

  /* search */
  const handleSearch = async () => {
    if (!search.trim()) return fetchData();
    setLoading(true);
    try {
      const res = await API.get(`/grievances/search?title=${encodeURIComponent(search.trim())}`);
      setData(res.data.grievances || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => { setSearch(""); fetchData(); };

  /* logout */
  const logout = () => { localStorage.removeItem("token"); navigate("/"); };

  /* stats */
  const total    = data.length;
  const pending  = data.filter((g) => g.status === "Pending").length;
  const resolved = data.filter((g) => g.status === "Resolved").length;

  /* ── render ── */
  return (
    <div className="min-h-screen bg-[#f1f4fb] font-sans">

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white transition-all
            ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}
        >
          {toast.type === "error"
            ? <FaExclamationTriangle />
            : <FaCheckCircle />}
          {toast.msg}
        </div>
      )}

      {/* ── Topbar ── */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg">
              🎓
            </div>
            <div>
              <p className="font-extrabold text-slate-800 leading-none text-base">GrievanceMS</p>
              <p className="text-xs text-slate-400 mt-0.5">Student Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition"
            >
              <FaPlus size={11} /> New Grievance
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 border border-red-200 text-red-500 hover:bg-red-500 hover:text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              <FaSignOutAlt size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<MdOutlineLibraryBooks />} label="Total Grievances" value={total}    color="bg-indigo-100 text-indigo-600" />
          <StatCard icon={<FaClock />}               label="Pending"          value={pending}  color="bg-amber-100  text-amber-600"  />
          <StatCard icon={<FaCheckCircle />}          label="Resolved"         value={resolved} color="bg-emerald-100 text-emerald-600" />
        </div>

        {/* ── Search + Table Panel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Panel header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <MdDashboard className="text-indigo-500" /> My Grievances
            </h2>

            {/* Search */}
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  placeholder="Search by title…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                {search && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={clearSearch}
                  >
                    <FaTimes size={11} />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                Search
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <svg className="animate-spin h-7 w-7 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading…
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <span className="text-5xl">📭</span>
              <p className="text-sm font-medium">No grievances found.</p>
              <button
                onClick={openAdd}
                className="mt-1 text-sm text-indigo-600 hover:underline font-semibold"
              >
                Submit your first grievance →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 text-left font-semibold w-8">#</th>
                    <th className="px-5 py-3 text-left font-semibold">Title & Description</th>
                    <th className="px-5 py-3 text-left font-semibold">Category</th>
                    <th className="px-5 py-3 text-left font-semibold">Date</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((g, i) => (
                    <tr key={g._id} className="hover:bg-slate-50/70 transition group">

                      {/* # */}
                      <td className="px-5 py-4 text-slate-400 font-mono text-xs">{i + 1}</td>

                      {/* Title */}
                      <td className="px-5 py-4 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">{g.title}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{g.description}</p>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <Badge text={g.category} cls={CAT_STYLE[g.category] || CAT_STYLE.Other} />
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap text-xs">
                        {fmtDate(g.date || g.createdAt)}
                      </td>

                      {/* Status select */}
                      <td className="px-5 py-4">
                        <select
                          value={g.status}
                          onChange={(e) => changeStatus(g._id, e.target.value)}
                          className={`text-xs font-bold border rounded-full px-2.5 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 transition
                            ${g.status === "Resolved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50   text-amber-700  border-amber-200"}`}
                        >
                          <option value="Pending">⏳ Pending</option>
                          <option value="Resolved">✅ Resolved</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(g)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                          >
                            <FaEdit size={11} /> Edit
                          </button>

                          {deleteConfirm === g._id ? (
                            <>
                              <button
                                onClick={() => handleDelete(g._id)}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(g._id)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition"
                            >
                              <FaTrash size={11} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table footer */}
          {!loading && data.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
              Showing {data.length} grievance{data.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </main>

      {/* ── Modal ── */}
      {showModal && (
        <GrievanceModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          isEdit={!!editId}
          saving={saving}
        />
      )}
    </div>
  );
}