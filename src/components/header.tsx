type HeaderProps = {
	queueCount: number;
	jobCount: number;
	workerCount: number;
	connectionStatus: string;
	statusMsg: string | null;
};

export function Header({
	queueCount,
	jobCount,
	workerCount,
	connectionStatus,
	statusMsg,
}: HeaderProps) {
	const statusColor =
		connectionStatus === "ready"
			? "#22c55e"
			: connectionStatus === "connecting"
				? "#eab308"
				: "#ef4444";

	return (
		<box
			flexDirection="row"
			justifyContent="space-between"
			paddingLeft={1}
			paddingRight={1}
		>
			<box flexDirection="row" gap={1}>
				<text fg="#a78bfa">
					<strong>cowtui</strong>
				</text>
				<text fg="#525252">|</text>
				<text fg="#94a3b8">
					Q:<strong>{queueCount}</strong>
				</text>
				<text fg="#94a3b8">
					J:<strong>{jobCount}</strong>
				</text>
				<text fg="#94a3b8">
					W:<strong>{workerCount}</strong>
				</text>
				{statusMsg && (
					<>
						<text fg="#525252">|</text>
						<text fg="#a78bfa">{statusMsg}</text>
					</>
				)}
			</box>
			<text fg={statusColor}>{connectionStatus}</text>
		</box>
	);
}
