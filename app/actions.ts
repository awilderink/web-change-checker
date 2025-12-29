"use server";

import { revalidatePath } from "next/cache";
import { addMonitor, deleteMonitor, updateMonitor } from "@/lib/db";

export async function createMonitorAction(formData: FormData) {
	const url = formData.get("url") as string;
	const interval = parseInt(formData.get("interval") as string, 10);
	const selector = (formData.get("selector") as string) || undefined;
	const notification_topic =
		(formData.get("notification_topic") as string) || undefined;
	const notification_template =
		(formData.get("notification_template") as string) || undefined;
	const trigger_type = (formData.get("trigger_type") as string) || undefined;
	const trigger_text = (formData.get("trigger_text") as string) || undefined;
	const wait_until = (formData.get("wait_until") as string) || "networkidle2";
	const wait_delay_str = formData.get("wait_delay") as string;
	const wait_delay = wait_delay_str ? parseInt(wait_delay_str, 10) : 10000;
	const wait_for_selector =
		(formData.get("wait_for_selector") as string) || undefined;

	let headers = (formData.get("headers") as string) || undefined;

	// Validate headers JSON if provided
	if (headers) {
		try {
			JSON.parse(headers);
		} catch (_e) {
			console.error("Invalid headers JSON:", headers);
			headers = undefined;
		}
	}

	if (!url || !interval) {
		throw new Error("URL and interval are required");
	}

	addMonitor(
		url,
		interval,
		selector,
		notification_topic,
		notification_template,
		headers,
		trigger_type,
		trigger_text,
		wait_until,
		wait_delay,
		wait_for_selector,
	);
	revalidatePath("/");
}

export async function updateMonitorAction(id: number, formData: FormData) {
	const url = formData.get("url") as string;
	const interval = parseInt(formData.get("interval") as string, 10);
	const selector = (formData.get("selector") as string) || undefined;
	const notification_topic =
		(formData.get("notification_topic") as string) || undefined;
	const notification_template =
		(formData.get("notification_template") as string) || undefined;
	const trigger_type = (formData.get("trigger_type") as string) || undefined;
	const trigger_text = (formData.get("trigger_text") as string) || undefined;
	const wait_until = (formData.get("wait_until") as string) || "networkidle2";
	const wait_delay_str = formData.get("wait_delay") as string;
	const wait_delay = wait_delay_str ? parseInt(wait_delay_str, 10) : 10000;
	const wait_for_selector =
		(formData.get("wait_for_selector") as string) || undefined;

	let headers = (formData.get("headers") as string) || undefined;

	// Validate headers JSON if provided
	if (headers) {
		try {
			JSON.parse(headers);
		} catch (_e) {
			console.error("Invalid headers JSON:", headers);
			headers = undefined;
		}
	}

	if (!url || !interval) {
		throw new Error("URL and interval are required");
	}

	updateMonitor(
		id,
		url,
		interval,
		selector,
		notification_topic,
		notification_template,
		headers,
		trigger_type,
		trigger_text,
		wait_until,
		wait_delay,
		wait_for_selector,
	);
	revalidatePath("/");
}

export async function deleteMonitorAction(id: number) {
	deleteMonitor(id);
	revalidatePath("/");
}
