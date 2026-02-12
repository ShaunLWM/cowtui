import { useCallback, useEffect, useRef, useState } from "react";
import { getAllQueueStats } from "../lib/queue-service.ts";
import type { QueueStats } from "../types.ts";

export function useQueues(pollInterval = 3000) {
	const [queues, setQueues] = useState<QueueStats[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const refresh = useCallback(async () => {
		try {
			const stats = await getAllQueueStats();
			setQueues(stats);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refresh();
		timerRef.current = setInterval(refresh, pollInterval);
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [refresh, pollInterval]);

	return { queues, loading, error, refresh };
}
