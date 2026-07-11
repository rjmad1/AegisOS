import { NextRequest, NextResponse } from "next/server";
import { jobQueue } from "@/infrastructure/jobs/job-queue";
import { TaskStatus, Priority } from "@/api/types/background-processing";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || undefined;
    const status = (searchParams.get("status") as TaskStatus) || undefined;
    const name = searchParams.get("name") || undefined;

    if (id) {
      const job = await jobQueue.getJob(id);
      if (!job) {
        return NextResponse.json({ error: `Job with ID ${id} not found` }, { status: 404 });
      }
      return NextResponse.json(job);
    }

    const filter = status || name ? { status, name } : undefined;
    const jobs = await jobQueue.getJobs(filter);
    return NextResponse.json(jobs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, payload, priority, retryPolicy } = body;

    if (!name) {
      return NextResponse.json({ error: "Missing required parameter: name" }, { status: 400 });
    }

    const job = await jobQueue.add(name, payload || {}, {
      priority: priority as Priority,
      retryPolicy
    });

    return NextResponse.json(job, { status: 202 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required query parameter: id" }, { status: 400 });
    }

    const success = await jobQueue.cancelJob(id);
    if (!success) {
      return NextResponse.json({ error: `Job with ID ${id} could not be cancelled or is not in a cancellable state` }, { status: 400 });
    }

    return NextResponse.json({
      jobId: id,
      success: true,
      message: `Job ${id} cancelled successfully`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
