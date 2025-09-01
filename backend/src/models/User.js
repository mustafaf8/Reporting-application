const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  position: { type: String, default: "" },
  profileImageUrl: { type: String, default: "" },
  phone: { type: String, default: "" },
  department: { type: String, default: "" },
  company: { type: String, default: "" },
  address: { type: String, default: "" },
  bio: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
