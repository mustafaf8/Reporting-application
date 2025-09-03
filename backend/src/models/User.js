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
  // Kurumsal alanlar (artık birincil değil, isteğe bağlı/deprecated)
  position: { type: String, default: "" },
  // Cloudinary ile saklanan profil resmi
  profileImageUrl: { type: String, default: "" },
  profileImagePublicId: { type: String, default: "" },
  phone: { type: String, default: "" },
  department: { type: String, default: "" },
  company: { type: String, default: "" },
  address: { type: String, default: "" },
  bio: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  // Yeni kayıt akışında otomatik onay: varsayılan true
  isApproved: { type: Boolean, default: true },
  // Abonelik bilgileri
  subscription: {
    plan: { type: String, default: "free" },
    status: { type: String, default: "inactive" },
    customerId: { type: String, default: "" },
    subscriptionId: { type: String, default: "" },
    currentPeriodEnd: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
