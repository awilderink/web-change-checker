import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,
	serverExternalPackages: [
		"bun:sqlite",
		"puppeteer-core",
		"puppeteer-real-browser",
	],
	turbopack: {
		resolveAlias: {
			"bun:sqlite": "bun:sqlite",
		},
	},
};

export default nextConfig;
