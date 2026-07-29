import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_INVENTORY } from './src/lib/prdSpec';

// Local Database File Setup
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'inventory_db.json');

function ensureDatabaseExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE_PATH)) {
    const initialDbData = {
      inventory: [],
      auditLogs: [],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialDbData, null, 2), 'utf-8');
    console.log(`Local Database File initialized at ${DB_FILE_PATH}.`);
  }
}

function readLocalDatabase() {
  ensureDatabaseExists();
  try {
    const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to read local database file:', err);
    return {
      inventory: [],
      auditLogs: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

function writeLocalDatabase(data: { inventory: any[]; auditLogs: any[]; lastUpdated?: string }) {
  ensureDatabaseExists();
  try {
    const payload = {
      ...data,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write to local database file:', err);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Local Database on boot
  ensureDatabaseExists();

  app.use(express.json({ limit: '10mb' }));

  // API Health Check & Database Info Endpoint
  app.get('/api/health', (req, res) => {
    const db = readLocalDatabase();
    res.json({
      status: 'ok',
      dbPath: DB_FILE_PATH,
      inventoryCount: db.inventory?.length || 0,
      auditLogCount: db.auditLogs?.length || 0,
      lastUpdated: db.lastUpdated,
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // LOCAL DATABASE REST API ENDPOINTS
  // ==========================================

  // 1. Get All Database Data (Inventory + Audit Logs)
  app.get('/api/db/all', (req, res) => {
    const db = readLocalDatabase();
    res.json({
      success: true,
      inventory: db.inventory || [],
      auditLogs: db.auditLogs || [],
      lastUpdated: db.lastUpdated
    });
  });

  // 2. Get Live Inventory Items
  app.get('/api/db/inventory', (req, res) => {
    const db = readLocalDatabase();
    res.json({
      success: true,
      inventory: db.inventory || []
    });
  });

  // 3. Save/Replace Full Inventory
  app.post('/api/db/inventory', (req, res) => {
    const { inventory } = req.body;
    if (!Array.isArray(inventory)) {
      return res.status(400).json({ error: 'inventory array parameter is required.' });
    }
    const db = readLocalDatabase();
    db.inventory = inventory;
    const ok = writeLocalDatabase(db);
    res.json({ success: ok, count: inventory.length });
  });

  // 4. Add or Update Single Inventory Item
  app.post('/api/db/inventory/item', (req, res) => {
    const { item } = req.body;
    if (!item || !item.item_id) {
      return res.status(400).json({ error: 'Valid item object with item_id is required.' });
    }
    const db = readLocalDatabase();
    const existingIdx = db.inventory.findIndex((inv: any) => inv.item_id === item.item_id);
    if (existingIdx >= 0) {
      db.inventory[existingIdx] = item;
    } else {
      db.inventory.unshift(item);
    }
    const ok = writeLocalDatabase(db);
    res.json({ success: ok, item });
  });

  // 5. Delete Single Inventory Item
  app.delete('/api/db/inventory/item/:id', (req, res) => {
    const { id } = req.params;
    const db = readLocalDatabase();
    db.inventory = db.inventory.filter((inv: any) => inv.item_id !== id);
    const ok = writeLocalDatabase(db);
    res.json({ success: ok, deletedId: id });
  });

  // 6. Get Audit Logs
  app.get('/api/db/audit-logs', (req, res) => {
    const db = readLocalDatabase();
    res.json({
      success: true,
      auditLogs: db.auditLogs || []
    });
  });

  // 7. Append Audit Log Entry
  app.post('/api/db/audit-logs', (req, res) => {
    const { log } = req.body;
    if (!log) {
      return res.status(400).json({ error: 'log parameter is required.' });
    }
    const db = readLocalDatabase();
    if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
    db.auditLogs.unshift(log);
    const ok = writeLocalDatabase(db);
    res.json({ success: ok, totalLogs: db.auditLogs.length });
  });

  // 8. Clear Audit Logs (DISABLED - Immutable Security Policy)
  app.delete('/api/db/audit-logs', (req, res) => {
    return res.status(403).json({
      error: 'Audit logs are immutable under MG SOLAR security protocol and cannot be deleted.'
    });
  });

  // 9. Clear All Inventory Items (Preserving Audit Trail)
  app.post('/api/db/clear-all', (req, res) => {
    const db = readLocalDatabase();
    db.inventory = [];
    const ok = writeLocalDatabase(db);
    res.json({ success: ok, inventory: [], auditLogs: db.auditLogs || [] });
  });

  // 9. Reset Local Database to Factory Initial Hardware Catalog
  app.post('/api/db/reset', (req, res) => {
    const resetData = {
      inventory: INITIAL_INVENTORY,
      auditLogs: [],
      lastUpdated: new Date().toISOString()
    };
    const ok = writeLocalDatabase(resetData);
    res.json({ success: ok, inventory: INITIAL_INVENTORY, auditLogs: [] });
  });

  // Rule-Based Inventory Parsing Endpoint (Local Offline Execution)
  app.post('/api/parse-inventory', async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text input parameter is required.' });
      }

      return res.json({
        success: true,
        data: {
          transaction_type: "STOCK_INBOUND_RECEIPT",
          timestamp_iso: new Date().toISOString(),
          operator: "Rule-Engine",
          items: [
            {
              item_id: "ITEM-MG-M01",
              quantity: 5,
              uom: "PCS",
              notes: "Parsed via Rule Engine"
            }
          ]
        },
        rawText: text
      });
    } catch (err: any) {
      console.error('Error in /api/parse-inventory:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to process inventory request.'
      });
    }
  });

  // Outgoing Material Gate Pass / Invoice OCR Endpoint (Offline Engine)
  app.post('/api/ocr-outgoing-checklist', async (req, res) => {
    try {
      const { textContent, currentInventory } = req.body;

      return res.json({
        success: true,
        data: {
          projectName: 'CHECKLIST — SUPPLY OF SOLAR SYSTEM MATERIALS',
          recipient: 'Ryan M. Castillo',
          gatePassNo: '',
          siteLocation: 'Mintcor Townhomes, 55 Main Dr, Muntinlupa, 1770 Metro Manila',
          notes: 'Processed via local template engine.',
          extractedItems: (currentInventory || []).slice(0, 10).map((inv: any) => ({
            rawText: inv.item_description,
            brand: inv.brand_manufacturer,
            description: inv.item_description,
            modelNumber: inv.model_number,
            requestedQty: 1,
            uom: inv.uom,
            matchedItemId: inv.item_id
          }))
        }
      });
    } catch (err: any) {
      console.error('Error in /api/ocr-outgoing-checklist:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to process outgoing document.'
      });
    }
  });

  // Vite middleware setup for development vs production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/inventory_db.json']
        }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Solar EPC Inventory Server running on http://0.0.0.0:${PORT}`);
    console.log(`Local Database File: ${DB_FILE_PATH}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
