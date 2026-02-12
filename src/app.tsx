import { useKeyboard, useRenderer } from "@opentui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Footer } from "./components/footer.tsx";
import { Header } from "./components/header.tsx";
import { JobDetail } from "./components/job-detail.tsx";
import { JobForm } from "./components/job-form.tsx";
import { JobList } from "./components/job-list.tsx";
import { QueueForm } from "./components/queue-form.tsx";
import { QueueList } from "./components/queue-list.tsx";
import { WorkerPanel } from "./components/worker-panel.tsx";
import { useJobs } from "./hooks/use-jobs.ts";
import { useQueues } from "./hooks/use-queues.ts";
import { useWorkers } from "./hooks/use-workers.ts";
import { disconnectRedis, getConnectionStatus } from "./lib/connection.ts";
import { addJob, getJobLogs, removeJob, retryJob } from "./lib/job-service.ts";
import {
	cleanQueue,
	closeAllQueues,
	createQueue,
	deleteQueue,
	drainQueue,
	pauseQueue,
	resumeQueue,
} from "./lib/queue-service.ts";
import type { JobInfo, JobState } from "./types.ts";

type Panel = "queues" | "jobs";
type Modal = "none" | "queue-form" | "job-form";

const JOB_FILTER_STATES: (JobState | undefined)[] = [
	undefined,
	"waiting",
	"active",
	"completed",
	"failed",
	"delayed",
];

