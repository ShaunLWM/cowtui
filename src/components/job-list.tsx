import { JOB_STATES, type JobInfo, type JobState } from "../types.ts";

type JobListProps = {
	jobs: JobInfo[];
	selectedIndex: number;
	focused: boolean;
	stateFilter?: JobState;
	onSelect: (job: JobInfo) => void;
	onChange: (index: number) => void;
	queueName: string;
};

const STATE_TABS = [
	{ label: "All", value: undefined as JobState | undefined },
	...JOB_STATES.map((s) => ({
		label: s.charAt(0).toUpperCase() + s.slice(1),
		value: s as JobState | undefined,
	})),
];

function stateTag(state: string): string {
	switch (state) {
		case "waiting":
			return "W";
		case "active":
			return "A";
		case "completed":
			return "C";
		case "failed":
			return "F";
		case "delayed":
			return "D";
		default:
			return "?";
	}
}

function formatTime(ts: number): string {
	const d = new Date(ts);
	return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

export function JobList({
	jobs,
	selectedIndex,
	focused,
	stateFilter,
	onSelect,
	onChange,
	queueName,
}: JobListProps) {
	const activeTabIdx = stateFilter
		? STATE_TABS.findIndex((t) => t.value === stateFilter)
		: 0;

	return (
		<box flexDirection="column" flexGrow={1}>
			<box paddingLeft={1} flexDirection="row" gap={1}>
				<text fg="#64748b">
					<strong>Jobs</strong> - {queueName}
				</text>
				<text fg="#525252">|</text>
				{STATE_TABS.map((t, i) => (
					<text
						key={t.label}
						fg={i === activeTabIdx ? "#e2e8f0" : "#525252"}
						bg={i === activeTabIdx ? "#334155" : undefined}
					>
						{i === activeTabIdx ? (
							<strong> {t.label} </strong>
						) : (
							<span> {t.label} </span>
						)}
					</text>
				))}
			</box>
			{jobs.length === 0 ? (
				<box padding={1}>
					<text fg="#525252">No jobs.</text>
				</box>
			) : (
				<select
					options={jobs.map((j) => ({
						name: `${stateTag(j.state)} [${j.id}] ${j.name}`,
						description: `${formatTime(j.timestamp)}${typeof j.progress === "number" && j.progress > 0 ? ` ${j.progress}%` : ""}`,
						value: j.id,
					}))}
					selectedIndex={selectedIndex}
					focused={focused}
					flexGrow={1}
					onSelect={(idx) => {
						const job = jobs[idx];
						if (job) onSelect(job);
					}}
					onChange={(idx) => onChange(idx)}
					showScrollIndicator={true}
					selectedBackgroundColor="#334155"
					selectedTextColor="#a78bfa"
					textColor="#94a3b8"
					descriptionColor="#64748b"
				/>
			)}
		</box>
	);
}
