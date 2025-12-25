
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: "Access Denied: Admin clearance required." }, { status: 403 });
  }

  try {
    const { population } = await req.json();

    // Call Python Scheduler
    const pythonProcess = spawn("python3", ["-m", "sher.backtest.scheduler"]);
    
    const result = await new Promise<any>((resolve, reject) => {
      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `Exited with code ${code}`));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error("Failed to parse evolution output"));
        }
      });

      pythonProcess.stdin.write(JSON.stringify(population));
      pythonProcess.stdin.end();
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
