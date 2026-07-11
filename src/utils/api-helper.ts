import { NextResponse } from "next/server";
import * as crypto from "crypto";

export function handleCaching(request: Request, data: any): NextResponse {
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
