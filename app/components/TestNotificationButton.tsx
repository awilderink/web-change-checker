"use client";

import { useState } from "react";
import { testNotificationAction } from "@/app/test-notification-action";

export default function TestNotificationButton({ topic }: { topic: string }) {
	const [loading, setLoading] = useState(false);

	const handleTest = async () => {
		if (!topic) {
			alert("Please enter a notification topic first.");
			return;
		}

		setLoading(true);
		try {
			await testNotificationAction(topic);
			alert("Test notification sent! Check your device.");
		} catch (error) {
			console.error(error);
			alert("Failed to send test notification.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleTest}
			disabled={loading || !topic}
			className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-2 py-1 rounded transition-colors disabled:opacity-50 mt-1"
		>
			{loading ? "Sending..." : "Test Notification"}
		</button>
	);
}
