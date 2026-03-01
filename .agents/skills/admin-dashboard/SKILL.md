---
name: admin-dashboard
description: Extend and modify the admin dashboard, developer portal, and operations console. Use when adding new admin tabs, metrics, monitoring features, or internal tools. Activates for dashboard development, analytics, user management, and internal tooling.
allowed-tools: Read,Write,Edit,Bash(npm:*,npx:*)
category: Productivity & Meta
tags:
  - dashboard
  - admin
  - internal-tools
---

# Admin & Developer Suite Development

This skill helps you extend the admin dashboard and build internal tools following the established patterns.

## Architecture Overview

```
/admin     - Admin Dashboard (user metrics, access control, audit)
/dev       - Developer Portal (docs, code browser, feature map) [PLANNED]
/ops       - Operations Console (infrastructure, logs, incidents) [PLANNED]
```

See `docs/ADMIN-DEVELOPER-SUITE.md` for the full design specification.

## Current Admin Dashboard Structure

Location: `src/app/admin/page.tsx`

### Existing Tabs

| Tab | Purpose | Data Source |
|-----|---------|-------------|
| Overview | Quick stats (users, check-ins, messages) | `/api/admin/stats` |
| Funnel | User engagement waterfall | `/api/admin/stats` |
| Page Views | Analytics by page path | `/api/admin/stats` |
| Users | User roster with activity | `/api/admin/stats` |
| Access Requests | Pending/approved/denied requests | `/api/admin/access-requests` |
| Allowed Emails | Email whitelist management | `/api/admin/allowed-emails` |
| Email Templates | Preview system emails | Local data |

### Planned Tabs (from design)

| Tab | Purpose | Status |
|-----|---------|--------|
| Production Health | API latency, Core Web Vitals | Pending |
| Error Tracking | HIPAA-safe error aggregation | Pending |
| External Services | Anthropic, DB, Push status | Pending |
| AI Analytics | Conversation metrics, tokens | Pending |
| Audit Logs | HIPAA compliance viewer | Pending |

### Recently Implemented Features ✅

| Feature | Component | Status |
|---------|-----------|--------|
| Auto-refresh Stats | `dashboard-stats.tsx` | ✅ Implemented |
| Dashboard Charts | `dashboard-charts.tsx` | ✅ Implemented |
| Advanced Filters | `dashboard-filters.tsx` | ✅ Implemented |
| Data Export | `dashboard-export.tsx` | ✅ Implemented |
| Real-time Updates | Auto-refresh every 30s | ✅ Implemented |

## Adding a New Admin Tab

### 1. Create the Tab Content Component

```typescript
// In src/app/admin/page.tsx, add a new tab component

function ProductionHealthTab() {
  const [metrics, setMetrics] = useState<APIMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      setMetrics(data);
      setLoading(false);
    }
    fetchMetrics();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Uptime" value={metrics.uptime} />
        <StatCard label="Avg Latency" value={`${metrics.avgLatency}ms`} />
        <StatCard label="Errors (24h)" value={metrics.errorCount} />
        <StatCard label="Active Users" value={metrics.activeUsers} />
      </div>
      {/* More content */}
    </div>
  );
}
```

### 2. Add the Tab to the Tab List

```typescript
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'health', label: 'Production Health' }, // NEW
  { id: 'funnel', label: 'Funnel' },
  // ...
];
```

### 3. Add the Tab Content Renderer

```typescript
function renderTabContent(tabId: string) {
  switch (tabId) {
    case 'overview':
      return <OverviewTab stats={stats} />;
    case 'health':
      return <ProductionHealthTab />; // NEW
    // ...
  }
}
```

## Creating Admin API Endpoints

### Pattern: Admin Stats Endpoint

```typescript
// src/app/api/admin/metrics/route.ts
import { requireAdmin } from '@/db/secure-db';
import { createRateLimiter } from '@/lib/rate-limit';
import { logAdminAction } from '@/lib/hipaa/audit';

const rateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 60,
  keyPrefix: 'admin:metrics'
});

export async function GET(request: Request) {
  // 1. Check admin access
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Apply rate limiting
  const rateLimitResult = await rateLimiter.check(admin.id);
  if (!rateLimitResult.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  // 3. Log admin action
  await logAdminAction(
    admin.id,
    AuditAction.ADMIN_STATS_VIEW,
    'metrics',
    null
  );

  // 4. Fetch and return data
  const metrics = await getAPIMetrics();
  return Response.json(metrics);
}
```

## Key Patterns

