
import React, { createContext, useContext, useEffect, useState } from 'react';
import { TenantConfig } from '../types';
import { TenantService } from '../lib/services/tenantService';

const TenantContext = createContext<TenantConfig | null>(null);

export const TenantBrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantConfig>(TenantService.resolve());

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', tenant.theme.accent);
    root.style.setProperty('--color-bg', tenant.theme.bg);
    root.style.setProperty('--color-primary', tenant.theme.primary);
    
    // Update Document Meta
    document.title = `${tenant.name} | Institutional Trading Node`;
  }, [tenant]);

  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
