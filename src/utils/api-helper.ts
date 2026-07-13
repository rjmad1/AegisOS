import { NextResponse } from "next/server";
import * as crypto from "crypto";
import { PlatformError } from "./errors";

export function handleCaching(request: Request, data: unknown): NextResponse {
  const body = JSON.stringify(data);
  const etag = `"${crypto.createHash("md5").update(body).digest("hex")}"`;

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, max-age=5"
      }
    });
  }

  // Next.js NextResponse.json clones the data, so we construct the JSON response directly
  const response = NextResponse.json(data);
  response.headers.set("ETag", etag);
  response.headers.set("Cache-Control", "public, max-age=5");
  return response;
}

export function formatErrorResponse(err: unknown): NextResponse {
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred.";
  let correlationId = `err-${Math.random().toString(36).substring(2, 8)}`;
  let timestamp = new Date().toISOString();
  let context: Record<string, unknown> | undefined = undefined;

  if (err instanceof PlatformError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    correlationId = err.correlationId;
    timestamp = err.timestamp;
    context = err.context;
  } else if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === "string") {
    message = err;
  }

  console.error(`[API Error] [Code: ${code}] [ID: ${correlationId}] Message: ${message}`, err);

  return NextResponse.json(
    {
      error: message,
      code,
      correlationId,
      timestamp,
      context
    },
    { status: statusCode }
  );
}
