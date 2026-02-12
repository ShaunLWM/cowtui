import Redis from "ioredis";
import minimist from "minimist";
import type { ConnectionConfig } from "../types.ts";

let redis: Redis | null = null;

export function parseCliArgs(): Partial<ConnectionConfig> {
	const args = minimist(process.argv.slice(2), {
		string: ["host", "password"],
		alias: { h: "host", p: "port", P: "password", d: "db" },
	});
	const config: Partial<ConnectionConfig> = {};
	if (args.host) config.host = args.host;
	if (args.port) config.port = Number(args.port);
	if (args.password) config.password = args.password;
	if (args.db) config.db = Number(args.db);
	return config;
}

export function parseEnvConfig(): Partial<ConnectionConfig> {
	const url = process.env.REDIS_URL;
	if (!url) return {};
	try {
		const parsed = new URL(url);
		const config: Partial<ConnectionConfig> = {
			host: parsed.hostname || "localhost",
			port: Number(parsed.port) || 6379,
		};
		if (parsed.password) config.password = parsed.password;
		const db = parsed.pathname?.slice(1);
		if (db) config.db = Number(db);
		return config;
	} catch {
		return {};
	}
}

export function resolveConfig(): ConnectionConfig {
	const env = parseEnvConfig();
	const cli = parseCliArgs();
	return {
		host: cli.host ?? env.host ?? "localhost",
		port: cli.port ?? env.port ?? 6379,
		password: cli.password ?? env.password,
		db: cli.db ?? env.db,
	};
}

export function getRedis(): Redis {
	if (!redis) {
		const config = resolveConfig();
		redis = new Redis({
			host: config.host,
			port: config.port,
			password: config.password,
			db: config.db,
			maxRetriesPerRequest: null,
			lazyConnect: true,
		});
	}
	return redis;
}

export async function connectRedis(): Promise<void> {
	const r = getRedis();
	if (r.status === "ready") return;
	await r.connect();
}

export async function disconnectRedis(): Promise<void> {
	if (redis) {
		await redis.quit();
		redis = null;
	}
}

export function getConnectionConfig(): ConnectionConfig {
	return resolveConfig();
}

export function getBullConnection(): ConnectionConfig {
	return resolveConfig();
}

export function getConnectionStatus(): string {
	if (!redis) return "disconnected";
	return redis.status;
}
