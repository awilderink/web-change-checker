"use server";

export async function testNotificationAction(topic: string) {
	if (!topic) {
		throw new Error("Topic is required");
	}

	try {
		await fetch(`https://ntfy.sh/${topic}`, {
			method: "POST",
			body: "This is a test notification from Web Change Checker! 🚀",
			headers: {
				Title: "Test Notification",
				Priority: "high",
				Tags: "tada",
			},
		});
		return { success: true };
	} catch (error) {
		console.error("Failed to send test notification:", error);
		throw new Error("Failed to send notification");
	}
}
