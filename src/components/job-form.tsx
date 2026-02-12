import { useKeyboard } from "@opentui/react";
import { useState } from "react";

type JobFormProps = {
	focused: boolean;
	queueName: string;
	onSubmit: (name: string, data: Record<string, unknown>) => void;
	onCancel: () => void;
};

export function JobForm({
	focused,
	queueName,
	onSubmit,
	onCancel,
}: JobFormProps) {
	const [name, setName] = useState("");
	const [dataStr, setDataStr] = useState("{}");
	const [focusField, setFocusField] = useState<"name" | "data">("name");
	const [parseError, setParseError] = useState<string | null>(null);

	const handleSubmit = () => {
		if (!name.trim()) return;
		try {
			const data = JSON.parse(dataStr);
			setParseError(null);
			onSubmit(name.trim(), data);
		} catch {
			setParseError("Invalid JSON");
		}
	};

	useKeyboard((key) => {
		if (!focused) return;
		if (key.name === "tab") {
			setFocusField((f) => (f === "name" ? "data" : "name"));
		}
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
			width={60}
			title={`Add Job to ${queueName}`}
			titleAlignment="left"
		>
			<text fg="#94a3b8">Job name:</text>
			<input
				value={name}
				onChange={setName}
				onSubmit={handleSubmit}
				focused={focused && focusField === "name"}
				placeholder="my-job"
				backgroundColor="#1e293b"
				textColor="#e2e8f0"
				focusedBackgroundColor="#334155"
				cursorColor="#a78bfa"
			/>
			<box marginTop={1}>
				<text fg="#94a3b8">Data (JSON):</text>
			</box>
			<textarea
				value={dataStr}
				onChange={setDataStr}
				focused={focused && focusField === "data"}
				height={5}
				backgroundColor="#1e293b"
				textColor="#e2e8f0"
			/>
			{parseError && <text fg="#ef4444">{parseError}</text>}
			<box marginTop={1}>
				<text fg="#64748b">enter:submit tab:switch field esc:cancel</text>
			</box>
		</box>
	);
}
