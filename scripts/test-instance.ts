/**
 * Test BullMQ instance — creates queues, runs workers, continuously adds jobs.
 * Run: bun run test-bullmq
 * Requires Redis on localhost:6379
 */

import { Queue, Worker } from "bullmq";

const connection = { host: "localhost", port: 6379 };

const emailQueue = new Queue("email-notifications", { connection });
const imageQueue = new Queue("image-processing", { connection });
const reportQueue = new Queue("report-generation", { connection });
const cleanupQueue = new Queue("data-cleanup", { connection });

console.log("Created 4 queues");

// --- Workers ---

const emailWorker = new Worker(
  "email-notifications",
  async (job) => {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 1500));
    if (Math.random() < 0.15) throw new Error("SMTP connection timeout");
    await job.updateProgress(50);
    await job.log(`Sending ${job.name} to ${job.data.to}`);
    await new Promise((r) => setTimeout(r, 300));
    await job.updateProgress(100);
    await job.log("Delivered successfully");
    return { sent: true, messageId: `msg-${Date.now()}` };
  },
  { connection, concurrency: 3 },
);

const imageWorker = new Worker(
  "image-processing",
  async (job) => {
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));
    if (Math.random() < 0.2) throw new Error("Unsupported image format");
    for (let p = 0; p <= 100; p += 25) {
      await job.updateProgress(p);
      await new Promise((r) => setTimeout(r, 200));
    }
    await job.log(`Processed ${job.name}: ${job.data.url}`);
    return { outputUrl: job.data.url.replace(".jpg", "-out.jpg") };
  },
  { connection, concurrency: 2 },
);

const reportWorker = new Worker(
  "report-generation",
  async (job) => {
    await job.log(`Generating ${job.name}`);
    for (let p = 0; p <= 100; p += 10) {
      await job.updateProgress(p);
      await new Promise((r) => setTimeout(r, 500));
    }
    await job.log("Report generated");
    return { pages: Math.floor(Math.random() * 50) + 5 };
  },
  { connection, concurrency: 1 },
);

// No worker for cleanup — jobs accumulate in waiting state

// --- Event logging ---

emailWorker.on("completed", (job) =>
  console.log(`  [email] completed: ${job.id}`),
);
emailWorker.on("failed", (job, err) =>
  console.log(`  [email] failed: ${job?.id} - ${err.message}`),
);
imageWorker.on("completed", (job) =>
  console.log(`  [image] completed: ${job.id}`),
);
imageWorker.on("failed", (job, err) =>
  console.log(`  [image] failed: ${job?.id} - ${err.message}`),
);
reportWorker.on("completed", (job) =>
  console.log(`  [report] completed: ${job.id}`),
);

// --- Continuous job producer ---

const JOB_NAMES = ["send-welcome", "send-newsletter", "send-reset", "send-invoice"];
const IMG_OPS = ["resize", "thumbnail", "watermark", "compress"];
const REPORT_TYPES = ["monthly-report", "annual-summary", "audit-log", "usage-stats"];

let batch = 0;

async function addBatch() {
  batch++;
  const ts = Date.now();

  // 3-6 email jobs
  const emailCount = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < emailCount; i++) {
    const name = JOB_NAMES[Math.floor(Math.random() * JOB_NAMES.length)]!;
    await emailQueue.add(name, {
      to: `user-${ts}-${i}@example.com`,
      template: name,
      batch,
    }, {
      attempts: 3,
      delay: Math.random() < 0.2 ? Math.floor(Math.random() * 10000) : undefined,
      priority: Math.random() < 0.1 ? 1 : undefined,
    });
  }

  // 1-3 image jobs
  const imgCount = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < imgCount; i++) {
    const op = IMG_OPS[Math.floor(Math.random() * IMG_OPS.length)]!;
    await imageQueue.add(op, {
      url: `https://cdn.example.com/${ts}-${i}.jpg`,
      width: 800,
      height: 600,
    }, { attempts: 2 });
  }

  // 0-1 report jobs
  if (Math.random() < 0.4) {
    const type = REPORT_TYPES[Math.floor(Math.random() * REPORT_TYPES.length)]!;
    await reportQueue.add(type, {
      period: `2025-batch-${batch}`,
      format: Math.random() < 0.5 ? "pdf" : "csv",
    }, { delay: Math.floor(Math.random() * 15000) });
  }

  // 0-1 cleanup jobs (no worker — these pile up)
  if (Math.random() < 0.3) {
    await cleanupQueue.add("purge-old-sessions", {
      olderThanDays: 30,
      batch,
    });
  }

  console.log(`[batch ${batch}] added ${emailCount} email, ${imgCount} image jobs`);
}

console.log("Workers running. Adding new jobs every 4-8s. Ctrl+C to stop.");
console.log("  email-notifications: concurrency 3");
console.log("  image-processing:    concurrency 2");
console.log("  report-generation:   concurrency 1");
console.log("  data-cleanup:        no worker (accumulates)");
console.log("");

// Seed initial batch
await addBatch();

// Loop: add a batch every 4-8 seconds
const loop = setInterval(async () => {
  await addBatch();
}, 4000 + Math.random() * 4000);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  clearInterval(loop);
  await emailWorker.close();
  await imageWorker.close();
  await reportWorker.close();
  await emailQueue.close();
  await imageQueue.close();
  await reportQueue.close();
  await cleanupQueue.close();
  process.exit(0);
});
