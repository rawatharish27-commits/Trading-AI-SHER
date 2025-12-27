import { prisma } from "@/storage/client";

export async function getMetrics() {
  const trades = await prisma.tradeSignal.count();
  const users = await prisma.user.count();

  return {
    totalUsers: users,
    totalSignals: trades,
    systemHealth: "STABLE"
  };
}
