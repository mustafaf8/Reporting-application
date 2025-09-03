const express = require("express");
const auth = require("../middleware/auth");
const proposalService = require("../services/proposalService");
const logger = require("../config/logger");
const { validate, schemas } = require("../middleware/validation");

const router = express.Router();

// Create
router.post("/", auth, validate(schemas.createProposal), async (req, res) => {
  try {
    const proposal = await proposalService.createProposal(
      req.body,
      req.user?.id
    );
    return res.status(201).json(proposal);
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Teklif oluşturulamadı", error: err.message });
  }
});

// List
router.get(
  "/",
  auth,
  validate(schemas.proposalQuery, "query"),
  async (req, res) => {
    try {
      const result = await proposalService.getProposals(
        req.query,
        req.user?.id
      );
      return res.json(result);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Teklifler alınamadı", error: err.message });
    }
  }
);

// Get by id
router.get("/:id", auth, async (req, res) => {
  try {
    const proposal = await proposalService.getProposalById(req.params.id);
    // Sahiplik kontrolü: yalnızca kendi teklifine erişebilir
    if (proposal.owner && String(proposal.owner) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Bu kaynağa erişim yetkiniz yok" });
    }
    return res.json(proposal);
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// Update
router.put("/:id", auth, validate(schemas.updateProposal), async (req, res) => {
  try {
    // Sahiplik kontrolü
    const existing = await proposalService.getProposalById(req.params.id);
    if (existing.owner && String(existing.owner) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Bu kaynağı güncelleme yetkiniz yok" });
    }
    const proposal = await proposalService.updateProposal(
      req.params.id,
      req.body
    );
    return res.json(proposal);
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Teklif güncellenemedi", error: err.message });
  }
});

// Sadece status güncelleme için özel endpoint
router.patch(
  "/:id/status",
  auth,
  validate(schemas.updateProposalStatus),
  async (req, res) => {
    try {
      const { status } = req.body;
      // Sahiplik kontrolü
      const existing = await proposalService.getProposalById(req.params.id);
      if (existing.owner && String(existing.owner) !== String(req.user.id)) {
        return res
          .status(403)
          .json({ message: "Bu kaynağı güncelleme yetkiniz yok" });
      }

      const proposal = await proposalService.updateProposalStatus(
        req.params.id,
        status
      );
      return res.json(proposal);
    } catch (err) {
      return res
        .status(400)
        .json({ message: "Status güncellenemedi", error: err.message });
    }
  }
);

// Delete
router.delete("/:id", auth, async (req, res) => {
  try {
    // Sahiplik kontrolü
    const existing = await proposalService.getProposalById(req.params.id);
    if (existing.owner && String(existing.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: "Bu kaynağı silme yetkiniz yok" });
    }
    const result = await proposalService.deleteProposal(req.params.id);
    return res.json(result);
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

module.exports = router;
