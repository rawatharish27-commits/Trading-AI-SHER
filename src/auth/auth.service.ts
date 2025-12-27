import { signToken } from "./jwt";

export function loginUser(user: any) {
  return signToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role
  });
}
