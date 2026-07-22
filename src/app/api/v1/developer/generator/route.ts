import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, name } = body;

    if (type !== 'scaffold-provider' && type !== 'scaffold-connector') {
      return NextResponse.json({ error: "Invalid type. Supported: scaffold-provider, scaffold-connector." }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id." }, { status: 400 });
    }

    const scriptPath = path.resolve(process.cwd(), 'automation', 'Developer.ps1');
    const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Action "${type}" -TargetId "${id}" -TargetName "${name || id}"`;

    return new Promise<Response>((resolve) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve(NextResponse.json({ success: false, error: error.message, stderr }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ success: true, stdout }));
        }
      });
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
