import type { Job } from "bullmq";

export type ConnectionConfig = {
	host: string;
	port: number;
	password?: string;
	db?: number;
};

export type QueueStats = {
	name: string;
	waiting: number;
	active: number;
	completed: number;
	failed: number;
	delayed: number;
	paused: boolean;
};

export type JobState =
	| "waiting"
	| "active"
	| "completed"
	| "failed"
	| "delayed";

export const JOB_STATES: JobState[] = [
	"waiting",
	"active",
	"completed",
	"failed",
	"delayed",
];

export type JobInfo = {
	id: string;
	name: string;
	data: unknown;
	progress: number | object | string | boolean;
	timestamp: number;
	processedOn?: number;
	finishedOn?: number;
	failedReason?: string;
	stacktrace?: string[];
	attemptsMade: number;
	attemptsTotal: number;
	state: JobState;
	returnvalue?: unknown;
};

export type WorkerInfo = {
	id: string;
	name: string;
	addr: string;
	age: number;
	idle: number;
};

export function jobFromBullJob(job: Job, state: JobState): JobInfo {
	return {
		id: job.id ?? "unknown",
		name: job.name,
		data: job.data,
		progress: job.progress,
		timestamp: job.timestamp,
		processedOn: job.processedOn,
		finishedOn: job.finishedOn,
		failedReason: job.failedReason,
		stacktrace: job.stacktrace,
		attemptsMade: job.attemptsMade,
		attemptsTotal: job.opts?.attempts ?? 0,
		state,
		returnvalue: job.returnvalue,
	};
}
