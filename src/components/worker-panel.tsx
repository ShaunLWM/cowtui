import type { WorkerInfo } from "../types.ts";

type WorkerPanelProps = {
	workers: WorkerInfo[];
};

function formatAge(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
	return `${Math.floor(seconds / 3600)}h${Math.floor((seconds % 3600) / 60)}m`;
}

export function WorkerPanel({ workers }: WorkerPanelProps) {
	return (
		<box flexDirection="column" paddingLeft={1} paddingRight={1} paddingTop={1}>
			<box borderStyle="single" border={["top"]} borderColor="#334155" />
			<text fg="#64748b">
				<strong>Workers</strong> ({workers.length})
			</text>
			{workers.length === 0 ? (
				<text fg="#525252">No workers</text>
			) : (
				workers.slice(0, 6).map((w) => (
					<text key={w.id} fg="#94a3b8">
						{w.name.length > 20 ? `${w.name.slice(0, 20)}..` : w.name}{" "}
						<span fg="#64748b">{formatAge(w.age)}</span>
					</text>
				))
			)}
			{workers.length > 6 && (
				<text fg="#525252">+{workers.length - 6} more</text>
			)}
		</box>
	);
}
