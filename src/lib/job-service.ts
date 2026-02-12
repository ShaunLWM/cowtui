import { type JobType, Queue } from "bullmq";
import { type JobInfo, type JobState, jobFromBullJob } from "../types.ts";
import { getBullConnection } from "./connection.ts";

const queueCache = new Map<string, Queue>();

function getQueue(name: string): Queue {
	let q = queueCache.get(name);
	if (!q) {
		q = new Queue(name, { connection: getBullConnection() });
		queueCache.set(name, q);
	}
	return q;
}

export async function getJobs(
	queueName: string,
	state?: JobState,
	start = 0,
	end = 49,
): Promise<JobInfo[]> {
	const q = getQueue(queueName);
	const types: JobType | JobType[] = state ?? [
		"waiting",
		"active",
		"completed",
		"failed",
		"delayed",
	];
	const jobs = await q.getJobs(types, start, end);
	const results: JobInfo[] = [];
	for (const job of jobs) {
		if (!job) continue;
		const s = state ?? (await job.getState());
		results.push(jobFromBullJob(job, s as JobState));
	}
	results.sort((a, b) => b.timestamp - a.timestamp);
	return results;
}

export async function getJobById(
	queueName: string,
	jobId: string,
): Promise<JobInfo | null> {
	const q = getQueue(queueName);
	const job = await q.getJob(jobId);
	if (!job) return null;
	const state = (await job.getState()) as JobState;
	return jobFromBullJob(job, state);
}

export async function addJob(
	queueName: string,
	jobName: string,
	data: Record<string, unknown>,
	opts?: {
		delay?: number;
		priority?: number;
		attempts?: number;
	},
): Promise<string> {
	const q = getQueue(queueName);
	const job = await q.add(jobName, data, {
		delay: opts?.delay,
		priority: opts?.priority,
		attempts: opts?.attempts ?? 3,
		backoff: { type: "exponential", delay: 2000 },
	});
	return job.id ?? "unknown";
}

export async function retryJob(
	queueName: string,
	jobId: string,
): Promise<boolean> {
	const q = getQueue(queueName);
	const job = await q.getJob(jobId);
	if (!job) return false;
	await job.retry();
	return true;
}

export async function removeJob(
	queueName: string,
	jobId: string,
): Promise<boolean> {
	const q = getQueue(queueName);
	const job = await q.getJob(jobId);
	if (!job) return false;
	await job.remove();
	return true;
}

export async function getJobLogs(
	queueName: string,
	jobId: string,
): Promise<string[]> {
	const q = getQueue(queueName);
	const { logs } = await q.getJobLogs(jobId, 0, 100);
	return logs;
}

export async function closeAllJobQueues(): Promise<void> {
	for (const q of queueCache.values()) {
		await q.close();
	}
	queueCache.clear();
}
