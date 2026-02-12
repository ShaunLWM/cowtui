import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./app.tsx";
import { connectRedis, disconnectRedis } from "./lib/connection.ts";
import { closeAllJobQueues } from "./lib/job-service.ts";
import { closeAllQueues } from "./lib/queue-service.ts";

const renderer = await createCliRenderer({
	exitOnCtrlC: false,
	onDestroy: async () => {
		await closeAllQueues();
		await closeAllJobQueues();
		await disconnectRedis();
	},
});

try {
	await connectRedis();
} catch (e) {
	console.error("Failed to connect to Redis:", e);
	renderer.destroy();
}

createRoot(renderer).render(<App />);
