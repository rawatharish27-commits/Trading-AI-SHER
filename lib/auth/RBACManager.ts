import { UserRole } from '../../types';
import { Permission, RolePolicy } from '../compliance/types';

/**
 * 🔐 RBAC MANAGER
 * Goal: Zero-Trust permission sharding.
 */
export class RBACManager {
  private static readonly POLICIES: Record<UserRole, RolePolicy> = {
    [UserRole.ADMIN]: {
      role: UserRole.ADMIN,
      permissions: ['EXECUTE_TRADE', 'MODIFY_STRATEGY', 'VIEW_AUDIT', 'TOGGLE_KILL_SWITCH', 'ACCESS_SANDBOX'],
      capitalLimit: Infinity
    },
    [UserRole.TRADER]: {
      role: UserRole.TRADER,
      permissions: ['EXECUTE_TRADE', 'ACCESS_SANDBOX'],
      capitalLimit: 1000000
    },
    [UserRole.VIEWER]: {
      role: UserRole.VIEWER,
      permissions: ['VIEW_AUDIT'],
      capitalLimit: 0
    },
    [UserRole.TENANT_OWNER]: {
      role: UserRole.TENANT_OWNER,
      permissions: ['VIEW_AUDIT', 'ACCESS_SANDBOX'],
      capitalLimit: 0
    }
  };

  static can(role: UserRole, permission: Permission): boolean {
    return this.POLICIES[role]?.permissions.includes(permission) || false;
  }

  static getLimit(role: UserRole): number {
    return this.POLICIES[role]?.capitalLimit || 0;
  }
}