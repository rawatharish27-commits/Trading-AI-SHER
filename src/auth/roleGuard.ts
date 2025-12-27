import { Role } from "./roles";

export function requireRole(
  userRole: Role,
  allowed: Role[]
) {
  if (!allowed.includes(userRole)) {
    throw new Error("Forbidden: Role not authorized");
  }
}
