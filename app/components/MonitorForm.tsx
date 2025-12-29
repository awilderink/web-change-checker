"use client";

import { useState } from "react";
import { createMonitorAction, updateMonitorAction } from "@/app/actions";
import { testNotificationAction } from "@/app/test-notification-action";

type Monitor = {
	id?: number;
	url?: string;
	selector?: string | null;
	interval?: number;
	notification_topic?: string | null;
	notification_template?: string | null;
	headers?: string | null;
	trigger_type?: string | null;
	trigger_text?: string | null;
	wait_until?: string | null;
	wait_delay?: number | null;
	wait_for_selector?: string | null;
};

type MonitorFormProps = {
	monitor?: Monitor;
	onSuccess?: () => void;
	onCancel?: () => void;
};

export default function MonitorForm({
	monitor,
	onSuccess,
	onCancel,
}: MonitorFormProps) {
	const [loading, setLoading] = useState(false);
	const [topic, setTopic] = useState(monitor?.notification_topic || "");
	const [testLoading, setTestLoading] = useState(false);
	const [triggerType, setTriggerType] = useState(
		monitor?.trigger_type || "change",
	);

	const isEditing = !!monitor;

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		const formData = new FormData(event.currentTarget);

		try {
			if (isEditing && monitor?.id) {
				await updateMonitorAction(monitor.id, formData);
			} else {
				await createMonitorAction(formData);
				(event.target as HTMLFormElement).reset();
				setTopic("");
			}
			if (onSuccess) onSuccess();
		} catch (error) {
			console.error(error);
			alert(`Failed to ${isEditing ? "update" : "add"} monitor`);
		} finally {
			setLoading(false);
		}
	};

	const handleTestNotification = async () => {
		if (!topic) {
			alert("Please enter a notification topic first.");
			return;
		}

		setTestLoading(true);
		try {
			await testNotificationAction(topic);
			alert("Test notification sent! Check your device.");
		} catch (error) {
			console.error(error);
			alert("Failed to send test notification.");
		} finally {
			setTestLoading(false);
		}
	};

	return (
		<div className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-100">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold text-gray-800">
					{isEditing ? "Edit Monitor" : "Add New Monitor"}
				</h2>
				{isEditing && onCancel && (
					<button
						onClick={onCancel}
						type="button"
						className="text-gray-500 hover:text-gray-700"
					>
						Cancel
					</button>
				)}
			</div>
			<form
				onSubmit={handleSubmit}
				className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end"
			>
				<div className="lg:col-span-2">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						URL
					</label>
					<input
						name="url"
						type="url"
						required
						defaultValue={monitor?.url}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
						placeholder="https://example.com"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						CSS Selector (Optional)
					</label>
					<input
						name="selector"
						type="text"
						defaultValue={monitor?.selector || ""}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
						placeholder=".content, #price"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Interval (seconds)
					</label>
					<input
						name="interval"
						type="number"
						required
						min="5"
						defaultValue={monitor?.interval || 60}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
					/>
				</div>

				{/* Advanced Wait Settings */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Wait Strategy
					</label>
					<select
						name="wait_until"
						defaultValue={monitor?.wait_until || "networkidle2"}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
					>
						<option value="load">Load</option>
						<option value="domcontentloaded">DOM Content Loaded</option>
						<option value="networkidle0">Network Idle 0</option>
						<option value="networkidle2">Network Idle 2 (Default)</option>
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Wait for Selector (Optional)
					</label>
					<input
						name="wait_for_selector"
						type="text"
						defaultValue={monitor?.wait_for_selector || ""}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
						placeholder="#loading-finished, .main-content"
					/>
					<p className="text-xs text-gray-500 mt-1">
						Wait until this element appears before checking.
					</p>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Wait Delay (ms)
					</label>
					<input
						name="wait_delay"
						type="number"
						min="0"
						defaultValue={monitor?.wait_delay ?? 10000}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
						placeholder="10000"
					/>
				</div>

				{/* Notification Fields */}
				<div className="lg:col-span-2">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Notification Topic (ntfy.sh)
					</label>
					<div className="flex gap-2">
						<input
							name="notification_topic"
							type="text"
							value={topic}
							onChange={(e) => setTopic(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
							placeholder="e.g. my-secret-topic-123"
						/>
						<button
							type="button"
							onClick={handleTestNotification}
							disabled={testLoading || !topic}
							className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-md border border-gray-300 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
						>
							{testLoading ? "Sending..." : "Test"}
						</button>
					</div>
					<p className="text-xs text-gray-500 mt-1">
						Subscribe at{" "}
						<a
							href="https://ntfy.sh"
							target="_blank"
							rel="noreferrer"
							className="text-blue-500 underline"
						>
							ntfy.sh
						</a>{" "}
						using this topic name.
					</p>
				</div>
				<div className="lg:col-span-2">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Notification Message Template
					</label>
					<input
						name="notification_template"
						type="text"
						defaultValue={
							monitor?.notification_template || "Change detected on {url}!"
						}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
						placeholder="Change detected on {url}!"
					/>
					<p className="text-xs text-gray-500 mt-1">
						Supported placeholders: {"{url}"}, {"{selector}"}, {"{time}"}
					</p>
				</div>

				{/* Trigger Fields */}
				<div className="lg:col-span-2">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Trigger Condition
					</label>
					<select
						name="trigger_type"
						value={triggerType}
						onChange={(e) => setTriggerType(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
					>
						<option value="change">Any Change (Default)</option>
						<option value="contains">Contains Text</option>
						<option value="missing">Missing Text</option>
					</select>
				</div>
				{triggerType !== "change" && (
					<div className="lg:col-span-2">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Trigger Text
						</label>
						<input
							name="trigger_text"
							type="text"
							required
							defaultValue={monitor?.trigger_text || ""}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
							placeholder={
								triggerType === "contains"
									? "Alert when this text appears"
									: "Alert when this text disappears"
							}
						/>
					</div>
				)}

				{/* Headers Field */}
				<div className="lg:col-span-4">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Custom Headers (JSON)
					</label>
					<textarea
						name="headers"
						rows={3}
						defaultValue={monitor?.headers || ""}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black font-mono text-sm"
						placeholder='{"User-Agent": "MyCustomBot/1.0", "Cookie": "session=123"}'
					/>
					<p className="text-xs text-gray-500 mt-1">
						Use this to bypass 403 errors. You can copy your browser's headers
						here.
					</p>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="lg:col-span-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium mt-4"
				>
					{loading
						? isEditing
							? "Updating..."
							: "Adding..."
						: isEditing
							? "Update Monitor"
							: "Start Monitoring"}
				</button>
			</form>
		</div>
	);
}
