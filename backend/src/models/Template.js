const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    previewImageUrl: { type: String, default: "" },
    ejsFile: { type: String, required: true },
    // Şablonun bölümleri ve varsayılan metinleri
    structure: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Varsayılan renkler, fontlar gibi stil bilgileri
    design: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

templateSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Template", templateSchema);
