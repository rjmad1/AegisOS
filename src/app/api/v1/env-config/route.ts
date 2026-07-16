import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Helper to parse key-value pairs from .env contents
function parseEnvString(content: string): Record<string, string> {
  const values: Record<string, string> = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index > 0) {
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      // Remove surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      values[key] = val.replace(/\\"/g, '"'); // Unescape quotes
    }
  }
  return values;
}

// Helper to format key-value pairs securely for writing to .env
function formatEnvLine(key: string, value: string): string {
  // If value contains spaces, comments, quotes, or special characters, wrap it in double quotes
  const needsQuotes = /[\s#"'\\$]/.test(value);
  if (needsQuotes) {
    const escaped = value.replace(/"/g, '\\"');
    return `${key}="${escaped}"`;
  }
  return `${key}=${value}`;
}

export async function GET(request: NextRequest) {
  try {
    const examplePath = path.resolve(process.cwd(), ".env.example");
    const envPath = path.resolve(process.cwd(), ".env");

    if (!fs.existsSync(examplePath)) {
      return NextResponse.json({ error: ".env.example not found" }, { status: 404 });
    }

    // Read active variables in .env
    let envValues: Record<string, string> = {};
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envValues = parseEnvString(envContent);
    }

    // Parse .env.example line-by-line
    const exampleContent = fs.readFileSync(examplePath, "utf-8");
    const lines = exampleContent.split(/\r?\n/);
    
    const sections: Array<{
      name: string;
      variables: Array<{
        key: string;
        defaultValue: string;
        currentValue: string;
        description: string;
      }>;
    }> = [];

    let currentSection = "General Settings";
    let currentComments: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for section dividers
      // # -----------------------------------------------------------------------------
      // # Section Name
      // # -----------------------------------------------------------------------------
      if (line.startsWith("# ---") && i + 2 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const afterNextLine = lines[i + 2].trim();
        if (nextLine.startsWith("#") && afterNextLine.startsWith("# ---")) {
          currentSection = nextLine.substring(1).trim();
          i += 2; // Skip divider lines
          currentComments = [];
          continue;
        }
      }

      if (line.startsWith("#")) {
        // Skip global header decorations
        if (line.startsWith("# ===")) continue;
        if (line.includes("Copy this file to") || line.includes("NEVER commit") || line.includes("All values below are PLACEHOLDERS")) continue;
        
        currentComments.push(line.substring(1).trim());
      } else if (line.includes("=")) {
        const index = line.indexOf("=");
        const key = line.substring(0, index).trim();
        let defaultValue = line.substring(index + 1).trim();
        if ((defaultValue.startsWith('"') && defaultValue.endsWith('"')) || (defaultValue.startsWith("'") && defaultValue.endsWith("'"))) {
          defaultValue = defaultValue.substring(1, defaultValue.length - 1);
        }

        const description = currentComments.join(" ");
        const currentValue = envValues[key] !== undefined ? envValues[key] : defaultValue;

        let sectionObj = sections.find(s => s.name === currentSection);
        if (!sectionObj) {
          sectionObj = { name: currentSection, variables: [] };
          sections.push(sectionObj);
        }
        sectionObj.variables.push({
          key,
          defaultValue,
          currentValue,
          description
        });

        currentComments = [];
      } else if (line === "") {
        currentComments = [];
      }
    }

    const response = NextResponse.json({ sections });
    // Enable CORS for local file:// execution to support direct local static HTML workflows
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedValues = body.variables;

    if (!updatedValues || typeof updatedValues !== "object") {
      return NextResponse.json({ error: "Invalid payload. Expected 'variables' object." }, { status: 400 });
    }

    const examplePath = path.resolve(process.cwd(), ".env.example");
    const envPath = path.resolve(process.cwd(), ".env");

    if (!fs.existsSync(examplePath)) {
      return NextResponse.json({ error: ".env.example template not found" }, { status: 404 });
    }

    // Read active values to preserve any vars not defined in .env.example
    let envValues: Record<string, string> = {};
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envValues = parseEnvString(envContent);
    }

    // Combine active values, example defaults, and user updates
    const mergedValues = {
      ...envValues,
      ...updatedValues
    };

    // Reconstruct .env file using .env.example as the layout skeleton
    const exampleContent = fs.readFileSync(examplePath, "utf-8");
    const lines = exampleContent.split(/\r?\n/);
    const outputLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("#") && trimmed.includes("=")) {
        const index = trimmed.indexOf("=");
        const key = trimmed.substring(0, index).trim();
        
        if (mergedValues[key] !== undefined) {
          outputLines.push(formatEnvLine(key, mergedValues[key]));
        } else {
          outputLines.push(line); // Keep example declaration as-is
        }
      } else {
        outputLines.push(line); // Keep comments, headers, spacing intact
      }
    }

    // Write back to .env
    fs.writeFileSync(envPath, outputLines.join("\n"), "utf-8");

    const response = NextResponse.json({ success: true, message: "Environment variables saved successfully" });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// CORS Preflight handler
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
