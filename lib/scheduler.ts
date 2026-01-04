import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { connect } from "puppeteer-real-browser";
import {
	getMonitors,
	type Monitor,
	updateMonitorStatus,
	setMonitorStatus,
} from "./db";

// Ensure data and screenshots directory exists
const DATA_DIR = join(process.cwd(), "data");
const SCREENSHOT_DIR = join(DATA_DIR, "screenshots");
const COOKIES_FILE = join(DATA_DIR, "cookies.json");

if (!existsSync(SCREENSHOT_DIR)) {
	mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Helper to hash content for comparison
const hashContent = (content: string) => {
	const hash = createHash("sha256");
	hash.update(content);
	return hash.digest("hex");
};

const sendNotification = async (monitor: Monitor, screenshotPath?: string) => {
	if (!monitor.notification_topic) return;

	const topic = monitor.notification_topic;
	const template = monitor.notification_template || "Change detected on {url}!";

	// Replace placeholders
	const message = template
		.replace(/{url}/g, monitor.url)
		.replace(/{selector}/g, monitor.selector || "Full Page")
		.replace(/{time}/g, new Date().toLocaleString());

	try {
		if (screenshotPath) {
			// If we have a screenshot, send it as an attachment
			// ntfy supports PUT/POST with the file body
			// However, we also want to send the message. ntfy allows sending both if we use a specific header or query param,
			// but the easiest way to send an attachment + message is often just putting the file as body and message in header 'Message'
			// OR use the 'Attach' header if the file is hosted (but it's local).

			// Let's read the file buffer
			const fileBuffer = readFileSync(screenshotPath);

			await fetch(`https://ntfy.sh/${topic}`, {
				method: "POST",
				body: fileBuffer,
				headers: {
					Title: `Change Detected: ${new URL(monitor.url).hostname}`,
					Priority: "high",
					Tags: "rotating_light",
					Filename: "screenshot.png",
					Message: message, // ntfy uses this header for the text body when the request body is an attachment
				},
			});
		} else {
			await fetch(`https://ntfy.sh/${topic}`, {
				method: "POST",
				body: message,
				headers: {
					Title: `Change Detected: ${new URL(monitor.url).hostname}`,
					Priority: "high",
					Tags: "rotating_light",
				},
			});
		}

		console.log(`Notification sent to ntfy.sh/${topic}`);
	} catch (error) {
		console.error("Failed to send notification:", error);
	}
};

const fetchPageContent = async (
	monitor: Monitor,
): Promise<{ content: string; screenshotPath: string } | null> => {
	try {
		// Randomize viewport
		const width = 1280 + Math.floor(Math.random() * 100);
		const height = 800 + Math.floor(Math.random() * 100);

		console.log(`Starting real browser for ${monitor.url}...`);
		const { browser, page } = await connect({
			headless: false, // Must be false for turnstile solving
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				`--window-size=${width},${height}`,
			],
			customConfig: {},
			turnstile: true, // Enable automatic turnstile solving
			connectOption: {
				defaultViewport: { width, height },
			},
			disableXvfb: false,
			ignoreAllFlags: false,
		});

		// Set viewport to something reasonable for screenshots
		await page.setViewport({ width, height });

		// Load cookies if available
		if (existsSync(COOKIES_FILE)) {
			try {
				const cookies = JSON.parse(readFileSync(COOKIES_FILE, "utf-8"));
				await page.setCookie(...cookies);
				console.log("Restored cookies from previous session.");
			} catch (e) {
				console.error("Failed to load cookies:", e);
			}
		}

		// Set headers if custom headers are provided
		if (monitor.headers) {
			try {
				const customHeaders = JSON.parse(monitor.headers);
				await page.setExtraHTTPHeaders(customHeaders);
			} catch (e) {
				console.error(`Failed to parse custom headers for ${monitor.url}`, e);
			}
		}

		const waitUntil = (monitor.wait_until || "networkidle2") as
			| "load"
			| "domcontentloaded"
			| "networkidle0"
			| "networkidle2";
		await page.goto(monitor.url, { waitUntil, timeout: 60000 });

		// Simulate human-like behavior to trick Cloudflare
		// 1. Move mouse randomly
		await page.mouse.move(100, 100);
		await page.mouse.move(200, 200);
		await page.mouse.move(Math.random() * 1000, Math.random() * 800);

		// 3. Wait for specific selector if configured
		if (monitor.wait_for_selector) {
			try {
				await page.waitForSelector(monitor.wait_for_selector, {
					timeout: 30000,
				});
			} catch (_e) {
				console.log(
					`Wait selector ${monitor.wait_for_selector} timed out, proceeding...`,
				);
			}
		}

		// 3. Wait longer (Cloudflare turnstile can take 5-10s)
		const waitDelay = monitor.wait_delay ?? 10000;
		if (waitDelay > 0) {
			await new Promise((r) => setTimeout(r, waitDelay));
		}

		// 4. Extract content
		let content = "";
		if (monitor.selector) {
			// Extract specific content using Puppeteer (supports advanced selectors like ::-p-text)
			try {
				// If selector is provided, try to extract just those elements
				// $$eval works with standard CSS selectors and Puppeteer extensions
				content = await page.$$eval(monitor.selector, (elements) =>
					elements.map((e) => e.outerHTML).join("\n"),
				);

				if (!content) {
					console.log(
						`Selector ${monitor.selector} matched no elements, content is empty.`,
					);
				}
			} catch (e) {
				console.error(
					`Failed to extract content for selector ${monitor.selector}:`,
					e,
				);
				// If extraction fails (e.g. invalid selector), fallback to empty string or maybe full content?
				// Empty string is probably safer to avoid false positives if config is bad.
				content = "";
			}
		} else {
			// No selector, use full page content
			content = await page.content();
		}

		// Check if we are still on a challenge page
		const title = await page.title();
		const pageContent = await page.content();
		if (
			title.includes("Just a moment") ||
			pageContent.includes("challenge-platform")
		) {
			console.log("Cloudflare challenge still detected. Aborting check.");
			return null;
		}

		// Take screenshot
		const filename = `monitor-${monitor.id}.png`;
		const filepath = join(SCREENSHOT_DIR, filename);
		await page.screenshot({ path: filepath, fullPage: true });

		// Save cookies for next time
		try {
			const cookies = await page.cookies();
			writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
		} catch (e) {
			console.error("Failed to save cookies:", e);
		}

		await browser.close();
		return { content, screenshotPath: filename };
	} catch (error) {
		console.error(`Puppeteer failed for ${monitor.url}:`, error);
		return null;
	}
};

