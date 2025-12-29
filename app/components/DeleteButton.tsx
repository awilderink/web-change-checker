"use client";

import { useState } from "react";
import { deleteMonitorAction } from "@/app/actions";

export default function DeleteButton({ id }: { id: number }) {
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		if (!confirm("Are you sure?")) return;
		setLoading(true);
		try {
			await deleteMonitorAction(id);
		} catch (error) {
			console.error(error);
			alert("Failed to delete monitor");
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleDelete}
			disabled={loading}
			className="text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
		>
			{loading ? "Deleting..." : "Delete"}
		</button>
	);
}
