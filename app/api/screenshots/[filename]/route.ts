import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ filename: string }> },
) {
	const { filename } = await params;

	// Security: Prevent directory traversal
	const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "");

	if (!sanitizedFilename.endsWith(".png")) {
		return new NextResponse("Invalid file type", { status: 400 });
	}

	const filePath = join(process.cwd(), "data", "screenshots", sanitizedFilename);

	if (!existsSync(filePath)) {
		return new NextResponse("File not found", { status: 404 });
	}

	const fileBuffer = readFileSync(filePath);

	return new NextResponse(fileBuffer, {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
			"Pragma": "no-cache",
			"Expires": "0",
		},
	});
}
