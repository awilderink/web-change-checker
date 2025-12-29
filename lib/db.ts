import { Database } from "bun:sqlite";

declare global {
	var sqlite_db: Database | undefined;
}

let db: Database;

if (!global.sqlite_db) {
	global.sqlite_db = new Database("mydb.sqlite");
	// Create table
	global.sqlite_db.run(`
    CREATE TABLE IF NOT EXISTS monitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      selector TEXT,
      interval INTEGER NOT NULL,
      last_hash TEXT,
      last_checked INTEGER,
      notification_topic TEXT,
      notification_template TEXT,
      headers TEXT,
      last_screenshot TEXT,
      trigger_type TEXT,
      trigger_text TEXT,
      wait_until TEXT,
      wait_delay INTEGER,
      wait_for_selector TEXT,
      status TEXT,
      last_error TEXT
    )
  `);

	// Migration: Add columns if they don't exist (for existing databases)
	try {
		global.sqlite_db.run(
			"ALTER TABLE monitors ADD COLUMN notification_topic TEXT",
		);
	} catch {}
	try {
		global.sqlite_db.run(
			"ALTER TABLE monitors ADD COLUMN notification_template TEXT",
		);
	} catch {}
	try {
		global.sqlite_db.run("ALTER TABLE monitors ADD COLUMN headers TEXT");
	} catch {}
	try {
		global.sqlite_db.run(
			"ALTER TABLE monitors ADD COLUMN last_screenshot TEXT",
		);
	} catch {}
	try {
		global.sqlite_db.run("ALTER TABLE monitors ADD COLUMN trigger_type TEXT");
	} catch {}
	try {
		global.sqlite_db.run("ALTER TABLE monitors ADD COLUMN trigger_text TEXT");
	} catch {}
	try {
		global.sqlite_db.run("ALTER TABLE monitors ADD COLUMN wait_until TEXT");
	} catch {}
	try {
		global.sqlite_db.run("ALTER TABLE monitors ADD COLUMN wait_delay INTEGER");
	} catch {}
	try {
		global.sqlite_db.run(
			"ALTER TABLE monitors ADD COLUMN wait_for_selector TEXT",
		);
	} catch {}
	try {
		global.sqlite_db.run("ALTER TABLE monitors ADD COLUMN status TEXT");
	} catch {}
	try {
		global.sqlite_db.run("ALTER TABLE monitors ADD COLUMN last_error TEXT");
	} catch {}
}
db = global.sqlite_db;

export type Monitor = {
	id: number;
	url: string;
	selector: string | null;
	interval: number; // in seconds
	last_hash: string | null;
	last_checked: number | null;
	notification_topic: string | null;
	notification_template: string | null;
	headers: string | null; // JSON string
	last_screenshot: string | null; // Filename of the screenshot
	trigger_type: string | null; // 'change', 'contains', 'missing'
	trigger_text: string | null;
	wait_until: string | null; // 'load', 'domcontentloaded', 'networkidle0', 'networkidle2'
	wait_delay: number | null; // ms
	wait_for_selector: string | null;
	status: string | null; // 'active', 'error'
	last_error: string | null;
};

export const addMonitor = (
	url: string,
	interval: number,
	selector?: string,
	notification_topic?: string,
	notification_template?: string,
	headers?: string,
	trigger_type?: string,
	trigger_text?: string,
	wait_until?: string,
	wait_delay?: number,
	wait_for_selector?: string,
) => {
	return db.run(
		"INSERT INTO monitors (url, interval, selector, last_checked, notification_topic, notification_template, headers, last_screenshot, trigger_type, trigger_text, wait_until, wait_delay, wait_for_selector, status, last_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		[
			url,
			interval,
			selector || null,
			0,
			notification_topic || null,
			notification_template || null,
			headers || null,
			null,
			trigger_type || null,
			trigger_text || null,
			wait_until || "networkidle2",
			wait_delay !== undefined ? wait_delay : 10000,
			wait_for_selector || null,
			"active",
			null,
		],
	);
};

export const updateMonitor = (
	id: number,
	url: string,
	interval: number,
	selector?: string,
	notification_topic?: string,
	notification_template?: string,
	headers?: string,
	trigger_type?: string,
	trigger_text?: string,
	wait_until?: string,
	wait_delay?: number,
	wait_for_selector?: string,
) => {
	return db.run(
		"UPDATE monitors SET url = ?, interval = ?, selector = ?, notification_topic = ?, notification_template = ?, headers = ?, trigger_type = ?, trigger_text = ?, wait_until = ?, wait_delay = ?, wait_for_selector = ? WHERE id = ?",
		[
			url,
			interval,
			selector || null,
			notification_topic || null,
			notification_template || null,
			headers || null,
			trigger_type || null,
			trigger_text || null,
			wait_until || "networkidle2",
			wait_delay !== undefined ? wait_delay : 10000,
			wait_for_selector || null,
			id,
		],
	);
};

export const getMonitors = () => {
	return db.query("SELECT * FROM monitors").all() as Monitor[];
};

export const deleteMonitor = (id: number) => {
	return db.run("DELETE FROM monitors WHERE id = ?", [id]);
};

export const updateMonitorStatus = (
	id: number,
	hash: string,
	lastChecked: number,
	lastScreenshot?: string,
	status: string = "active",
	lastError: string | null = null,
) => {
	if (lastScreenshot) {
		return db.run(
			"UPDATE monitors SET last_hash = ?, last_checked = ?, last_screenshot = ?, status = ?, last_error = ? WHERE id = ?",
			[hash, lastChecked, lastScreenshot, status, lastError, id],
		);
	}
	return db.run(
		"UPDATE monitors SET last_hash = ?, last_checked = ?, status = ?, last_error = ? WHERE id = ?",
		[hash, lastChecked, status, lastError, id],
	);
};
