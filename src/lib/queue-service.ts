import { Queue } from "bullmq";
import type { QueueStats } from "../types.ts";
import { getBullConnection, getRedis } from "./connection.ts";

const queueCache = new Map<string, Queue>();

function getQueue(name: string): Queue {
	let q = queueCache.get(name);
	if (!q) {
		q = new Queue(name, { connection: getBullConnection() });
		queueCache.set(name, q);
	}
	return q;
}

export async function discoverQueues(): Promise<string[]> {
	const redis = getRedis();
	const keys = await redis.keys("bull:*:meta");
	return keys
		.map((k) => {
			const parts = k.split(":");
			return parts[1] ?? "";
		})
		.filter(Boolean)
		.sort();
}

export async function getQueueStats(name: string): Promise<QueueStats> {
	const q = getQueue(name);
	const [waiting, active, completed, failed, delayed, paused] =
		await Promise.all([
			q.getWaitingCount(),
			q.getActiveCount(),
			q.getCompletedCount(),
			q.getFailedCount(),
			q.getDelayedCount(),
			q.isPaused(),
		]);
	return { name, waiting, active, completed, failed, delayed, paused };
}

export async function getAllQueueStats(): Promise<QueueStats[]> {
	const names = await discoverQueues();
	return Promise.all(names.map(getQueueStats));
}

export async function createQueue(name: string): Promise<void> {
	const q = getQueue(name);
	await q.add("__init__", {}, { removeOnComplete: true });
}

export async function pauseQueue(name: string): Promise<void> {
	const q = getQueue(name);
	await q.pause();
}

export async function resumeQueue(name: string): Promise<void> {
	const q = getQueue(name);
	await q.resume();
}

export async function drainQueue(name: string): Promise<void> {
	const q = getQueue(name);
	await q.drain();
}

export async function cleanQueue(
	name: string,
	state: "completed" | "failed" | "delayed" | "wait" | "active",
	grace: number = 0,
): Promise<number> {
	const q = getQueue(name);
	const removed = await q.clean(grace, 1000, state);
	return removed.length;
}

export async function deleteQueue(name: string): Promise<void> {
	const q = getQueue(name);
	await q.obliterate({ force: true });
	queueCache.delete(name);
}

export async function closeAllQueues(): Promise<void> {
	for (const q of queueCache.values()) {
		await q.close();
	}
	queueCache.clear();
}
