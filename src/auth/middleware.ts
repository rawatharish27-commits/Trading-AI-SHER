import { verifyToken } from "./jwt";

export function requireAuth(req: any) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Unauthorized");

  return verifyToken(token);
}
