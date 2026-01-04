"use client";

import { useState } from "react";
import DeleteButton from "./DeleteButton";
import MonitorForm from "./MonitorForm";

// Define type here or import from db/types
type Monitor = {
	id: number;
	url: string;
	selector: string | null;
	interval: number;
	last_hash: string | null;
	last_checked: number | null;
	notification_topic: string | null;
	notification_template: string | null;
	headers: string | null;
	last_screenshot: string | null;
	trigger_type: string | null;
	trigger_text: string | null;
	wait_until: string | null;
	wait_delay: number | null;
	wait_for_selector: string | null;
	status: string | null;
	last_error: string | null;
};

export default function MonitorItem({ monitor }: { monitor: Monitor }) {
	const [isEditing, setIsEditing] = useState(false);

	if (isEditing) {
		return (
			<MonitorForm
				monitor={monitor}
				onSuccess={() => setIsEditing(false)}
				onCancel={() => setIsEditing(false)}
			/>
		);
	}

	return (
		<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
			<div className="space-y-2 flex-1 w-full">
				<div className="flex items-center gap-2">
					<h3 className="font-medium text-lg text-blue-600 truncate max-w-md">
						{monitor.url}
					</h3>
					{monitor.status === "error" && (
						<span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold">
							ERROR
						</span>
					)}
					{monitor.status === "checking" && (
						<span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-bold animate-pulse">
							CHECKING...
						</span>
					)}
					{monitor.selector && (
						<span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
							{monitor.selector}
						</span>
					)}
				</div>
				{monitor.status === "error" && monitor.last_error && (
					<div className="text-xs text-red-500 mt-1">
						Last Error: {monitor.last_error}
					</div>
				)}
				<div className="text-sm text-gray-500">
					Checking every {monitor.interval}s • Last checked:{" "}
					<span suppressHydrationWarning>
						{monitor.last_checked
							? new Date(monitor.last_checked).toLocaleTimeString()
							: "Never"}
					</span>
				</div>
				{monitor.notification_topic && (
					<div className="text-xs text-gray-400">
						Notifying: {monitor.notification_topic}
					</div>
				)}

				{/* Screenshot Preview */}
				{monitor.last_screenshot && (
					<div className="mt-2">
						<details className="text-xs text-gray-500">
							<summary className="cursor-pointer hover:text-gray-700">
								View Latest Screenshot
							</summary>
							<div className="mt-2 border rounded overflow-hidden">
								<a
									href={`/api/screenshots/${monitor.last_screenshot}?t=${monitor.last_checked}`}
									target="_blank"
									rel="noreferrer"
								>
									{/* biome-ignore lint/performance/noImgElement: Screenshots have variable dimensions */}
									<img
										src={`/api/screenshots/${monitor.last_screenshot}?t=${monitor.last_checked}`}
										alt={`Screenshot of ${monitor.url}`}
										className="w-full max-w-sm h-auto object-cover hover:opacity-90 transition-opacity"
									/>
								</a>
							</div>
						</details>
					</div>
				)}
			</div>
			<div className="flex items-center gap-4">
				<button
					type="button"
					onClick={() => setIsEditing(true)}
					className="text-blue-500 hover:text-blue-700 font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
				>
					Edit
				</button>
				<DeleteButton id={monitor.id} />
			</div>
		</div>
	);
}
