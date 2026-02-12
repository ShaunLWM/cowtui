import type { JobInfo } from "../types.ts";

type JobDetailProps = {
	job: JobInfo | null;
	logs: string[];
};

function stateColor(state: string): string {
	switch (state) {
		case "waiting":
			return "#eab308";
		case "active":
			return "#3b82f6";
		case "completed":
			return "#22c55e";
		case "failed":
			return "#ef4444";
		case "delayed":
			return "#f97316";
		default:
			return "#94a3b8";
	}
}

function formatTs(ts: number | undefined): string {
	if (!ts) return "n/a";
	const d = new Date(ts);
	return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

export function JobDetail({ job, logs }: JobDetailProps) {
	if (!job) {
		return (
			<box flexGrow={1} padding={1} justifyContent="center" alignItems="center">
				<text fg="#525252">Select a job to inspect</text>
			</box>
		);
	}

	const dataStr = JSON.stringify(job.data, null, 2);
	const returnStr = job.returnvalue
		? JSON.stringify(job.returnvalue, null, 2)
		: null;

	return (
		<box flexGrow={1} flexDirection="column" padding={1}>
			<box flexDirection="row" gap={2}>
				<text fg="#e2e8f0">
					<strong>#{job.id}</strong> {job.name}
				</text>
				<text fg={stateColor(job.state)}>
					<strong>{job.state.toUpperCase()}</strong>
				</text>
				<text fg="#64748b">
					{job.attemptsMade}/{job.attemptsTotal || "-"}
				</text>
				{typeof job.progress === "number" && job.progress > 0 && (
					<text fg="#94a3b8">{job.progress}%</text>
				)}
			</box>

			<box flexDirection="row" gap={2}>
				<text fg="#525252">{formatTs(job.timestamp)}</text>
				{job.processedOn ? (
					<text fg="#525252">proc:{formatTs(job.processedOn)}</text>
				) : null}
				{job.finishedOn ? (
					<text fg="#525252">done:{formatTs(job.finishedOn)}</text>
				) : null}
			</box>

			<box marginTop={1}>
				<text fg="#94a3b8">{dataStr}</text>
			</box>

			{job.failedReason && (
				<box marginTop={1}>
					<text fg="#ef4444">
						<strong>Error:</strong> {job.failedReason}
					</text>
					{job.stacktrace && job.stacktrace.length > 0 && (
						<text fg="#525252">{job.stacktrace.slice(0, 3).join("\n")}</text>
					)}
				</box>
			)}

			{returnStr && (
				<box marginTop={1}>
					<text fg="#22c55e">
						<strong>Return:</strong> {returnStr}
					</text>
				</box>
			)}

			{logs.length > 0 && (
				<box marginTop={1} flexDirection="column">
					<text fg="#64748b">
						<strong>Logs</strong>
					</text>
					{logs.slice(0, 5).map((log, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static log list
						<text key={i} fg="#525252">
							{log}
						</text>
					))}
					{logs.length > 5 && <text fg="#525252">+{logs.length - 5} more</text>}
				</box>
			)}
		</box>
	);
}
