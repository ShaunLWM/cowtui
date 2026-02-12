import { useCallback, useEffect, useRef, useState } from "react";
import { getRedis } from "../lib/connection.ts";
import type { WorkerInfo } from "../types.ts";

export function useWorkers(pollInterval = 5000) {
	const [workers, setWorkers] = useState<WorkerInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const refresh = useCallback(async () => {
		try {
			const redis = getRedis();
			const clientList = await redis.client("LIST");
			const lines =
				typeof clientList === "string" ? clientList.split("\n") : [];
			const result: WorkerInfo[] = [];
			for (const line of lines) {
				if (!line.trim()) continue;
				const fields = Object.fromEntries(
					line.split(" ").map((pair) => {
						const [k, ...v] = pair.split("=");
						return [k, v.join("=")];
					}),
				);
				const name = fields.name ?? "";
				if (!name || (!name.startsWith("bull") && !name.includes("Worker")))
					continue;
				result.push({
					id: fields.id ?? "unknown",
					name,
					addr: fields.addr ?? "",
					age: Number(fields.age ?? 0),
					idle: Number(fields.idle ?? 0),
				});
			}
			setWorkers(result);
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

	return { workers, loading, error, refresh };
}
