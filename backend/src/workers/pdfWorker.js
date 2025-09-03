const { Queue, Worker, QueueEvents, JobsOptions } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const logger = require("../config/logger");
const Proposal = require("../models/Proposal");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rmr_teklif";

const connection = new IORedis(REDIS_URL);

const templatePath = path.join(
  __dirname,
  "..",
  "templates",
  "proposal-template.ejs"
);

function formatCurrencyTRY(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

async function renderPdf(jobData) {
  const { payload } = jobData; // { customerName, items, ... , customizations, proposalId }

  const subtotal = payload.items.reduce(
    (sum, it) => sum + Number(it.quantity) * Number(it.unitPrice),
    0
  );
  const discountAmount = subtotal * (Number(payload.discountRate || 0) / 100);
  const withExtras =
    subtotal - discountAmount + Number(payload.extraCosts || 0);
  const vatAmount = withExtras * (Number(payload.vatRate || 0) / 100);
  const grandTotal = Math.round((withExtras + vatAmount) * 100) / 100;

  const html = await ejs.renderFile(
    templatePath,
    {
      customerName: payload.customerName,
      items: payload.items,
      createdAt: Date.now(),
      status: payload.status,
      subtotal,
      vatRate: Number(payload.vatRate || 0),
      vatAmount,
      discountRate: Number(payload.discountRate || 0),
      extraCosts: Number(payload.extraCosts || 0),
      grandTotal,
      company: payload.company,
      customer: payload.customer,
      issuer: payload.issuer,
      customizations: payload.customizations || {},
      formatCurrency: (v) => formatCurrencyTRY(v),
    },
    { async: true }
  );

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    printBackground: true,
  });
  await browser.close();

  return pdfBuffer;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  logger.info("PDF worker connected to MongoDB");

  const worker = new Worker(
    "pdf-generation",
    async (job) => {
      logger.info("PDF job received", { jobId: job.id });
      const pdfBuffer = await renderPdf(job.data);
      // İsteğe bağlı: PDF'i bir storage'a yazabilir veya Proposal'a bir alan ekleyebilirsin.
      if (job.data.proposalId) {
        await Proposal.findByIdAndUpdate(job.data.proposalId, {
          updatedAt: new Date(),
          // Örn: customizations içine bir işaret koy
          customizations: {
            ...(job.data.payload?.customizations || {}),
            pdfStatus: "ready",
          },
        });
      }
      logger.info("PDF job completed", { jobId: job.id });
      return { ok: true };
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    logger.error("PDF job failed", { jobId: job?.id, error: err?.message });
  });

  const queueEvents = new QueueEvents("pdf-generation", { connection });
  await queueEvents.waitUntilReady();
  queueEvents.on("completed", ({ jobId }) =>
    logger.info("PDF job completed", { jobId })
  );
  queueEvents.on("failed", ({ jobId, failedReason }) =>
    logger.error("PDF job failed", { jobId, failedReason })
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Worker init error", err);
  process.exit(1);
});
