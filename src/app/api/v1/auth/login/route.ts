import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const expectedUsername = process.env.OPS_ADMIN_USERNAME || "admin";
    const expectedPassword = process.env.OPS_ADMIN_PASSWORD || "AdminPassword123!";

    if (username === expectedUsername && password === expectedPassword) {
      const mockUser = {
        id: "usr-admin-01",
        username: expectedUsername,
        email: "admin@ai-ops.local",
        role: "admin",
      };
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockTokenForAdminConsole";

      return NextResponse.json({
        user: mockUser,
        token: mockToken,
      });
    }

    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "Invalid request payload" },
      { status: 400 }
    );
  }
}
