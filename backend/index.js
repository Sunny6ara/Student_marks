const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// ─────────────────────────────────────────────
// DATABASE CONNECTION
// ─────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ─────────────────────────────────────────────
// SCHEMAS & MODELS
// ─────────────────────────────────────────────

// Student Schema
const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);

// Grievance Schema
const grievanceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    category: {
      type: String,
      enum: ["Academic", "Hostel", "Transport", "Other"],
      required: [true, "Category is required"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Pending", "Resolved"],
      default: "Pending",
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
  },
  { timestamps: true }
);

const Grievance = mongoose.model("Grievance", grievanceSchema);

// ─────────────────────────────────────────────
// JWT MIDDLEWARE
// ─────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.student = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: Invalid or expired token" });
  }
};

// ─────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────

// a) POST /api/register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Check duplicate email
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const student = await Student.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// b) POST /api/login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // Find student
    const student = await Student.findOne({ email });
    if (!student) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: student._id, name: student.name, email: student.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ─────────────────────────────────────────────
// GRIEVANCE ROUTES  (all protected)
// ─────────────────────────────────────────────

// h) GET /api/grievances/search?title=xyz  ← must be defined BEFORE /:id
app.get("/api/grievances/search", verifyToken, async (req, res) => {
  try {
    const { title } = req.query;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Query param 'title' is required" });
    }

    const grievances = await Grievance.find({
      student: req.student.id,
      title: { $regex: title, $options: "i" },
    }).populate("student", "name email");

    res.status(200).json({
      success: true,
      count: grievances.length,
      grievances,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// c) POST /api/grievances → Submit grievance
app.post("/api/grievances", verifyToken, async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res
        .status(400)
        .json({ success: false, message: "Title, description, and category are required" });
    }

    const grievance = await Grievance.create({
      title,
      description,
      category,
      student: req.student.id,
    });

    res.status(201).json({
      success: true,
      message: "Grievance submitted successfully",
      grievance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// d) GET /api/grievances → View all grievances of logged-in student
app.get("/api/grievances", verifyToken, async (req, res) => {
  try {
    const grievances = await Grievance.find({ student: req.student.id })
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: grievances.length,
      grievances,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// e) GET /api/grievances/:id → View grievance by ID
app.get("/api/grievances/:id", verifyToken, async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id).populate(
      "student",
      "name email"
    );

    if (!grievance) {
      return res
        .status(404)
        .json({ success: false, message: "Grievance not found" });
    }

    // Ensure ownership
    if (grievance.student._id.toString() !== req.student.id) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Not your grievance" });
    }

    res.status(200).json({ success: true, grievance });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// f) PUT /api/grievances/:id → Update grievance
app.put("/api/grievances/:id", verifyToken, async (req, res) => {
  try {
    const { title, description, category, status } = req.body;

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res
        .status(404)
        .json({ success: false, message: "Grievance not found" });
    }

    // Ensure ownership
    if (grievance.student.toString() !== req.student.id) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Not your grievance" });
    }

    // Update fields
    if (title) grievance.title = title;
    if (description) grievance.description = description;
    if (category) grievance.category = category;
    if (status) grievance.status = status;

    await grievance.save();

    res.status(200).json({
      success: true,
      message: "Grievance updated successfully",
      grievance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// g) DELETE /api/grievances/:id → Delete grievance
app.delete("/api/grievances/:id", verifyToken, async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res
        .status(404)
        .json({ success: false, message: "Grievance not found" });
    }

    // Ensure ownership
    if (grievance.student.toString() !== req.student.id) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Not your grievance" });
    }

    await grievance.deleteOne();

    res.status(200).json({
      success: true,
      message: "Grievance deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ─────────────────────────────────────────────
// 404 FALLBACK
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});