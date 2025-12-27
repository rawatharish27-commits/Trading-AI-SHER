import { getMetrics } from "./metrics";
import { getRevenue } from "./revenue";

export async function adminDashboard() {
  return {
    metrics: await getMetrics(),
    revenue: await getRevenue()
  };
}
