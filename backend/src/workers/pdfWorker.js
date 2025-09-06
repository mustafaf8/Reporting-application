// Redis and BullMQ temporarily disabled
// const { Queue, Worker, QueueEvents, JobsOptions } = require("bullmq");
// const IORedis = require("ioredis");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const logger = require("../config/logger");
const Proposal = require("../models/Proposal");

// const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rmr_teklif";

// const connection = new IORedis(REDIS_URL);

function getTemplatePath(ejsFile) {
  const file =
    ejsFile && typeof ejsFile === "string" ? ejsFile : "proposal-template.ejs";
  return path.join(__dirname, "..", "templates", file);
}

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
    getTemplatePath(payload.ejsFile),
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

  // Redis and BullMQ temporarily disabled
  logger.info(
    "PDF worker started (Redis disabled - queue processing unavailable)"
  );

  // Keep the process alive but don't start the worker
  process.on("SIGINT", async () => {
    logger.info("PDF worker shutting down");
    await mongoose.disconnect();
    process.exit(0);
  });

  // Keep the process running
  setInterval(() => {
    // Just keep alive
  }, 60000); // Check every minute
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Worker init error", err);
  process.exit(1);
});