export function App() {
	const renderer = useRenderer();

	const [activePanel, setActivePanel] = useState<Panel>("queues");
	const [modal, setModal] = useState<Modal>("none");
	const [statusMsg, setStatusMsg] = useState<string | null>(null);

	const { queues, refresh: refreshQueues } = useQueues();
	const [selectedQueueIdx, setSelectedQueueIdx] = useState(0);
	const selectedQueue = queues[selectedQueueIdx] ?? null;

	const [jobStateFilter, setJobStateFilter] = useState<JobState | undefined>(
		undefined,
	);
	const { jobs, refresh: refreshJobs } = useJobs(
		selectedQueue?.name ?? null,
		jobStateFilter,
	);
	const [selectedJobIdx, setSelectedJobIdx] = useState(0);
	const [inspectedJob, setInspectedJob] = useState<JobInfo | null>(null);
	const [jobLogs, setJobLogs] = useState<string[]>([]);

	const { workers } = useWorkers();

	const totalJobs = queues.reduce(
		(sum, q) => sum + q.waiting + q.active + q.completed + q.failed + q.delayed,
		0,
	);

	const flash = useCallback((msg: string) => {
		setStatusMsg(msg);
		setTimeout(() => setStatusMsg(null), 2000);
	}, []);

	const cycleJobState = useCallback(
		(direction: 1 | -1 = 1) => {
			const idx = JOB_FILTER_STATES.indexOf(jobStateFilter);
			const next =
				JOB_FILTER_STATES[
					(idx + direction + JOB_FILTER_STATES.length) %
						JOB_FILTER_STATES.length
				];
			setJobStateFilter(next);
			setSelectedJobIdx(0);
		},
		[jobStateFilter],
	);

	const logDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const needsAutoInspect = useRef(false);

	const inspectJob = useCallback(
		(job: JobInfo) => {
			setInspectedJob(job);
			if (logDebounceRef.current) clearTimeout(logDebounceRef.current);
			if (selectedQueue) {
				logDebounceRef.current = setTimeout(() => {
					getJobLogs(selectedQueue.name, job.id).then(setJobLogs);
				}, 150);
			}
		},
		[selectedQueue],
	);

	useEffect(() => {
		if (needsAutoInspect.current && activePanel === "jobs" && jobs.length > 0) {
			needsAutoInspect.current = false;
			const job = jobs[selectedJobIdx];
			if (job) inspectJob(job);
		}
	}, [activePanel, jobs, selectedJobIdx, inspectJob]);

	useKeyboard((key) => {
		if (modal !== "none") return;

		// Q or Ctrl+Q to quit
		if (key.name === "q" || (key.ctrl && key.name === "q")) {
			closeAllQueues()
				.then(() => disconnectRedis())
				.then(() => renderer.destroy());
			return;
		}

		// Tab switches panels
		if (key.name === "tab") {
			setActivePanel((p) => {
				if (p === "queues") needsAutoInspect.current = true;
				return p === "queues" ? "jobs" : "queues";
			});
			return;
		}

		// R refreshes everything
		if (key.name === "r" && activePanel === "queues") {
			refreshQueues();
			flash("Refreshed");
			return;
		}

		// --- Queue panel keys ---
		if (activePanel === "queues") {
			if (key.name === "a") {
				setModal("queue-form");
				return;
			}
			if (!selectedQueue) return;

			if (key.name === "return" || key.name === "l") {
				needsAutoInspect.current = true;
				setActivePanel("jobs");
				return;
			}
			if (key.name === "p") {
				const action = selectedQueue.paused
					? resumeQueue(selectedQueue.name)
					: pauseQueue(selectedQueue.name);
				action.then(() => {
					flash(selectedQueue.paused ? "Resumed" : "Paused");
					refreshQueues();
				});
				return;
			}
			if (key.name === "d") {
				drainQueue(selectedQueue.name).then(() => {
					flash("Drained");
					refreshQueues();
				});
				return;
			}
			if (key.name === "c") {
				cleanQueue(selectedQueue.name, "completed").then((n) => {
					flash(`Cleaned ${n} completed jobs`);
					refreshQueues();
				});
				return;
			}
			if (key.name === "x") {
				deleteQueue(selectedQueue.name).then(() => {
					flash("Deleted");
					setSelectedQueueIdx(0);
					refreshQueues();
				});
				return;
			}
		}

		// --- Job panel keys ---
		if (activePanel === "jobs") {
			if (key.name === "h" || key.name === "left") {
				cycleJobState(-1);
				return;
			}
			if (key.name === "l" || key.name === "right") {
				cycleJobState(1);
				return;
			}
			if (key.name === "a" && selectedQueue) {
				setModal("job-form");
				return;
			}
			const currentJob = jobs[selectedJobIdx];
			if (key.name === "r" && selectedQueue && currentJob) {
				retryJob(selectedQueue.name, currentJob.id).then((ok) => {
					flash(ok ? "Retried" : "Failed to retry");
					refreshJobs();
				});
				return;
			}
			if (key.name === "x" && selectedQueue && currentJob) {
				removeJob(selectedQueue.name, currentJob.id).then((ok) => {
					flash(ok ? "Removed" : "Failed to remove");
					refreshJobs();
				});
				return;
			}
			if (key.name === "return" && selectedQueue && currentJob) {
				inspectJob(currentJob);
				return;
			}
			if (key.name === "escape") {
				if (inspectedJob) {
					setInspectedJob(null);
				} else {
					setActivePanel("queues");
				}
				return;
			}
		}
	});

	const handleQueueFormSubmit = useCallback(
		(name: string) => {
			createQueue(name).then(() => {
				flash(`Queue '${name}' created`);
				setModal("none");
				refreshQueues();
			});
		},
		[flash, refreshQueues],
	);

	const handleJobFormSubmit = useCallback(
		(name: string, data: Record<string, unknown>) => {
			if (!selectedQueue) return;
			addJob(selectedQueue.name, name, data).then((id) => {
				flash(`Job '${id}' added`);
				setModal("none");
				refreshJobs();
			});
		},
		[selectedQueue, flash, refreshJobs],
	);

	const connStatus = getConnectionStatus();

	return (
		<box flexDirection="column" flexGrow={1}>
			<Header
				queueCount={queues.length}
				jobCount={totalJobs}
				workerCount={workers.length}
				connectionStatus={connStatus}
				statusMsg={statusMsg}
			/>

			{modal !== "none" && (
				<box position="absolute" left={2} top={2} zIndex={10}>
					{modal === "queue-form" && (
						<QueueForm
							focused={true}
							onSubmit={handleQueueFormSubmit}
							onCancel={() => setModal("none")}
						/>
					)}
					{modal === "job-form" && selectedQueue && (
						<JobForm
							focused={true}
							queueName={selectedQueue.name}
							onSubmit={handleJobFormSubmit}
							onCancel={() => setModal("none")}
						/>
					)}
				</box>
			)}

			<box flexGrow={1} flexDirection="row">
				{/* Left column: queues + workers */}
				<box
					flexDirection="column"
					width="34%"
					border={true}
					borderStyle="rounded"
					borderColor={activePanel === "queues" ? "#a78bfa" : "#334155"}
				>
					<QueueList
						queues={queues}
						selectedIndex={selectedQueueIdx}
						focused={activePanel === "queues" && modal === "none"}
						onSelect={(idx) => {
							setSelectedQueueIdx(idx);
							setSelectedJobIdx(0);
							setInspectedJob(null);
							needsAutoInspect.current = true;
							setActivePanel("jobs");
						}}
						onChange={(idx) => {
							setSelectedQueueIdx(idx);
							setSelectedJobIdx(0);
							setInspectedJob(null);
						}}
					/>
					<WorkerPanel workers={workers} />
				</box>

				{/* Right column: jobs + detail */}
				<box
					flexDirection="column"
					flexGrow={1}
					border={activePanel === "jobs" ? true : ["top", "right", "bottom"]}
					borderStyle="rounded"
					borderColor={activePanel === "jobs" ? "#a78bfa" : "#334155"}
					marginLeft={activePanel === "jobs" ? -1 : 0}
				>
					<JobList
						jobs={jobs}
						selectedIndex={selectedJobIdx}
						focused={activePanel === "jobs" && modal === "none"}
						stateFilter={jobStateFilter}
						onSelect={inspectJob}
						onChange={(idx) => {
							setSelectedJobIdx(idx);
							const job = jobs[idx];
							if (job) inspectJob(job);
						}}
						queueName={selectedQueue?.name ?? "none"}
					/>
					<box
						height={1}
						borderStyle="single"
						border={["top"]}
						borderColor="#334155"
					/>
					<JobDetail job={inspectedJob} logs={jobLogs} />
				</box>
			</box>

			<Footer activePanel={activePanel} />
		</box>
	);
}
