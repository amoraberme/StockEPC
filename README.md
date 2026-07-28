# StockEPC — MG Solar EPC Hardware Inventory & Dispatch System

Offline Balance of System (BOS) inventory control, dispatch checklist verification, and local document parsing system for Solar EPC operations.

## Capabilities

- **Row-Level Security (RLS) Tenant Isolation**: Direct Supabase multi-tenant data sync with isolated security policies (`inventory_items`, `audit_logs`, `profiles`).
- **Inventory & Dispatch Control**: Full tracking of solar hardware, serial numbers, technical specs, and stock levels.
- **Offline Template Engine**: Gate pass parser and outgoing material checklist generator.

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the application locally:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:3000`

## Deployment

Configured for Vercel deployment via `vercel.json` with SPA routing and environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
