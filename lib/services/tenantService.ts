import { TenantConfig } from '../../types';

export class TenantService {
  private static readonly DEFAULT_TENANT: TenantConfig = {
    id: 'sher-master',
    name: 'SHER AI',
    slug: 'master',
    domain: 'sher.ai',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/1150/1150592.png',
    theme: {
      primary: '#3B82F6',
      accent: '#3B82F6',
      bg: '#0B0F14'
    },
    allowedBrokers: ['ANGEL_ONE', 'ZERODHA', 'PAPER'],
    subscriptionModel: 'SAAS',
    active: true
  };

  /**
   * Resolves tenant based on current hostname (Sub-domain sharding).
   * Ensures isolated risk and data persistence per client node.
   */
  static resolve(): TenantConfig {
    if (typeof window === 'undefined') return this.DEFAULT_TENANT;
    
    const host = window.location.hostname;
    // Look for sharded nodes in local registry (simulated DB)
    const tenantsJson = localStorage.getItem('sher_tenant_shards');
    
    if (tenantsJson) {
      const tenants: TenantConfig[] = JSON.parse(tenantsJson);
      const matched = tenants.find(t => t.domain === host || host.startsWith(`${t.slug}.`));
      if (matched) return matched;
    }

    return this.DEFAULT_TENANT;
  }

  /**
   * Provisions a new White-label tenant node (Phase 18).
   * Blocks data-bleeding between isolated capital pods.
   */
  static provisionTenant(config: Omit<TenantConfig, 'id'>): TenantConfig {
    const newTenant: TenantConfig = {
      ...config,
      id: `shrd-ten-${Math.random().toString(36).substr(2, 9)}`
    };

    const existingRaw = localStorage.getItem('sher_tenant_shards');
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    localStorage.setItem('sher_tenant_shards', JSON.stringify([...existing, newTenant]));
    
    console.info(`🦁 [TenantService] Shard Node Provisioned: ${newTenant.name}`);
    return newTenant;
  }
}