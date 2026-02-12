import { useKeyboard } from "@opentui/react";
import { useState } from "react";

type QueueFormProps = {
	focused: boolean;
	onSubmit: (name: string) => void;
	onCancel: () => void;
};

export function QueueForm({ focused, onSubmit, onCancel }: QueueFormProps) {
	const [name, setName] = useState("");

	useKeyboard((key) => {
		if (!focused) return;
		if (key.name === "escape") {
			onCancel();
		}
	});

	return (
		<box
			flexDirection="column"
			border={true}
			borderStyle="rounded"
			borderColor="#a78bfa"
			padding={1}
			width={50}
			title="Create Queue"
			titleAlignment="left"
		>
			<text fg="#94a3b8">Queue name:</text>
			<input
				value={name}
				onChange={setName}
				onSubmit={() => {
					if (name.trim()) onSubmit(name.trim());
				}}
				focused={focused}
				placeholder="my-queue"
				backgroundColor="#1e293b"
				textColor="#e2e8f0"
				focusedBackgroundColor="#334155"
				cursorColor="#a78bfa"
			/>
			<box marginTop={1} flexDirection="row" gap={2}>
				<text fg="#64748b">enter:create esc:cancel</text>
			</box>
		</box>
	);
}