### StatCard Component

```typescript
function StatCard({
  label,
  value,
  trend,
  status
}: {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'good' | 'warning' | 'error';
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && <TrendIndicator direction={trend} />}
      {status && <StatusBadge status={status} />}
    </div>
  );
}
```

### Data Fetching Pattern

```typescript
// Use SWR or React Query for real-time updates
import useSWR from 'swr';

function useAdminMetrics() {
  const { data, error, isLoading } = useSWR(
    '/api/admin/metrics',
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30s
  );

  return { metrics: data, error, isLoading };
}
```

### HIPAA-Safe Error Display

```typescript
// Never show user-specific error details
function ErrorList({ errors }: { errors: AggregatedError[] }) {
  return (
    <div>
      {errors.map(error => (
        <div key={error.hash}>
          <span className="font-mono">{error.type}</span>
          <span>{error.path}</span>
          <span>{error.count} occurrences</span>
          <span>{error.affectedUsers} users</span>
          {/* NO user IDs, NO error messages with PHI */}
        </div>
      ))}
    </div>
  );
}
```

## Database Tables for Admin Features

Existing tables:
- `adminUsers` - Admin role assignments
- `allowedEmails` - Email whitelist
- `accessRequests` - Access request queue
- `auditLog` - HIPAA audit trail
- `pageViews` - Navigation analytics

Planned tables (from design):
- `api_metrics` - API timing data
- `app_errors` - Aggregated errors
- `service_health` - External service status
- `conversation_analytics` - AI chat metadata
- `incidents` - Incident tracking

## Access Control

```typescript
// Always use requireAdmin() for admin routes
import { requireAdmin } from '@/db/secure-db';

// For super-admin only features
const admin = await requireAdmin();
if (admin.role !== 'super_admin') {
  return Response.json({ error: 'Super admin required' }, { status: 403 });
}
```

## Testing Admin Features

```typescript
// Mock admin authentication for tests
vi.mock('@/db/secure-db', () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    id: 'test-admin',
    role: 'admin'
  })
}));

describe('Admin Metrics Endpoint', () => {
  it('returns metrics for authenticated admin', async () => {
    const response = await GET(mockRequest);
    expect(response.status).toBe(200);
  });

  it('returns 403 for non-admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(null);
    const response = await GET(mockRequest);
    expect(response.status).toBe(403);
  });
});
```

## New Dashboard Features

### Dashboard Charts

Use the `DashboardCharts` component to display data visualizations:

```typescript
import { DashboardCharts } from '@/components/admin/dashboard-charts'

// In your dashboard page
<Suspense fallback={<CardLoading />}>
  <DashboardCharts />
</Suspense>
```

The component automatically fetches data from `/api/dashboard/charts` and displays:
- Line chart: Order trends (last 7 days)
- Pie chart: Orders by status
- Bar chart: Orders by city (top 10)
- Bar chart: Monthly revenue (last 6 months)

### Advanced Filters

Implement filtering with the `DashboardFilters` component:

```typescript
import { DashboardFilters } from '@/components/admin/dashboard-filters'

const [filters, setFilters] = useState({})

<DashboardFilters
  onFilterChange={setFilters}
  ciudades={['Bogotá', 'Medellín', 'Cali']}
  tecnicos={[
    { id: '1', nombre: 'Juan Pérez' },
    { id: '2', nombre: 'María García' }
  ]}
/>
```

Available filters:
- Order status
- Urgency level
- City
- Date range (start/end)
- Assigned technician

### Data Export

Add export functionality with the `ExportButton` component:

```typescript
import { ExportButton, DashboardActions } from '@/components/admin/dashboard-export'

// Single export button
<ExportButton type="stats" filters={currentFilters} />

// Multiple export buttons
<DashboardActions />
```

Export types:
- `stats` - Dashboard statistics
- `orders` - Service orders
- `technicians` - Technician data
- `full-report` - Complete system report

Supported formats:
- CSV (Excel compatible)
- Excel (.xlsx)
- PDF

### Auto-refresh Stats

The `DashboardStats` component now includes:
- Auto-refresh every 30 seconds
- Manual refresh button
- Last update indicator
- Error handling with fallback data

```typescript
// Auto-refresh is automatic, no configuration needed
<DashboardStats />
```

## Design Resources

- Full design spec: `docs/ADMIN-DEVELOPER-SUITE.md`
- Design system: Use existing components from `src/components/ui/`
- Colors: Follow therapeutic palette (navy, teal, coral, cream)
