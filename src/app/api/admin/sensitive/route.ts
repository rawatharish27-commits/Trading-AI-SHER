import { NextResponse, headers } from "next/server";
import { verifyToken } from "@/auth/jwt";
import { requireRole } from "@/auth/roleGuard";
import { Role } from "@/auth/roles";

export async function GET() {
  try {
    const token = headers().get("authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");

    const decoded = verifyToken(token);

    // Admin-only endpoint
    requireRole(decoded.role, [Role.ADMIN]);

    // Admin logic here
    const sensitiveData = {
      totalUsers: 2450,
      totalRevenue: 156000,
      systemHealth: "STABLE",
      lastDeployment: "2025-01-15"
    };

    return NextResponse.json(sensitiveData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Forbidden" },
      { status: error.message === "Unauthorized" ? 401 : 403 }
    );
  }
}