const checkMonitor = async (monitor: Monitor) => {
	try {
		const result = await fetchPageContent(monitor);
		if (!result) {
			// If fetchPageContent returned null, it means scraping failed (Cloudflare, timeout, etc.)
			updateMonitorStatus(
				monitor.id,
				monitor.last_hash || "",
				Date.now(),
				undefined,
				"error",
				"Failed to load page (Cloudflare or Timeout)",
			);
			return;
		}

		const { content, screenshotPath } = result;

		// Content is already extracted by fetchPageContent (full page or selector-based)
		const contentToCheck = content;

		const currentHash = hashContent(contentToCheck);

		if (monitor.last_hash && monitor.last_hash !== currentHash) {
			console.log(`\n🚨 CHANGE DETECTED for ${monitor.url}!`);
			if (monitor.selector) console.log(`Selector: ${monitor.selector}`);
			console.log(`Timestamp: ${new Date().toLocaleString()}\n`);

			let shouldNotify = true;

			// Check trigger conditions
			if (monitor.trigger_type === "contains" && monitor.trigger_text) {
				if (!contentToCheck.includes(monitor.trigger_text)) {
					console.log(
						`Condition 'contains "${monitor.trigger_text}"' NOT met. Skipping notification.`,
					);
					shouldNotify = false;
				} else {
					console.log(`Condition 'contains "${monitor.trigger_text}"' MET.`);
				}
			} else if (monitor.trigger_type === "missing" && monitor.trigger_text) {
				if (contentToCheck.includes(monitor.trigger_text)) {
					console.log(
						`Condition 'missing "${monitor.trigger_text}"' NOT met (text found). Skipping notification.`,
					);
					shouldNotify = false;
				} else {
					console.log(`Condition 'missing "${monitor.trigger_text}"' MET.`);
				}
			}

			// Send notification with screenshot
			if (shouldNotify) {
				// We need the full path for reading the file to send
				const fullScreenshotPath = join(SCREENSHOT_DIR, screenshotPath);
				await sendNotification(monitor, fullScreenshotPath);
			}
		} else if (!monitor.last_hash) {
			console.log(`✅ Initial check for ${monitor.url}. Saving baseline.`);
		}

		updateMonitorStatus(
			monitor.id,
			currentHash,
			Date.now(),
			screenshotPath,
			"active",
			null,
		);
	} catch (error) {
		console.error(`Error checking ${monitor.url}:`, error);
		updateMonitorStatus(
			monitor.id,
			monitor.last_hash || "",
			Date.now(),
			undefined,
			"error",
			String(error),
		);
	}
};

declare global {
	var scheduler_interval: Timer | undefined;
	var active_checks: Set<number> | undefined;
}

export const startScheduler = () => {
	if (global.scheduler_interval) {
		// Clear existing interval to restart cleanly (helps with HMR)
		clearInterval(global.scheduler_interval);
	}

	console.log("Background scheduler started...");

	global.scheduler_interval = setInterval(async () => {
		// console.log("Scheduler tick...");
		const monitors = getMonitors();
		const now = Date.now();

		// Track running checks to prevent overlapping
		if (!global.active_checks) {
			global.active_checks = new Set<number>();
		}
		// console.log(`Active checks: ${global.active_checks.size}, Monitors: ${monitors.length}`);

		for (const monitor of monitors) {
			// Skip if already checking this monitor
			if (global.active_checks.has(monitor.id)) {
				// console.log(`Skipping ${monitor.url} (already checking)`);
				continue;
			}

			const nextCheck = (monitor.last_checked || 0) + monitor.interval * 1000;
			// const timeUntilCheck = nextCheck - now;

			if (now >= nextCheck) {
				console.log(`Triggering check for ${monitor.url}`);
				global.active_checks.add(monitor.id);

				// Mark as checking
				setMonitorStatus(monitor.id, "checking");

				// Run check in background (don't await loop)
				checkMonitor(monitor).finally(() => {
					if (global.active_checks) {
						global.active_checks.delete(monitor.id);
					}
					console.log(`Finished check for ${monitor.url}`);
				});
			} else {
				// console.log(`Skipping ${monitor.url} (wait ${Math.ceil(timeUntilCheck / 1000)}s)`);
			}
		}
	}, 5000);
};
