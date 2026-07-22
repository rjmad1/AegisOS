import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action !== 'init' && action !== 'qualify') {
      return NextResponse.json({ error: "Invalid action. Supported: init, qualify." }, { status: 400 });
    }

    const scriptPath = path.resolve(process.cwd(), 'automation', 'Developer.ps1');
    const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Action "${action}"`;

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
