import type { QueueStats } from "../types.ts";

type QueueListProps = {
	queues: QueueStats[];
	selectedIndex: number;
	focused: boolean;
	onSelect: (index: number) => void;
	onChange: (index: number) => void;
};

export function QueueList({
	queues,
	selectedIndex,
	focused,
	onSelect,
	onChange,
}: QueueListProps) {
	if (queues.length === 0) {
		return (
			<box padding={1}>
				<text fg="#64748b">No queues found. Press 'a' to create one.</text>
			</box>
		);
	}

	const options = queues.map((q) => ({
		name: `${q.paused ? "[PAUSED] " : ""}${q.name}`,
		description: `W:${q.waiting} A:${q.active} C:${q.completed} F:${q.failed} D:${q.delayed}`,
		value: q.name,
	}));

	return (
		<box flexGrow={1} flexDirection="column">
			<box paddingLeft={1} paddingBottom={1}>
				<text fg="#64748b">
					<strong>Queues</strong> ({queues.length})
				</text>
			</box>
			<select
				options={options}
				selectedIndex={selectedIndex}
				focused={focused}
				onSelect={(idx) => onSelect(idx)}
				onChange={(idx) => onChange(idx)}
				flexGrow={1}
				showScrollIndicator={true}
				selectedBackgroundColor="#334155"
				selectedTextColor="#a78bfa"
				textColor="#94a3b8"
				descriptionColor="#64748b"
			/>
		</box>
	);
}
