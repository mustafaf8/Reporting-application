const Proposal = require("../models/Proposal");
const logger = require("../config/logger");

// Yardımcı fonksiyonlar
function computeLineTotals(items) {
  return items.map((it) => ({
    name: it.name,
    quantity: Number(it.quantity),
    unitPrice: Number(it.unitPrice),
    lineTotal: Number(it.quantity) * Number(it.unitPrice),
  }));
}

function computeGrandTotal(
  items,
  { vatRate = 0, discountRate = 0, extraCosts = 0 } = {}
) {
  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const discounted = subtotal * (1 - (Number(discountRate) || 0) / 100);
  const withExtras = discounted + (Number(extraCosts) || 0);
  const withVat = withExtras * (1 + (Number(vatRate) || 0) / 100);
  return Math.round(withVat * 100) / 100;
}

// Servis fonksiyonları
const proposalService = {
  // Teklif oluştur
  async createProposal(proposalData, userId) {
    const {
      customerName,
      items = [],
      vatRate = 0,
      discountRate = 0,
      extraCosts = 0,
      status,
    } = proposalData;

    if (!customerName || !Array.isArray(items) || items.length === 0) {
      throw new Error("Müşteri adı ve en az bir kalem gerekli");
    }

    const normalizedItems = computeLineTotals(items);
    const grandTotal = computeGrandTotal(normalizedItems, {
      vatRate,
      discountRate,
      extraCosts,
    });

    const proposal = await Proposal.create({
      customerName,
      items: normalizedItems,
      grandTotal,
      vatRate,
      discountRate,
      extraCosts,
      status: status || "draft",
      owner: userId,
    });

    logger.business("Proposal created", {
      proposalId: proposal._id,
      customerName,
      grandTotal,
      userId,
    });

    return proposal;
  },

  // Teklifleri listele
  async getProposals(filters, userId) {
    const { q, status, page = 1, limit = 20 } = filters;
    const filter = {};

    if (q) filter.customerName = { $regex: q, $options: "i" };
    if (status) filter.status = status;

    // Mevcut kullanıcıya ait olanlar VEYA legacy (owner alanı olmayan) kayıtlar
    if (userId) {
      filter.$or = [
        { owner: userId },
        { owner: { $exists: false } },
        { owner: null },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Proposal.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Proposal.countDocuments(filter),
    ]);

    return { items, total, page: Number(page), limit: Number(limit) };
  },

  // ID'ye göre teklif getir
  async getProposalById(proposalId) {
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      throw new Error("Teklif bulunamadı");
    }
    return proposal;
  },

  // Teklif güncelle
  async updateProposal(proposalId, updateData) {
    const { customerName, items, vatRate, discountRate, extraCosts, status } =
      updateData;
    const update = {};

    if (customerName) update.customerName = customerName;
    if (Array.isArray(items)) {
      update.items = computeLineTotals(items);
      update.grandTotal = computeGrandTotal(update.items, {
        vatRate,
        discountRate,
        extraCosts,
      });
    }
    if (vatRate !== undefined) update.vatRate = Number(vatRate);
    if (discountRate !== undefined) update.discountRate = Number(discountRate);
    if (extraCosts !== undefined) update.extraCosts = Number(extraCosts);
    if (status) update.status = status;

    update.updatedAt = new Date();

    const proposal = await Proposal.findByIdAndUpdate(proposalId, update, {
      new: true,
    });
    if (!proposal) {
      throw new Error("Teklif bulunamadı");
    }

    return proposal;
  },

  // Teklif sil
  async deleteProposal(proposalId) {
    const deleted = await Proposal.findByIdAndDelete(proposalId);
    if (!deleted) {
      throw new Error("Teklif bulunamadı");
    }
    return { message: "Silindi" };
  },

  // Sadece status güncelle
  async updateProposalStatus(proposalId, status) {
    const proposal = await Proposal.findByIdAndUpdate(
      proposalId,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!proposal) {
      throw new Error("Teklif bulunamadı");
    }

    logger.business("Proposal status updated", {
      proposalId,
      oldStatus: proposal.status,
      newStatus: status,
    });

    return proposal;
  },
};

module.exports = proposalService;
