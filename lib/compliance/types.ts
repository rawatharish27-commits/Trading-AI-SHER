import { UserRole } from '../../types';

export type Permission = 'EXECUTE_TRADE' | 'MODIFY_STRATEGY' | 'VIEW_AUDIT' | 'TOGGLE_KILL_SWITCH' | 'ACCESS_SANDBOX';

export interface RolePolicy {
  role: UserRole;
  permissions: Permission[];
  capitalLimit: number;
}

export interface ConsentRecord {
  userId: string;
  timestamp: number;
  policyVersion: string;
  ipShard: string;
  fingerprint: string;
}

export interface AuditHashShard {
  prevHash: string;
  currentHash: string;
  data: any;
  timestamp: number;
}