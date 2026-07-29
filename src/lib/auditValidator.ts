import { PRDJsonOutput, CategoryType } from '../types';

export interface AuditFilterOptions {
  searchTerm?: string;
  transactionType?: 'ALL' | 'RESTOCK' | 'REMOVED' | 'RESERVATION' | 'SKU_ADDED' | 'SKU_DELETED' | 'AUDIT';
  category?: 'ALL' | CategoryType;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface AuditValidationResult {
  cleanedLogs: PRDJsonOutput[];
  totalOriginalCount: number;
  duplicateCountRemoved: number;
  invalidEntriesRemoved: number;
}

/**
 * Deduplicates and validates an array of audit logs.
 * Removes duplicate transactions generated within 10 seconds of each other
 * with identical transaction types, notes, operators, and item IDs.
 */
export function validateAndDeduplicateAuditLogs(logs: PRDJsonOutput[]): AuditValidationResult {
  if (!Array.isArray(logs) || logs.length === 0) {
    return {
      cleanedLogs: [],
      totalOriginalCount: 0,
      duplicateCountRemoved: 0,
      invalidEntriesRemoved: 0
    };
  }

  let invalidEntriesRemoved = 0;
  let duplicateCountRemoved = 0;

  // Step 1: Filter out malformed entries
  const validEntries = logs.filter((log) => {
    if (!log || typeof log !== 'object') {
      invalidEntriesRemoved++;
      return false;
    }
    if (!log.inventory_event || !log.inventory_event.transaction_type) {
      invalidEntriesRemoved++;
      return false;
    }
    if (!Array.isArray(log.items)) {
      invalidEntriesRemoved++;
      return false;
    }
    return true;
  });

  // Step 2: Sort logs chronologically descending (newest first)
  const sorted = [...validEntries].sort((a, b) => {
    const timeA = new Date(a.inventory_event.timestamp || 0).getTime();
    const timeB = new Date(b.inventory_event.timestamp || 0).getTime();
    return timeB - timeA;
  });

  // Step 3: Remove duplicate entries
  const cleanedLogs: PRDJsonOutput[] = [];

  for (const currentLog of sorted) {
    const currentEvt = currentLog.inventory_event;
    const currentTs = new Date(currentEvt.timestamp || 0).getTime();
    const itemIds = currentLog.items.map((i) => i.item_id).sort().join(',');

    const isDuplicate = cleanedLogs.some((existingLog) => {
      const existingEvt = existingLog.inventory_event;
      const existingTs = new Date(existingEvt.timestamp || 0).getTime();

      // Time proximity window: within 10 seconds (10,000ms)
      const isTimeClose = Math.abs(currentTs - existingTs) <= 10000;
      if (!isTimeClose) return false;

      // Same transaction type
      if (currentEvt.transaction_type !== existingEvt.transaction_type) return false;

      // Same operator
      if (currentEvt.performed_by !== existingEvt.performed_by) return false;

      // Same items
      const existingItemIds = existingLog.items.map((i) => i.item_id).sort().join(',');
      if (itemIds !== existingItemIds) return false;

      // Same notes or closely matching notes
      if (currentEvt.notes === existingEvt.notes) return true;

      return false;
    });

    if (isDuplicate) {
      duplicateCountRemoved++;
    } else {
      cleanedLogs.push(currentLog);
    }
  }

  return {
    cleanedLogs,
    totalOriginalCount: logs.length,
    duplicateCountRemoved,
    invalidEntriesRemoved
  };
}

/**
 * Advanced Audit Log Search & Multi-Criteria Filtering
 */
export function filterAuditLogs(logs: PRDJsonOutput[], options: AuditFilterOptions): PRDJsonOutput[] {
  const { searchTerm, transactionType, category, startDate, endDate } = options;

  return logs.filter((log) => {
    const evt = log.inventory_event;
    const txType = evt.transaction_type;

    // 1. Transaction Type Filter
    if (transactionType && transactionType !== 'ALL') {
      if (transactionType === 'RESTOCK' && txType !== 'RESTOCK' && txType !== 'INBOUND') return false;
      if (transactionType === 'REMOVED' && txType !== 'REMOVED' && txType !== 'OUTBOUND') return false;
      if (transactionType === 'RESERVATION' && txType !== 'RESERVATION') return false;
      if (transactionType === 'SKU_ADDED' && txType !== 'SKU_ADDED') return false;
      if (transactionType === 'SKU_DELETED' && txType !== 'SKU_DELETED') return false;
      if (transactionType === 'AUDIT' && txType !== 'AUDIT') return false;
    }

    // 2. Category Filter
    if (category && category !== 'ALL') {
      const matchesCategory = log.items?.some((i) => i.category === category);
      if (!matchesCategory) return false;
    }

    // 3. Date Range Filter
    if (startDate || endDate) {
      const logDate = new Date(evt.timestamp || 0);
      if (isNaN(logDate.getTime())) return false;

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (logDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }
    }

    // 4. Free-text Search Filter (Search Item ID, Brand, Model, Description, Notes, Operator, Project ID)
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const notes = evt.notes?.toLowerCase() || '';
      const projId = evt.project_id?.toLowerCase() || '';
      const operator = evt.performed_by?.toLowerCase() || '';
      const matchesItem = log.items?.some(
        (i) =>
          i.item_id.toLowerCase().includes(q) ||
          i.brand_manufacturer?.toLowerCase().includes(q) ||
          i.model_number?.toLowerCase().includes(q) ||
          i.item_description?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      );

      return notes.includes(q) || projId.includes(q) || operator.includes(q) || matchesItem;
    }

    return true;
  });
}
