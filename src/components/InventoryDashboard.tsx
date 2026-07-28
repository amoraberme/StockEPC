import React, { useState, useMemo } from 'react';
import { InventoryItem, CategoryType } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Zap, 
  Sun, 
  Box, 
  Cable, 
  AlertTriangle, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Hash, 
  PackagePlus, 
  PackageMinus,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Eye,
  Image as ImageIcon
} from 'lucide-react';

interface InventoryDashboardProps {
  items: InventoryItem[];
  onOpenAddItemModal: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateStock: (itemId: string, currentStockChange: number, allocatedStockChange: number, customNote?: string) => void;
  onOpenSerialsModal: (item: InventoryItem) => void;
}

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  ALL: 'All Hardware',
  PV_MODULE: 'Solar PV Modules',
  INVERTER: 'Solar Inverters',
  BESS: 'Battery Storage',
  PROTECTION_BREAKERS: 'Protection & Breakers',
  RACKING: 'Structural Racking',
  DC_CABLING: 'Cables & Wiring',
  MC4_CONNECTOR: 'MC4 Connectors',
  CONDUIT_FITTINGS: 'Conduits & Fittings',
  GROUNDING: 'Grounding & Bonding',
  FASTENERS: 'Fasteners & Anchors',
  CONSUMABLES: 'Consumables & Decals',
  BOS_SWITCHGEAR: 'BOS Switchgear'
};

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  items,
  onOpenAddItemModal,
  onEditItem,
  onDeleteItem,
  onUpdateStock,
  onOpenSerialsModal
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);

  // Quick Stock Movement Modal State
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'RESTOCK' | 'REMOVED' | 'RESERVATION'>('RESTOCK');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustNote, setAdjustNote] = useState<string>('');

  // Delete Confirmation Modal State
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  // Image Lightbox Preview Modal State
  const [previewImageItem, setPreviewImageItem] = useState<InventoryItem | null>(null);

  const [mobileViewMode, setMobileViewMode] = useState<'GRID' | 'LIST'>('GRID');

  const getCategoryIcon = (category: CategoryType) => {
    switch (category) {
      case 'PV_MODULE':
        return <Sun className="w-8 h-8 text-amber-500 drop-shadow-2xs" />;
      case 'INVERTER':
        return <Zap className="w-8 h-8 text-blue-600 drop-shadow-2xs" />;
      case 'BESS':
        return <Box className="w-8 h-8 text-emerald-600 drop-shadow-2xs" />;
      case 'DC_CABLING':
        return <Cable className="w-8 h-8 text-orange-600 drop-shadow-2xs" />;
      default:
        return <Box className="w-8 h-8 text-zinc-700 drop-shadow-2xs" />;
    }
  };

  const getCategoryStyle = (category: CategoryType) => {
    switch (category) {
      case 'PV_MODULE':
        return 'bg-amber-50 text-amber-900 border-amber-200/80';
      case 'INVERTER':
        return 'bg-blue-50 text-blue-900 border-blue-200/80';
      case 'BESS':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200/80';
      case 'PROTECTION_BREAKERS':
        return 'bg-rose-50 text-rose-900 border-rose-200/80';
      case 'DC_CABLING':
        return 'bg-orange-50 text-orange-900 border-orange-200/80';
      case 'MC4_CONNECTOR':
        return 'bg-purple-50 text-purple-900 border-purple-200/80';
      case 'CONDUIT_FITTINGS':
        return 'bg-cyan-50 text-cyan-900 border-cyan-200/80';
      case 'RACKING':
        return 'bg-zinc-100 text-zinc-900 border-zinc-300/80';
      case 'GROUNDING':
        return 'bg-teal-50 text-teal-900 border-teal-200/80';
      case 'FASTENERS':
        return 'bg-stone-100 text-stone-900 border-stone-300/80';
      case 'CONSUMABLES':
        return 'bg-lime-50 text-lime-900 border-lime-200/80';
      case 'BOS_SWITCHGEAR':
        return 'bg-indigo-50 text-indigo-900 border-indigo-200/80';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  const CategoryBadge: React.FC<{ category: CategoryType }> = ({ category }) => {
    const name = CATEGORY_DISPLAY_NAMES[category] || category.replace('_', ' ');
    const style = getCategoryStyle(category);
    return (
      <span
        title={name}
        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wider max-w-full overflow-hidden shrink-0 shadow-2xs ${style}`}
      >
        <span className="truncate">{name}</span>
      </span>
    );
  };

  const BrandBadge: React.FC<{ brand: string }> = ({ brand }) => {
    return (
      <span
        title={brand}
        className="inline-flex items-center px-2 py-0.5 rounded-md border border-zinc-200/90 bg-zinc-100/90 text-zinc-800 text-[10px] font-extrabold uppercase tracking-wide max-w-full overflow-hidden shrink-0 shadow-2xs"
      >
        <span className="truncate">{brand}</span>
      </span>
    );
  };

  const ItemThumbnail: React.FC<{ item: InventoryItem; onClick?: () => void; className?: string }> = ({
    item,
    onClick,
    className = "w-12 h-12 sm:w-14 sm:h-14 rounded-xl"
  }) => {
    const [imgError, setImgError] = React.useState(false);

    React.useEffect(() => {
      setImgError(false);
    }, [item.image_url]);

    const hasImage = Boolean(item.image_url) && !imgError;

    return (
      <div
        onClick={hasImage ? onClick : undefined}
        className={`bg-zinc-100/90 border border-zinc-200 shrink-0 overflow-hidden flex items-center justify-center relative shadow-2xs ${className} ${
          hasImage ? 'cursor-pointer group' : ''
        }`}
      >
        {hasImage ? (
          <>
            <img
              src={item.image_url}
              alt={item.item_description}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
              <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-xs" />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center">
            {getCategoryIcon(item.category)}
          </div>
        )}
      </div>
    );
  };

  const handleApplyMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    const qty = Number(adjustQty) || 0;
    if (qty <= 0) {
      alert('Please enter a valid positive quantity for movement.');
      return;
    }

    if (adjustType === 'RESTOCK') {
      onUpdateStock(adjustModalItem.item_id, qty, 0, adjustNote.trim() || 'Manual batch restock');
    } else if (adjustType === 'REMOVED') {
      if (qty > adjustModalItem.stock_levels.current_stock) {
        alert(`Cannot remove ${qty} ${adjustModalItem.uom}. Current stock is only ${adjustModalItem.stock_levels.current_stock} ${adjustModalItem.uom}. Stock cannot drop below 0.`);
        return;
      }
      onUpdateStock(adjustModalItem.item_id, -qty, 0, adjustNote.trim() || 'Manual stock issue / dispatch');
    } else if (adjustType === 'RESERVATION') {
      onUpdateStock(adjustModalItem.item_id, 0, qty, adjustNote.trim() || 'Project reservation allocation');
    }

    setAdjustModalItem(null);
    setAdjustNote('');
    setAdjustQty(10);
  };

  // Extract unique brands for filter
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    items.forEach((item) => {
      if (item.brand_manufacturer) brands.add(item.brand_manufacturer);
    });
    return Array.from(brands).sort();
  }, [items]);

  // Compute stats metrics
  const metrics = useMemo(() => {
    let totalWatts = 0;
    let totalInverterKw = 0;
    let totalBessKwh = 0;
    let totalCableMeters = 0;
    let lowStockAlertCount = 0;

    items.forEach((item) => {
      const avail = item.stock_levels.current_stock - item.stock_levels.allocated_stock;
      if (avail <= item.stock_levels.reorder_threshold || item.stock_levels.low_stock_alert) {
        lowStockAlertCount++;
      }

      if (item.category === 'PV_MODULE' && item.technical_specs.power_rating_w) {
        totalWatts += item.technical_specs.power_rating_w * item.stock_levels.current_stock;
      }

      if (item.category === 'INVERTER' && item.technical_specs.power_rating_w) {
        totalInverterKw += (item.technical_specs.power_rating_w / 1000) * item.stock_levels.current_stock;
      }

      if (item.category === 'BESS' && item.technical_specs.capacity_kw_kwh) {
        const match = item.technical_specs.capacity_kw_kwh.match(/(\d+(\.\d+)?)\s*kWh/i);
        if (match) {
          totalBessKwh += parseFloat(match[1]) * item.stock_levels.current_stock;
        }
      }

      if (item.category === 'DC_CABLING') {
        totalCableMeters += item.stock_levels.current_stock;
      }
    });

    return {
      totalItems: items.length,
      totalKwPower: (totalWatts / 1000).toFixed(1),
      totalInverterKw: totalInverterKw.toFixed(0),
      totalBessKwh: totalBessKwh.toFixed(0),
      totalCableMeters: totalCableMeters.toLocaleString(),
      lowStockAlertCount
    };
  }, [items]);

  // Filtered Inventory List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== 'ALL' && item.brand_manufacturer !== selectedBrand) {
        return false;
      }

      // Low stock filter
      if (showLowStockOnly) {
        const avail = item.stock_levels.current_stock - item.stock_levels.allocated_stock;
        const isLow = avail <= item.stock_levels.reorder_threshold || item.stock_levels.low_stock_alert;
        if (!isLow) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.item_description.toLowerCase().includes(query);
        const matchesBrand = item.brand_manufacturer.toLowerCase().includes(query);
        const matchesModel = item.model_number.toLowerCase().includes(query);
        const matchesId = item.item_id.toLowerCase().includes(query);
        const matchesSerials = item.serial_numbers?.some((s) => s.toLowerCase().includes(query));
        if (!matchesName && !matchesBrand && !matchesModel && !matchesId && !matchesSerials) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, selectedBrand, showLowStockOnly, searchQuery]);

  const getCategoryBadgeVariant = (category: CategoryType) => {
    switch (category) {
      case 'PV_MODULE':
      case 'INVERTER':
      case 'BESS':
        return 'default'; // black badge
      case 'DC_CABLING':
      case 'MC4_CONNECTOR':
      case 'RACKING':
      case 'BOS_SWITCHGEAR':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div id="inventory-dashboard" className="space-y-3.5 sm:space-y-6 w-full max-w-full min-w-0">
      {/* Top Metrics Grid (Side-by-Side Condensed on Mobile) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
        <Card className="bg-white border-zinc-200 shadow-2xs">
          <CardHeader className="p-2.5 sm:p-3 pb-0.5">
            <div className="flex items-center justify-between text-zinc-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <span>Hardware Items</span>
              <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-900" />
            </div>
          </CardHeader>
          <CardContent className="p-2.5 sm:p-3 pt-0">
            <div className="text-base sm:text-xl font-black text-zinc-950 font-mono">
              {metrics.totalItems} <span className="text-[10px] sm:text-xs font-normal text-zinc-500">Items</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`border transition-all shadow-2xs ${
          metrics.lowStockAlertCount > 0
            ? 'bg-zinc-950 text-white border-black'
            : 'bg-white border-zinc-200'
        }`}>
          <CardHeader className="p-2.5 sm:p-3 pb-0.5">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <span className={metrics.lowStockAlertCount > 0 ? 'text-zinc-200' : 'text-zinc-500'}>
                Reorder Alerts
              </span>
              <AlertTriangle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${metrics.lowStockAlertCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`} />
            </div>
          </CardHeader>
          <CardContent className="p-2.5 sm:p-3 pt-0">
            <div className="text-base sm:text-xl font-black font-mono">
              {metrics.lowStockAlertCount} <span className={`text-[10px] sm:text-xs font-normal ${metrics.lowStockAlertCount > 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>Low</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar & Category Chips */}
      <Card className="bg-white border-zinc-200/80 p-3.5 sm:p-4 space-y-3.5 w-full min-w-0 rounded-3xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              id="input-inventory-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hardware, model #, brand, item..."
              className="pl-10 text-xs bg-zinc-50 border-zinc-200 focus:bg-white w-full rounded-2xl h-10"
            />
          </div>

          {/* Action Buttons & Mobile View Switcher */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* View Mode Switcher for Mobile */}
            <div className="flex md:hidden items-center bg-zinc-100 p-0.5 rounded-xl border border-zinc-200">
              <button
                onClick={() => setMobileViewMode('GRID')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  mobileViewMode === 'GRID' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-500'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setMobileViewMode('LIST')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  mobileViewMode === 'LIST' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-500'
                }`}
              >
                List
              </button>
            </div>

            <Button
              id="btn-filter-low-stock"
              variant={showLowStockOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className="flex items-center space-x-1.5 text-xs font-semibold rounded-2xl h-9"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock ({metrics.lowStockAlertCount})</span>
            </Button>

            <Button
              id="btn-add-hardware-item"
              onClick={onOpenAddItemModal}
              size="sm"
              className="hidden md:flex items-center space-x-1.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-2xl h-9"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Horizontal Pill Category Chips */}
        <div className="pt-2 border-t border-zinc-100 space-y-2">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-zinc-100/80 border border-zinc-200/80 text-zinc-700 hover:bg-zinc-200/60'
              }`}
            >
              All Items ({items.length})
            </button>
            {Object.keys(CATEGORY_DISPLAY_NAMES).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-zinc-100/80 border border-zinc-200/80 text-zinc-700 hover:bg-zinc-200/60'
                }`}
              >
                {CATEGORY_DISPLAY_NAMES[cat]}
              </button>
            ))}
          </div>

          {/* Secondary Brand Dropdown */}
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span className="text-[11px] font-medium">Showing {filteredItems.length} items</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Brand:</span>
              <select
                id="select-brand-filter"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 text-zinc-900 text-[11px] rounded-lg px-2 py-0.5 focus:outline-none focus:border-black font-semibold"
              >
                <option value="ALL">All Brands</option>
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Hardware Inventory View */}
      <div className="w-full min-w-0">
        {/* Mobile View Switcher Container (< md) */}
        <div id="mobile-hardware-cards" className="block md:hidden">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-zinc-400 space-y-2 border border-zinc-200">
              <Box className="w-8 h-8 mx-auto text-zinc-300" />
              <p className="text-xs font-medium">No solar hardware matching current filter parameters.</p>
            </div>
          ) : mobileViewMode === 'GRID' ? (
            /* 2-Column Product Grid */
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filteredItems.map((item) => {
                const availableStock = Math.max(0, item.stock_levels.current_stock - item.stock_levels.allocated_stock);
                const isLowStock = availableStock <= item.stock_levels.reorder_threshold || item.stock_levels.low_stock_alert;

                return (
                  <div
                    key={item.item_id}
                    className={`rounded-3xl p-3 border transition-all flex flex-col justify-between relative bg-white shadow-xs hover:shadow-md min-w-0 overflow-hidden ${
                      isLowStock ? 'border-rose-300 bg-rose-50/30' : 'border-zinc-200/80'
                    }`}
                  >
                    {/* Item Image Preview Container */}
                    <div className="relative mb-2.5 flex justify-center w-full min-w-0">
                      <div className="w-full h-28 rounded-2xl overflow-hidden relative flex items-center justify-center bg-zinc-100 border border-zinc-200/70">
                        <ItemThumbnail item={item} onClick={() => setPreviewImageItem(item)} className="w-full h-full rounded-2xl" />
                      </div>

                      {isLowStock && (
                        <span className="absolute top-2 right-2 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs z-10">
                          LOW
                        </span>
                      )}

                      <div className="absolute bottom-2 left-2 z-10 max-w-[85%] min-w-0 overflow-hidden">
                        <BrandBadge brand={item.brand_manufacturer} />
                      </div>
                    </div>

                    {/* Item Info */}
                    <div className="space-y-1 mb-2 min-w-0 w-full overflow-hidden">
                      <div className="mb-1 min-w-0 max-w-full overflow-hidden">
                        <CategoryBadge category={item.category} />
                      </div>
                      <h3 className="font-extrabold text-xs text-zinc-950 leading-snug line-clamp-2 break-words">
                        {item.item_description}
                      </h3>
                      <p className="text-[10px] font-mono text-zinc-500 truncate">
                        {item.model_number || item.item_id}
                      </p>
                    </div>

                    {/* Footer Stock Action */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-zinc-400 font-medium block">Current Stock</span>
                        <span className="font-black text-xs text-zinc-950 font-mono">
                          {item.stock_levels.current_stock} <span className="text-[9px] text-zinc-500 font-normal">{item.uom}</span>
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setAdjustModalItem(item);
                          setAdjustType('RESTOCK');
                          setAdjustQty(10);
                          setAdjustNote('');
                        }}
                        className="h-7 w-7 rounded-full bg-black text-white hover:bg-zinc-800 border-none shadow-2xs shrink-0 cursor-pointer"
                        title="Adjust Stock"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Refined Mobile List View */
            <Card className="bg-white border-zinc-200/90 overflow-hidden shadow-xs rounded-3xl divide-y divide-zinc-200/80">
              {filteredItems.map((item) => {
                const availableStock = Math.max(0, item.stock_levels.current_stock - item.stock_levels.allocated_stock);
                const isLowStock = availableStock <= item.stock_levels.reorder_threshold || item.stock_levels.low_stock_alert;

                return (
                  <div
                    key={item.item_id}
                    className={
                      isLowStock
                        ? "p-3.5 space-y-3 bg-rose-50/80 hover:bg-rose-100/80 border-l-4 border-l-rose-600 transition-colors"
                        : "p-3.5 space-y-3 bg-white hover:bg-zinc-50/50 transition-colors"
                    }
                  >
                    {/* Top Header: Image, Title, Category & Actions */}
                    <div className="flex items-start justify-between gap-2.5 min-w-0">
                      <div className="flex items-start space-x-3 min-w-0 flex-1">
                        <ItemThumbnail item={item} onClick={() => setPreviewImageItem(item)} />

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <CategoryBadge category={item.category} />
                            <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">
                              UOM: <strong className="text-zinc-900 font-bold">{item.uom}</strong>
                            </span>
                          </div>

                          <h3 className="font-extrabold text-xs sm:text-sm text-zinc-950 leading-tight break-words">
                            {item.item_description}
                          </h3>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <BrandBadge brand={item.brand_manufacturer} />
                            {item.model_number && (
                              <span className="text-[10px] font-mono font-semibold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/80 whitespace-nowrap">
                                {item.model_number}
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">({item.item_id})</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Edit & Delete Icons */}
                      <div className="flex items-center space-x-0.5 shrink-0 -mt-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit Item"
                          onClick={() => onEditItem(item)}
                          className="h-7 w-7 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete Item"
                          onClick={() => setDeletingItem(item)}
                          className="h-7 w-7 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Stock Levels & Movement Controls Bar */}
                    <div className="bg-zinc-50/90 p-2.5 sm:p-3 rounded-2xl border border-zinc-200/80 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 whitespace-nowrap">
                        <span className="text-zinc-950 font-black text-sm sm:text-base font-mono">
                          {item.stock_levels.current_stock}
                        </span>
                        <span className="text-zinc-500 text-xs font-semibold uppercase">
                          {item.uom}
                        </span>
                        {isLowStock && (
                          <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            LOW STOCK
                          </span>
                        )}
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <div className="flex items-center bg-white rounded-xl border border-zinc-200 p-0.5 shadow-2xs">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={item.stock_levels.current_stock <= 0 ? "Stock is already 0" : "Decrement stock -1"}
                            disabled={item.stock_levels.current_stock <= 0}
                            onClick={() => onUpdateStock(item.item_id, -1, 0, 'Quick -1 stock update')}
                            className="h-7 px-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-30 cursor-pointer rounded-lg"
                          >
                            <PackageMinus className="w-3.5 h-3.5 mr-0.5" />
                            -1
                          </Button>
                          <div className="w-px h-3.5 bg-zinc-200" />
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Increment stock +1"
                            onClick={() => onUpdateStock(item.item_id, 1, 0, 'Quick +1 stock restock')}
                            className="h-7 px-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 cursor-pointer rounded-lg"
                          >
                            <PackagePlus className="w-3.5 h-3.5 mr-0.5" />
                            +1
                          </Button>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjustModalItem(item);
                            setAdjustType('RESTOCK');
                            setAdjustQty(10);
                            setAdjustNote('');
                          }}
                          className="h-7 px-2.5 text-xs font-extrabold bg-white border-zinc-200 text-zinc-900 shadow-2xs rounded-xl cursor-pointer hover:bg-zinc-50"
                        >
                          <SlidersHorizontal className="w-3 h-3 mr-1 text-zinc-600" />
                          <span>Log Movement</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>

        {/* Mobile Floating + Add Item Pill Button */}
        <button
          onClick={onOpenAddItemModal}
          className="md:hidden fixed bottom-20 right-4 z-30 bg-black text-white text-xs font-bold px-4 py-3 rounded-full shadow-2xl border border-zinc-800 flex items-center space-x-2 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add Item</span>
        </button>

        {/* Desktop Table View (md+) */}
        <Card className="hidden md:block bg-white border-zinc-200 overflow-hidden shadow-xs w-full min-w-0 rounded-3xl">
          <div id="desktop-hardware-table" className="overflow-x-auto no-scrollbar">
          <table id="table-inventory-list" className="w-full text-left text-xs text-zinc-800">
            <thead className="bg-zinc-100/80 text-zinc-600 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-4">Item & Manufacturer</th>
                <th className="py-3.5 px-4">Category / UOM</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4 text-right">Stock Adjust & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-400 space-y-2">
                    <Box className="w-8 h-8 mx-auto text-zinc-300" />
                    <p className="text-xs font-medium">No solar hardware matching current filter parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const availableStock = Math.max(0, item.stock_levels.current_stock - item.stock_levels.allocated_stock);
                  const isLowStock = availableStock <= item.stock_levels.reorder_threshold || item.stock_levels.low_stock_alert;

                  return (
                    <tr
                      key={item.item_id}
                      className={
                        isLowStock
                          ? "bg-rose-50/90 text-rose-950 hover:bg-rose-100/90 border-l-4 border-l-rose-600 transition-colors"
                          : "hover:bg-zinc-50/80 transition-colors"
                      }
                    >
                      {/* Item & Manufacturer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <ItemThumbnail item={item} onClick={() => setPreviewImageItem(item)} />

                          <div className="min-w-0">
                            <div className="font-bold text-zinc-950 flex items-center space-x-2">
                              <span>{item.item_description}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <BrandBadge brand={item.brand_manufacturer} />
                              {item.model_number && (
                                <span className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/80">
                                  {item.model_number}
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-400 font-mono">
                                ({item.item_id})
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & UOM */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <CategoryBadge category={item.category} />
                          <div className="text-[11px] text-zinc-500 font-mono">
                            UOM: <span className="text-zinc-950 font-bold">{item.uom}</span>
                          </div>
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center space-x-1.5 whitespace-nowrap">
                          <span className="text-zinc-950 font-black text-sm">
                            {item.stock_levels.current_stock}
                          </span>
                          <span className="text-zinc-500 text-xs font-semibold">
                            {item.uom}
                          </span>
                          {isLowStock && (
                            <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              LOW
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quick Adjust & Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Stock adjustment controls */}
                          <div className="flex items-center bg-zinc-100 rounded-lg border border-zinc-200 p-0.5 space-x-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              title={item.stock_levels.current_stock <= 0 ? "Stock is already 0" : "Decrement current stock by 1"}
                              disabled={item.stock_levels.current_stock <= 0}
                              onClick={() => onUpdateStock(item.item_id, -1, 0, 'Quick -1 stock update')}
                              className="h-6 w-6 rounded hover:bg-white text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                            >
                              <PackageMinus className="w-3 h-3 text-rose-700" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Increment current stock by 1"
                              onClick={() => onUpdateStock(item.item_id, 1, 0, 'Quick +1 stock restock')}
                              className="h-6 w-6 rounded hover:bg-white text-zinc-700"
                            >
                              <PackagePlus className="w-3 h-3 text-emerald-700" />
                            </Button>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            title="Log Custom Movement (Restock / Remove)"
                            onClick={() => {
                              setAdjustModalItem(item);
                              setAdjustType('RESTOCK');
                              setAdjustQty(10);
                              setAdjustNote('');
                            }}
                            className="h-7 px-2 text-[11px] font-semibold flex items-center space-x-1 border-zinc-300"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-zinc-900" />
                            <span className="hidden sm:inline">Log Movement</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Item details"
                            onClick={() => onEditItem(item)}
                            className="h-7 w-7 text-zinc-600 hover:text-black hover:bg-zinc-100"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete Item"
                            onClick={() => setDeletingItem(item)}
                            className="h-7 w-7 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </div>

      {/* Stock Movement Dialog */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-zinc-950 flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-black" />
                  <span>Log Inventory Movement</span>
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  {adjustModalItem.brand_manufacturer} {adjustModalItem.model_number} ({adjustModalItem.item_id})
                </p>
              </div>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="text-zinc-400 hover:text-black p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyMovement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  Movement Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('RESTOCK')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer ${
                      adjustType === 'RESTOCK'
                        ? 'bg-black text-white border-black'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    + Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('REMOVED')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer ${
                      adjustType === 'REMOVED'
                        ? 'bg-black text-white border-black'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    - Remove / Get
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 mb-1">
                    Current Stock
                  </label>
                  <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-2.5 font-mono font-bold text-zinc-950">
                    {adjustModalItem.stock_levels.current_stock} {adjustModalItem.uom}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-800 mb-1">
                    Movement Qty ({adjustModalItem.uom}) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  Audit Reference Note / Project ID
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Received shipment PO-904, or Dispatched for Site A"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdjustModalItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-black hover:bg-zinc-800 text-white font-bold"
                >
                  Confirm & Log to Audit Trail
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4 text-zinc-950 my-auto">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-base text-zinc-950 leading-snug">Delete Hardware Item</h3>
                <p className="text-xs text-zinc-500 font-mono truncate">{deletingItem.item_id}</p>
              </div>
            </div>

            <div className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-1.5">
              <div className="font-bold text-zinc-950 text-sm leading-snug">
                {deletingItem.brand_manufacturer} — {deletingItem.item_description}
              </div>
              <p className="text-zinc-500 font-mono">Model #: {deletingItem.model_number || 'N/A'}</p>
              <p className="text-zinc-500 font-mono">Current Stock: {deletingItem.stock_levels.current_stock} {deletingItem.uom}</p>
              <p className="text-rose-700 font-semibold pt-1 border-t border-zinc-200/60 leading-relaxed">
                Are you sure you want to delete this hardware item? This will remove it from catalog inventory and record an item deletion event in the audit trail.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingItem(null)}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onDeleteItem(deletingItem.item_id);
                  setDeletingItem(null);
                }}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs cursor-pointer"
              >
                Confirm Delete Item
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Image Lightbox Preview Modal */}
      {previewImageItem && previewImageItem.image_url && (
        <div 
          onClick={() => setPreviewImageItem(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-zinc-200 my-auto relative"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50">
              <div className="flex items-center space-x-2 min-w-0">
                <Badge variant="default" className="text-[10px] uppercase font-bold shrink-0">
                  {previewImageItem.brand_manufacturer}
                </Badge>
                <h3 className="font-extrabold text-sm text-zinc-950 truncate">
                  {previewImageItem.item_description}
                </h3>
              </div>
              <button
                onClick={() => setPreviewImageItem(null)}
                className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-black transition-colors cursor-pointer shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-950 flex items-center justify-center min-h-[260px] max-h-[60vh] overflow-hidden p-3">
              <img
                src={previewImageItem.image_url}
                alt={previewImageItem.item_description}
                className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="p-4 bg-white flex items-center justify-between gap-3 text-xs border-t border-zinc-100">
              <div>
                <span className="text-zinc-400 font-mono text-[10px] block">Model Number</span>
                <span className="font-bold text-zinc-900 font-mono">{previewImageItem.model_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-mono text-[10px] block">Current Stock</span>
                <span className="font-bold text-zinc-900 font-mono">{previewImageItem.stock_levels.current_stock} {previewImageItem.uom}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const item = previewImageItem;
                  setPreviewImageItem(null);
                  onEditItem(item);
                }}
                className="text-xs font-bold"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Edit Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
