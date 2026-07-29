import React, { useState, useEffect } from 'react';
import { SidebarLayout } from './components/SidebarLayout';
import { InventoryDashboard } from './components/InventoryDashboard';
import { OutgoingChecklistSection } from './components/OutgoingChecklistSection';
import { JsonExportView } from './components/JsonExportModal';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { ItemModal } from './components/ItemModal';
import { SerialNumbersModal } from './components/SerialNumbersModal';
import { PrdSpecModal } from './components/PrdSpecModal';
import { LoginGate } from './components/LoginGate';
import { ProfileModal } from './components/ProfileModal';
import { SupabaseModal } from './components/SupabaseModal';
import { Toaster } from './components/ui/toaster';
import { toast } from './components/ui/use-toast';

import { InventoryItem, PRDJsonOutput, UserProfile, DEFAULT_PROFILES } from './types';
import { INITIAL_INVENTORY } from './lib/prdSpec';
import { 
  isSupabaseConfigured, 
  fetchSupabaseInventory, 
  saveSupabaseInventory, 
  saveSingleSupabaseItem,
  deleteSupabaseItem,
  clearSupabaseInventory,
  fetchSupabaseAuditLogs, 
  insertSupabaseAuditLog,
  clearSupabaseAuditLogs
} from './lib/supabase';


