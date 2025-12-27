import jwt from "jsonwebtoken";
import { Role } from "./roles";

const SECRET = process.env.JWT_SECRET!;

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: Role;
}

export function signToken(payload: any) {
  return jwt.sign(payload, SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as AuthPayload;
}
