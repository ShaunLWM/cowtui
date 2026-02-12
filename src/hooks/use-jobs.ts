import { useCallback, useEffect, useRef, useState } from "react";
import { getJobs } from "../lib/job-service.ts";
import type { JobInfo, JobState } from "../types.ts";

export function useJobs(
	queueName: string | null,
	stateFilter?: JobState,
	pollInterval = 3000,
) {
	const [jobs, setJobs] = useState<JobInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const refresh = useCallback(async () => {
		if (!queueName) {
			setJobs([]);
			return;
		}
		try {
			setLoading(true);
			const result = await getJobs(queueName, stateFilter);
			setJobs(result);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [queueName, stateFilter]);

	useEffect(() => {
		refresh();
		timerRef.current = setInterval(refresh, pollInterval);
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [refresh, pollInterval]);

	return { jobs, loading, error, refresh };
}
