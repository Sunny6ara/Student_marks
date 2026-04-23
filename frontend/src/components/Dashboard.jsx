import { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaEdit, FaTrash, FaSignOutAlt } from "react-icons/fa";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Academic",
  });

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const res = await API.get("/grievances");
      setData(res.data.grievances);
    } catch {
      navigate("/");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editId) {
      await API.put(`/grievances/${editId}`, form);
      setEditId(null);
    } else {
      await API.post("/grievances", form);
    }

    setForm({ title: "", description: "", category: "Academic" });
    fetchData();
  };

  const deleteG = async (id) => {
    await API.delete(`/grievances/${id}`);
    fetchData();
  };

  const editG = (g) => {
    setEditId(g._id);
    setForm(g);
  };

  const searchG = async () => {
    if (!search) return fetchData();
    const res = await API.get(`/grievances/search?title=${search}`);
    setData(res.data.grievances);
  };

  const changeStatus = async (id, status) => {
    await API.put(`/grievances/${id}`, { status });
    fetchData();
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-100 to-pink-100">

      {/* NAVBAR */}
      <div className="flex justify-between items-center bg-white shadow px-6 py-4">
        <h2 className="text-2xl font-bold text-indigo-600">🎯 Grievance Panel</h2>
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>

      <div className="p-6">

        {/* SEARCH */}
        <div className="flex mb-6">
          <input
            className="w-full p-3 border rounded-l-lg focus:outline-none"
            placeholder="Search grievances..."
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={searchG}
            className="bg-indigo-500 text-white px-5 rounded-r-lg hover:bg-indigo-600"
          >
            <FaSearch />
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-xl shadow-lg mb-6 flex flex-wrap gap-3"
        >
          <input
            className="border p-2 rounded w-full md:w-[30%]"
            placeholder="Title"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <input
            className="border p-2 rounded w-full md:w-[30%]"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <select
            className="border p-2 rounded w-full md:w-[20%]"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          >
            <option>Academic</option>
            <option>Hostel</option>
            <option>Transport</option>
            <option>Other</option>
          </select>

          <button className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
            {editId ? "Update" : "Add"}
          </button>
        </form>

        {/* CARDS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((g) => (
            <div
              key={g._id}
              className="bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition"
            >
              <h3 className="text-lg font-bold text-indigo-600 mb-2">
                {g.title}
              </h3>

              <p className="text-gray-600">{g.description}</p>

              <p className="text-sm mt-2 text-gray-400">
                📂 {g.category}
              </p>

              {/* STATUS */}
              <select
                value={g.status}
                onChange={(e) =>
                  changeStatus(g._id, e.target.value)
                }
                className="mt-3 border p-1 rounded"
              >
                <option>Pending</option>
                <option>Resolved</option>
              </select>

              {/* ACTION BUTTONS */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => editG(g)}
                  className="flex items-center gap-1 text-yellow-600"
                >
                  <FaEdit /> Edit
                </button>

                <button
                  onClick={() => deleteG(g._id)}
                  className="flex items-center gap-1 text-red-600"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}