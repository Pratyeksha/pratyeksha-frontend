import { useEffect, useState } from 'react';
import { getPublicSettings, resolveTenantId } from './api';

// Per-tenant display name, fetched once per tenant and cached, so every screen shows the
// restaurant that owns the workspace instead of a fixed brand.
const cache = new Map();

export function useTenantName() {
  const tenantId = resolveTenantId();
  const [name, setName] = useState(() => cache.get(tenantId) || '');
  useEffect(() => {
    if (!tenantId) return undefined;
    if (cache.has(tenantId)) { setName(cache.get(tenantId)); return undefined; }
    let alive = true;
    getPublicSettings()
      .then(({ data }) => { const n = String(data?.name || '').trim(); cache.set(tenantId, n); if (alive) setName(n); })
      .catch(() => {});
    return () => { alive = false; };
  }, [tenantId]);
  return name;
}