export default function App() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'parser' | 'history' | 'json'>('inventory');

  const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes inactivity timeout

  // Active Authenticated User Session (sessionStorage preserves on refresh, wiped when browser tab/app is closed)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = sessionStorage.getItem('solar_epc_session_auth');
    if (saved) {
      try {
        const { user, lastActive } = JSON.parse(saved);
        const now = Date.now();
        if (user && lastActive && (now - lastActive) < SESSION_TIMEOUT_MS) {
          sessionStorage.setItem('solar_epc_session_auth', JSON.stringify({ user, lastActive: now }));
          return user;
        }
      } catch (e) {
        console.error('Failed to parse session auth:', e);
      }
    }
    sessionStorage.removeItem('solar_epc_session_auth');
    return null;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Inactivity Timer & User Activity Listener
  useEffect(() => {
    if (!currentUser) return;

    sessionStorage.setItem(
      'solar_epc_session_auth',
      JSON.stringify({ user: currentUser, lastActive: Date.now() })
    );

    const updateActivity = () => {
      sessionStorage.setItem(
        'solar_epc_session_auth',
        JSON.stringify({ user: currentUser, lastActive: Date.now() })
      );
    };

    // Check inactivity every 20 seconds
    const interval = setInterval(() => {
      const saved = sessionStorage.getItem('solar_epc_session_auth');
      if (saved) {
        try {
          const { lastActive } = JSON.parse(saved);
          if (Date.now() - lastActive >= SESSION_TIMEOUT_MS) {
            sessionStorage.removeItem('solar_epc_session_auth');
            setCurrentUser(null);
            toast({
              type: 'warning',
              title: 'SESSION EXPIRED',
              description: 'Logged out due to 15 minutes of inactivity. Please re-enter password.'
            });
          }
        } catch (e) {}
      }
    }, 20000);

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [currentUser]);

  // Active Live Inventory & Audit Logs
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<PRDJsonOutput[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [serialsItem, setSerialsItem] = useState<InventoryItem | null>(null);
  const [isPrdModalOpen, setIsPrdModalOpen] = useState<boolean>(false);

  // Initial 3-Tier Data Loading: Supabase Cloud -> Local DB API -> LocalStorage Cache
  useEffect(() => {
    const loadData = async () => {
      // Tier 1: Fetch from Supabase Cloud DB if configured
      if (isSupabaseConfigured()) {
        try {
          const cloudInv = await fetchSupabaseInventory();
          const cloudLogs = await fetchSupabaseAuditLogs();

          if (cloudInv !== null) {
            setInventory(cloudInv);
            setAuditLogs(cloudLogs || []);
            localStorage.setItem('solar_epc_inventory', JSON.stringify(cloudInv));
            localStorage.setItem('solar_epc_audit_logs', JSON.stringify(cloudLogs || []));
            localStorage.setItem('solar_epc_initialized', 'true');
            setIsDbLoaded(true);
            return;
          }
        } catch (err) {
          console.warn('Supabase cloud fetch error, falling back to local storage:', err);
        }
      }

      // Tier 2: Fetch from Local Server REST API (/api/db/all)
      try {
        const res = await fetch('/api/db/all');
        const data = await res.json();
        if (data.success && Array.isArray(data.inventory)) {
          setInventory(data.inventory);
          setAuditLogs(Array.isArray(data.auditLogs) ? data.auditLogs : []);
          localStorage.setItem('solar_epc_inventory', JSON.stringify(data.inventory));
          localStorage.setItem('solar_epc_audit_logs', JSON.stringify(data.auditLogs || []));
          localStorage.setItem('solar_epc_initialized', 'true');
          setIsDbLoaded(true);
          return;
        }
      } catch (err) {
        console.warn('Local DB API unreachable, checking localStorage cache:', err);
      }

      // Tier 3: Browser localStorage Cache
      const savedInv = localStorage.getItem('solar_epc_inventory');
      const savedLogs = localStorage.getItem('solar_epc_audit_logs');
      
      let invToUse: InventoryItem[] = [];
      if (savedInv) {
        try {
          const parsed = JSON.parse(savedInv);
          if (Array.isArray(parsed)) {
            invToUse = parsed;
          }
        } catch (e) {}
      }

      let logsToUse: PRDJsonOutput[] = [];
      if (savedLogs) {
        try {
          const parsed = JSON.parse(savedLogs);
          if (Array.isArray(parsed)) logsToUse = parsed;
        } catch (e) {}
      }

      setInventory(invToUse);
      setAuditLogs(logsToUse);
      localStorage.setItem('solar_epc_inventory', JSON.stringify(invToUse));
      localStorage.setItem('solar_epc_audit_logs', JSON.stringify(logsToUse));
      localStorage.setItem('solar_epc_initialized', 'true');
      setIsDbLoaded(true);
    };

    loadData();
  }, []);


  // Persist to local storage & Local Database API
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('solar_epc_user_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('solar_epc_user_session');
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isDbLoaded) return;
    localStorage.setItem('solar_epc_inventory', JSON.stringify(inventory));
    // Sync with Local Database File
    fetch('/api/db/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory })
    }).catch(() => {});

    // Auto-sync with Supabase Cloud DB if configured
    if (isSupabaseConfigured()) {
      saveSupabaseInventory(inventory).catch((err) => {
        console.warn('Supabase auto-sync inventory failed:', err);
      });
    }
  }, [inventory, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;
    localStorage.setItem('solar_epc_audit_logs', JSON.stringify(auditLogs));
    // Sync with Local Database File
    if (auditLogs.length > 0) {
      fetch('/api/db/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: auditLogs[0] })
      }).catch(() => {});

      // Auto-sync with Supabase Cloud DB if configured
      if (isSupabaseConfigured()) {
        insertSupabaseAuditLog(auditLogs[0]).catch((err) => {
          console.warn('Supabase auto-sync audit log failed:', err);
        });
      }
    }
  }, [auditLogs, isDbLoaded]);

  // Compute low stock count
  const lowStockCount = inventory.filter((item) => {
    const avail = item.stock_levels.current_stock - item.stock_levels.allocated_stock;
    return avail <= item.stock_levels.reorder_threshold || item.stock_levels.low_stock_alert;
  }).length;

  const operatorTag = currentUser
    ? `${currentUser.fullName} (${currentUser.role})`
    : 'System Operator';

  // Handlers
  const handleResetData = () => {
    if (window.confirm('Clear all hardware items and audit transaction logs permanently?')) {
      fetch('/api/db/clear-all', { method: 'POST' }).catch(() => {});
      if (isSupabaseConfigured()) {
        clearSupabaseInventory().catch(() => {});
        clearSupabaseAuditLogs().catch(() => {});
      }
      setInventory([]);
      setAuditLogs([]);
      localStorage.setItem('solar_epc_inventory', '[]');
      localStorage.setItem('solar_epc_audit_logs', '[]');
      localStorage.setItem('solar_epc_initialized', 'true');
      toast({
        type: 'warning',
        title: 'ALL DATA CLEARED',
        description: 'Inventory items and audit transaction logs have been wiped.'
      });
    }
  };

  const handleClearAuditLogs = () => {
    const isAdmin = currentUser?.username === 'admin' || currentUser?.role === 'System Administrator';
    if (!isAdmin) {
      toast({
        type: 'warning',
        title: 'ACCESS RESTRICTED',
        description: 'Only System Administrators are authorized to clear audit logs.'
      });
      return;
    }

    fetch('/api/db/audit-logs', { method: 'DELETE' }).catch(() => {});
    if (isSupabaseConfigured()) {
      clearSupabaseAuditLogs().catch(() => {});
    }
    setAuditLogs([]);
    localStorage.setItem('solar_epc_audit_logs', '[]');
    toast({
      type: 'warning',
      title: 'AUDIT TRAIL CLEARED',
      description: 'All transaction audit trail entries have been cleared.'
    });
  };

  const handleDeleteSingleAuditLog = (index: number) => {
    const isAdmin = currentUser?.username === 'admin' || currentUser?.role === 'System Administrator';
    if (!isAdmin) {
      toast({
        type: 'warning',
        title: 'ACCESS RESTRICTED',
        description: 'Only System Administrators are authorized to delete audit log entries.'
      });
      return;
    }

    fetch(`/api/db/audit-logs/${index}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.auditLogs)) {
          setAuditLogs(data.auditLogs);
          localStorage.setItem('solar_epc_audit_logs', JSON.stringify(data.auditLogs));
        } else {
          const updated = [...auditLogs];
          updated.splice(index, 1);
          setAuditLogs(updated);
          localStorage.setItem('solar_epc_audit_logs', JSON.stringify(updated));
        }
        toast({
          type: 'info',
          title: 'AUDIT ENTRY DELETED',
          description: 'Selected transaction audit log entry has been removed.'
        });
      })
      .catch(() => {
        const updated = [...auditLogs];
        updated.splice(index, 1);
        setAuditLogs(updated);
        localStorage.setItem('solar_epc_audit_logs', JSON.stringify(updated));
      });
  };


  const handleSaveItem = (savedItem: InventoryItem) => {
    const existingIdx = inventory.findIndex((i) => i.item_id === savedItem.item_id);
    const isNew = existingIdx === -1;
    const oldItem = !isNew ? inventory[existingIdx] : undefined;

    setInventory((prev) => {
      const idx = prev.findIndex((i) => i.item_id === savedItem.item_id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedItem;
        return updated;
      }
      return [savedItem, ...prev];
    });

    // Immediately trigger direct save to Supabase Cloud DB
    if (isSupabaseConfigured()) {
      saveSingleSupabaseItem(savedItem).catch((err) => {
        console.warn('Direct Supabase item save failed:', err);
      });
    }

    const txType = isNew ? 'SKU_ADDED' : 'AUDIT';
    const note = isNew
      ? `Added new item: ${savedItem.brand_manufacturer} ${savedItem.model_number} (${savedItem.item_id}) with initial stock of ${savedItem.stock_levels.current_stock} ${savedItem.uom}.`
      : `Updated item details/specifications for ${savedItem.brand_manufacturer} ${savedItem.model_number} (${savedItem.item_id}).`;

    const logEntry: PRDJsonOutput = {
      inventory_event: {
        transaction_type: txType,
        notes: note,
        performed_by: operatorTag,
        timestamp: new Date().toISOString()
      },
      items: [
        {
          ...savedItem,
          change_quantity: isNew ? savedItem.stock_levels.current_stock : (oldItem ? savedItem.stock_levels.current_stock - oldItem.stock_levels.current_stock : 0),
          previous_stock: oldItem ? oldItem.stock_levels.current_stock : 0,
          new_stock: savedItem.stock_levels.current_stock
        }
      ]
    };

    setAuditLogs((prev) => [logEntry, ...prev]);

    if (isSupabaseConfigured()) {
      insertSupabaseAuditLog(logEntry).catch((err) => {
        console.warn('Direct Supabase audit log insert failed:', err);
      });
    }
  };


  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = inventory.find((i) => i.item_id === itemId);
    if (!itemToDelete) return;

    const nextInventory = inventory.filter((i) => i.item_id !== itemId);
    setInventory(nextInventory);

    // Explicitly delete from local database file
    fetch(`/api/db/inventory/item/${encodeURIComponent(itemId)}`, {
      method: 'DELETE'
    }).catch(() => {});

    // Explicitly delete from Supabase Cloud DB if configured
    if (isSupabaseConfigured()) {
      deleteSupabaseItem(itemId).catch((err) => {
        console.warn('Supabase delete item error:', err);
      });
    }

    const logEntry: PRDJsonOutput = {
      inventory_event: {
        transaction_type: 'SKU_DELETED',
        notes: `Deleted hardware item ${itemToDelete.item_id} (${itemToDelete.brand_manufacturer} ${itemToDelete.model_number}) from inventory catalog.`,
        performed_by: operatorTag,
        timestamp: new Date().toISOString()
      },
      items: [
        {
          ...itemToDelete,
          change_quantity: -itemToDelete.stock_levels.current_stock,
          previous_stock: itemToDelete.stock_levels.current_stock,
          new_stock: 0
        }
      ]
    };

    setAuditLogs((prev) => [logEntry, ...prev]);

    toast({
      type: 'low_stock',
      title: 'ITEM DELETED FROM INVENTORY',
      description: `Successfully removed ${itemToDelete.brand_manufacturer} ${itemToDelete.model_number} from catalog.`
    });
  };

  const handleUpdateStock = (itemId: string, currentStockChange: number, allocatedStockChange: number, customNote?: string) => {
    const itemToUpdate = inventory.find((i) => i.item_id === itemId);
    if (!itemToUpdate) return;

    if (currentStockChange < 0 && itemToUpdate.stock_levels.current_stock <= 0) {
      toast({
        type: 'warning',
        title: 'STOCK ALREADY AT ZERO',
        description: `Cannot decrement stock for ${itemToUpdate.brand_manufacturer} ${itemToUpdate.model_number}. Minimum stock limit is 0.`
      });
      return;
    }

    const oldStock = itemToUpdate.stock_levels.current_stock;
    const newCurrent = Math.max(0, itemToUpdate.stock_levels.current_stock + currentStockChange);
    // Ensure allocated stock never exceeds new physical stock and never drops below 0
    const newAllocated = Math.min(newCurrent, Math.max(0, itemToUpdate.stock_levels.allocated_stock + allocatedStockChange));
    const available = Math.max(0, newCurrent - newAllocated);
    const isLowAlert = available <= itemToUpdate.stock_levels.reorder_threshold;

    setInventory((prev) =>
      prev.map((item) => {
        if (item.item_id === itemId) {
          return {
            ...item,
            stock_levels: {
              ...item.stock_levels,
              current_stock: newCurrent,
              allocated_stock: newAllocated,
              low_stock_alert: isLowAlert
            }
          };
        }
        return item;
      })
    );

    let txType: 'RESTOCK' | 'REMOVED' | 'RESERVATION' | 'AUDIT' = 'AUDIT';
    let autoNote = '';

    if (currentStockChange > 0) {
      txType = 'RESTOCK';
      autoNote = `Restocked +${currentStockChange} ${itemToUpdate.uom} of ${itemToUpdate.brand_manufacturer} ${itemToUpdate.model_number} (Stock: ${oldStock} ➔ ${newCurrent})`;
    } else if (currentStockChange < 0) {
      txType = 'REMOVED';
      autoNote = `Removed ${Math.abs(currentStockChange)} ${itemToUpdate.uom} of ${itemToUpdate.brand_manufacturer} ${itemToUpdate.model_number} (Stock: ${oldStock} ➔ ${newCurrent})`;
    } else if (allocatedStockChange !== 0) {
      txType = 'RESERVATION';
      autoNote = `${allocatedStockChange > 0 ? 'Allocated' : 'Unallocated'} ${Math.abs(allocatedStockChange)} ${itemToUpdate.uom} for project reservation.`;
    } else {
      autoNote = `Stock level adjusted for ${itemToUpdate.brand_manufacturer} ${itemToUpdate.model_number}.`;
    }

    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    const newLogEntry: PRDJsonOutput = {
      inventory_event: {
        transaction_type: txType,
        notes: customNote ? `${autoNote} [${customNote}]` : autoNote,
        performed_by: operatorTag,
        timestamp: nowIso
      },
      items: [
        {
          ...itemToUpdate,
          stock_levels: {
            ...itemToUpdate.stock_levels,
            current_stock: newCurrent,
            allocated_stock: newAllocated,
            low_stock_alert: isLowAlert
          },
          quantity: newCurrent,
          change_quantity: currentStockChange || allocatedStockChange,
          previous_stock: oldStock,
          new_stock: newCurrent
        }
      ]
    };

    setAuditLogs((prevLogs) => {
      // Look for a recent matching log entry created within the last 5 minutes for the same item & transaction type
      const existingIndex = prevLogs.findIndex((log) => {
        if (!log.inventory_event || !log.items || log.items.length !== 1) return false;
        const logItem = log.items[0];
        if (logItem.item_id !== itemId) return false;
        if (log.inventory_event.transaction_type !== txType) return false;
        if (log.inventory_event.performed_by !== operatorTag) return false;

        const logTime = new Date(log.inventory_event.timestamp).getTime();
        return !isNaN(logTime) && (nowMs - logTime) <= FIVE_MINUTES_MS;
      });

      if (existingIndex !== -1) {
        // Coalesce into existing log
        const updatedLogs = [...prevLogs];
        const existingLog = updatedLogs[existingIndex];
        const existingItem = existingLog.items[0];

        const origPreviousStock = existingItem.previous_stock ?? oldStock;
        const aggregatedChange = (existingItem.change_quantity ?? 0) + (currentStockChange || allocatedStockChange);
        const aggregatedNewCurrent = newCurrent;

        let aggregatedAutoNote = '';
        if (txType === 'RESTOCK') {
          aggregatedAutoNote = `Restocked +${aggregatedChange} ${itemToUpdate.uom} of ${itemToUpdate.brand_manufacturer} ${itemToUpdate.model_number} (Stock: ${origPreviousStock} ➔ ${aggregatedNewCurrent})`;
        } else if (txType === 'REMOVED') {
          aggregatedAutoNote = `Removed ${Math.abs(aggregatedChange)} ${itemToUpdate.uom} of ${itemToUpdate.brand_manufacturer} ${itemToUpdate.model_number} (Stock: ${origPreviousStock} ➔ ${aggregatedNewCurrent})`;
        } else if (txType === 'RESERVATION') {
          aggregatedAutoNote = `${aggregatedChange > 0 ? 'Allocated' : 'Unallocated'} ${Math.abs(aggregatedChange)} ${itemToUpdate.uom} for project reservation.`;
        } else {
          aggregatedAutoNote = `Stock level adjusted for ${itemToUpdate.brand_manufacturer} ${itemToUpdate.model_number}.`;
        }

        const noteText = customNote ? `${aggregatedAutoNote} [${customNote}]` : aggregatedAutoNote;

        const updatedLog: PRDJsonOutput = {
          ...existingLog,
          inventory_event: {
            ...existingLog.inventory_event,
            notes: noteText,
            timestamp: nowIso
          },
          items: [
            {
              ...existingItem,
              stock_levels: {
                ...itemToUpdate.stock_levels,
                current_stock: aggregatedNewCurrent,
                allocated_stock: newAllocated,
                low_stock_alert: isLowAlert
              },
              quantity: aggregatedNewCurrent,
              change_quantity: aggregatedChange,
              previous_stock: origPreviousStock,
              new_stock: aggregatedNewCurrent
            }
          ]
        };

        // Move updated coalesced log to top of list
        updatedLogs.splice(existingIndex, 1);
        return [updatedLog, ...updatedLogs];
      }

      return [newLogEntry, ...prevLogs];
    });

    // Toast Notifications
    if (isLowAlert) {
      toast({
        type: 'low_stock',
        title: `CRITICAL LOW STOCK ALERT`,
        description: `${itemToUpdate.brand_manufacturer} ${itemToUpdate.model_number} stock dropped to ${available} ${itemToUpdate.uom} (reorder threshold: ${itemToUpdate.stock_levels.reorder_threshold}).`,
        itemDetails: {
          itemId: itemToUpdate.item_id,
          description: itemToUpdate.item_description,
          currentStock: available,
          reorderThreshold: itemToUpdate.stock_levels.reorder_threshold,
          uom: itemToUpdate.uom
        }
      });
    } else if (currentStockChange > 0) {
      toast({
        type: 'success',
        title: `STOCK RESTOCKED (+${currentStockChange} ${itemToUpdate.uom})`,
        description: `${itemToUpdate.brand_manufacturer} ${itemToUpdate.model_number} updated to ${newCurrent} ${itemToUpdate.uom}.`
      });
    } else if (currentStockChange < 0) {
      toast({
        type: 'info',
        title: `STOCK DISPATCHED (-${Math.abs(currentStockChange)} ${itemToUpdate.uom})`,
        description: `${itemToUpdate.brand_manufacturer} ${itemToUpdate.model_number} current stock is now ${newCurrent} ${itemToUpdate.uom}.`
      });
    }
  };

  const handleSaveSerials = (itemId: string, serials: string[]) => {
    const itemToUpdate = inventory.find((i) => i.item_id === itemId);
    if (!itemToUpdate) return;

    setInventory((prev) =>
      prev.map((item) => {
        if (item.item_id === itemId) {
          return {
            ...item,
            serial_numbers: serials
          };
        }
        return item;
      })
    );

    const logEntry: PRDJsonOutput = {
      inventory_event: {
        transaction_type: 'AUDIT',
        notes: `Updated serial numbers for ${itemToUpdate.brand_manufacturer} ${itemToUpdate.model_number} (${serials.length} active serials registered).`,
        performed_by: operatorTag,
        timestamp: new Date().toISOString()
      },
      items: [
        {
          ...itemToUpdate,
          serial_numbers: serials
        }
      ]
    };

    setAuditLogs((prev) => [logEntry, ...prev]);
  };

  // Commit Transaction Output to Active Inventory
  const handleCommitTransaction = (prdOutput: PRDJsonOutput) => {
    const enrichedOutput: PRDJsonOutput = {
      ...prdOutput,
      inventory_event: {
        ...prdOutput.inventory_event,
        performed_by: prdOutput.inventory_event?.performed_by || operatorTag
      }
    };

    // 1. Add event to Audit Logs
    setAuditLogs((prev) => [enrichedOutput, ...prev]);

    // 2. Apply stock changes or add new items
    const eventType = enrichedOutput.inventory_event?.transaction_type || 'INBOUND';
    const lowStockAlerts: Array<{
      itemId: string;
      description: string;
      brand: string;
      model: string;
      available: number;
      reorderThreshold: number;
      uom: string;
    }> = [];

    setInventory((prev) => {
      const updatedList = [...prev];

      enrichedOutput.items?.forEach((newItem) => {
        const existingIdx = updatedList.findIndex(
          (i) => i.item_id === newItem.item_id || (i.model_number === newItem.model_number && newItem.model_number)
        );

        if (existingIdx >= 0) {
          const existing = updatedList[existingIdx];
          let currentStock = existing.stock_levels.current_stock;
          let allocatedStock = existing.stock_levels.allocated_stock;

          if (eventType === 'INBOUND' || eventType === 'RESTOCK') {
            currentStock += newItem.quantity || 0;
          } else if (eventType === 'OUTBOUND' || eventType === 'REMOVED') {
            currentStock = Math.max(0, currentStock - (newItem.quantity || 0));
          } else if (eventType === 'RESERVATION') {
            allocatedStock += newItem.quantity || 0;
          } else if (eventType === 'AUDIT') {
            currentStock = newItem.stock_levels?.current_stock ?? currentStock;
            allocatedStock = newItem.stock_levels?.allocated_stock ?? allocatedStock;
          }

          const available = currentStock - allocatedStock;
          const isLow = available <= (existing.stock_levels.reorder_threshold || 10);

          if (isLow) {
            lowStockAlerts.push({
              itemId: existing.item_id,
              description: existing.item_description,
              brand: existing.brand_manufacturer,
              model: existing.model_number,
              available,
              reorderThreshold: existing.stock_levels.reorder_threshold,
              uom: existing.uom
            });
          }

          // Merge serials if present
          const mergedSerials = Array.from(
            new Set([...(existing.serial_numbers || []), ...(newItem.serial_numbers || [])])
          );

          updatedList[existingIdx] = {
            ...existing,
            stock_levels: {
              ...existing.stock_levels,
              current_stock: currentStock,
              allocated_stock: allocatedStock,
              low_stock_alert: isLow
            },
            serial_numbers: mergedSerials
          };
        } else {
          // Add as new item
          updatedList.unshift(newItem);
        }
      });

      return updatedList;
    });

    lowStockAlerts.forEach((alert) => {
      toast({
        type: 'low_stock',
        title: `CRITICAL LOW STOCK ALERT`,
        description: `${alert.brand} ${alert.model} stock dropped to ${alert.available} ${alert.uom} (reorder threshold: ${alert.reorderThreshold}).`,
        itemDetails: {
          itemId: alert.itemId,
          description: alert.description,
          currentStock: alert.available,
          reorderThreshold: alert.reorderThreshold,
          uom: alert.uom
        }
      });
    });

    toast({
      type: 'success',
      title: `TRANSACTION COMMITTED`,
      description: `Successfully logged ${eventType} event with ${enrichedOutput.items?.length || 0} line items.`
    });
  };

  // If not logged in, present password login gate
  if (!currentUser) {
    return <LoginGate onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <SidebarLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      lowStockCount={lowStockCount}
      totalItemsCount={inventory.length}
      onResetDefaultData={handleResetData}
      currentUser={currentUser}
      onOpenProfile={() => setIsProfileModalOpen(true)}
      onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
    >
      {activeTab === 'inventory' && (
        <InventoryDashboard
          items={inventory}
          onOpenAddItemModal={() => {
            setEditingItem(null);
            setIsItemModalOpen(true);
          }}
          onEditItem={(item) => {
            setEditingItem(item);
            setIsItemModalOpen(true);
          }}
          onDeleteItem={handleDeleteItem}
          onUpdateStock={handleUpdateStock}
          onOpenSerialsModal={(item) => setSerialsItem(item)}
        />
      )}

      {activeTab === 'parser' && (
        <OutgoingChecklistSection
          onCommitTransaction={handleCommitTransaction}
          currentInventory={inventory}
        />
      )}

      {activeTab === 'history' && (
        <TransactionHistoryModal
          logs={auditLogs}
          currentUser={currentUser}
          onClearLogs={handleClearAuditLogs}
          onDeleteLog={handleDeleteSingleAuditLog}
        />
      )}

      {/* Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        existingItem={editingItem}
        currentUser={currentUser}
      />


      <SerialNumbersModal
        item={serialsItem}
        onClose={() => setSerialsItem(null)}
        onSaveSerials={handleSaveSerials}
      />

      <PrdSpecModal
        isOpen={isPrdModalOpen}
        onClose={() => setIsPrdModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSwitchUser={(user) => setCurrentUser(user)}
        onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
        onLogout={() => {
          sessionStorage.removeItem('solar_epc_session_auth');
          setCurrentUser(null);
          setIsProfileModalOpen(false);
        }}
        auditLogs={auditLogs}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        inventory={inventory}
        auditLogs={auditLogs}
      />

      <Toaster onFocusItem={() => setActiveTab('inventory')} />
    </SidebarLayout>
  );
}
