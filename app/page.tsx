import { getMonitors } from "@/lib/db";
import AutoRefresh from "./components/AutoRefresh";
import MonitorForm from "./components/MonitorForm";
import MonitorItem from "./components/MonitorItem";

export const dynamic = "force-dynamic";

// This is now a Server Component
export default async function Home() {
	// Fetch data directly from the DB on the server
	const monitors = getMonitors();

	return (
		<div className="min-h-screen bg-gray-50 p-8 font-sans">
			<AutoRefresh />
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold mb-8 text-gray-900">
					Web Change Checker
				</h1>

				<MonitorForm />

				{/* Monitors List */}
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h2 className="text-xl font-semibold text-gray-800">
							Active Monitors
						</h2>
						<span className="text-xs text-gray-400">
							Auto-refreshing (Last: {new Date().toLocaleTimeString()})
						</span>
					</div>
					{monitors.length === 0 ? (
						<p className="text-gray-500 text-center py-8">
							No monitors active. Add one above!
						</p>
					) : (
						monitors.map((monitor) => (
							<MonitorItem key={monitor.id} monitor={monitor} />
						))
					)}
				</div>
			</div>
		</div>
	);
}
