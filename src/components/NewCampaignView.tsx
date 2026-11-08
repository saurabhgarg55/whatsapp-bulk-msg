/**
 * New Campaign View: Excel/CSV import, column mapping, inline editing,
 * campaign composer, image upload, checklist verification, and launch desk.
 */

import React, { useState, useRef } from 'react';
import {
  CampaignConfig,
  CampaignImage,
  DealerRow,
  ActiveView,
  RowStatus,
} from '../types';
import {
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Copy,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Smartphone,
  Eye,
  Settings2,
} from 'lucide-react';
import {
  readExcelOrCsvFile,
  getRowsFromSheet,
  detectHeaderAndColumns,
  processDealerRows,
  generateSampleExcelFile,
} from '../utils/excel';
import { normalizePhoneNumber, SUPPORTED_COUNTRIES } from '../utils/phone';
import { personalizeMessage } from '../utils/template';

interface NewCampaignViewProps {
  config: CampaignConfig;
  onUpdateConfig: (updated: Partial<CampaignConfig>) => void;
  dealers: DealerRow[];
  onSetDealers: (dealers: DealerRow[]) => void;
  image: CampaignImage | null;
  onSetImage: (img: CampaignImage | null) => void;
  onLaunchDesk: () => void;
  onOpenTestModal: () => void;
  onNavigate: (view: ActiveView) => void;
}

export const NewCampaignView: React.FC<NewCampaignViewProps> = ({
  config,
  onUpdateConfig,
  dealers,
  onSetDealers,
  image,
  onSetImage,
  onLaunchDesk,
  onOpenTestModal,
  onNavigate,
}) => {
  // Workbook & Import state
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [headerOptions, setHeaderOptions] = useState<string[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<{
    headerRowIndex: number;
    nameColIndex: number;
    phoneColIndex: number;
  }>({ headerRowIndex: 0, nameColIndex: 0, phoneColIndex: 1 });
  const [showColumnMapper, setShowColumnMapper] = useState(false);

  // Table filter & search state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editNameVal, setEditNameVal] = useState('');
  const [editPhoneVal, setEditPhoneVal] = useState('');

  // Checklist states (pre-checked by default)
  const [checkExistingDealers, setCheckExistingDealers] = useState(true);
  const [checkWhatsAppOpen, setCheckWhatsAppOpen] = useState(true);
  const [checkTestedNumber, setCheckTestedNumber] = useState(true);

  // Collapsible advanced settings
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Drag and drop highlights
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChosen = async (file: File) => {
    try {
      setFileName(file.name);
      const buffer = await file.arrayBuffer();
      setFileBuffer(buffer);

      const parsed = await readExcelOrCsvFile(file);
      setSheetNames(parsed.sheetNames);
      setSelectedSheet(parsed.activeSheet);

      applySheetData(parsed.rows, config.defaultCountry);
    } catch {
      alert('Could not read the selected file. Please make sure it is a valid .xlsx, .xls, or .csv spreadsheet.');
    }
  };

  const applySheetData = (rows: unknown[][], defaultCountry: string) => {
    const detection = detectHeaderAndColumns(rows);
    setHeaderOptions(detection.headers);
    setDetectedHeaders({
      headerRowIndex: detection.headerRowIndex,
      nameColIndex: detection.nameColIndex,
      phoneColIndex: detection.phoneColIndex,
    });

    const parsedDealers = processDealerRows(
      rows,
      detection.headerRowIndex,
      detection.nameColIndex,
      detection.phoneColIndex,
      defaultCountry
    );
    onSetDealers(parsedDealers);
  };

  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (!fileBuffer) return;
    const rows = getRowsFromSheet(fileBuffer, sheet);
    applySheetData(rows, config.defaultCountry);
  };

  const handleManualRemap = (
    newHeaderRowIdx: number,
    newNameColIdx: number,
    newPhoneColIdx: number
  ) => {
    if (!fileBuffer) return;
    const rows = getRowsFromSheet(fileBuffer, selectedSheet);
    setDetectedHeaders({
      headerRowIndex: newHeaderRowIdx,
      nameColIndex: newNameColIdx,
      phoneColIndex: newPhoneColIdx,
    });
    const parsedDealers = processDealerRows(
      rows,
      newHeaderRowIdx,
      newNameColIdx,
      newPhoneColIdx,
      config.defaultCountry
    );
    onSetDealers(parsedDealers);
  };

  // Image Upload handler
  const handleImageChosen = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }
    // Clean up previous image URL to prevent memory leaks
    if (image?.objectUrl) {
      URL.revokeObjectURL(image.objectUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    onSetImage({
      file,
      objectUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  };

  // Inline Row Editing
  const startEditRow = (row: DealerRow) => {
    setEditingRowId(row.id);
    setEditNameVal(row.cleanName);
    setEditPhoneVal(row.rawPhone);
  };

  const saveEditRow = (id: string) => {
    const updated = dealers.map((d) => {
      if (d.id !== id) return d;
      const validation = normalizePhoneNumber(editPhoneVal, config.defaultCountry);
      const status: RowStatus = !editPhoneVal.trim()
        ? 'missing_number'
        : validation.isValid
        ? 'valid'
        : 'invalid';

      return {
        ...d,
        rawName: editNameVal,
        cleanName: editNameVal.trim() || 'Sir/Madam',
        rawPhone: editPhoneVal,
        normalizedPhone: validation.normalizedDigits,
        formattedDisplayPhone: validation.formattedDisplay || editPhoneVal,
        countryCode: validation.countryCode,
        status,
        warning: validation.warning,
        errorReason: validation.errorReason,
      };
    });
    onSetDealers(updated);
    setEditingRowId(null);
  };

  const removeRow = (id: string) => {
    onSetDealers(dealers.filter((d) => d.id !== id));
  };

  const toggleSelectRow = (id: string) => {
    onSetDealers(dealers.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d)));
  };

  const handleSelectAllValid = (selected: boolean) => {
    onSetDealers(
      dealers.map((d) => (d.status === 'valid' ? { ...d, selected } : d))
    );
  };

  // Metric counts
  const totalCount = dealers.length;
  const validCount = dealers.filter((d) => d.status === 'valid').length;
  const invalidCount = dealers.filter((d) => d.status === 'invalid').length;
  const duplicateCount = dealers.filter((d) => d.status === 'duplicate').length;
  const missingCount = dealers.filter((d) => d.status === 'missing_number').length;
  const selectedCount = dealers.filter((d) => d.selected).length;

  // Filtered rows for preview table
  const filteredDealers = dealers.filter((d) => {
    if (filterStatus === 'valid' && d.status !== 'valid') return false;
    if (filterStatus === 'invalid' && d.status !== 'invalid') return false;
    if (filterStatus === 'duplicate' && d.status !== 'duplicate') return false;
    if (filterStatus === 'missing' && d.status !== 'missing_number') return false;
    if (filterStatus === 'selected' && !d.selected) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (d.cleanName || '').toLowerCase().includes(q);
      const matchPhone = (d.rawPhone || '').includes(q) || (d.normalizedPhone || '').includes(q);
      return matchName || matchPhone;
    }
    return true;
  });

  // First selected dealer for live preview
  const firstSelectedDealer = dealers.find((d) => d.selected) || dealers[0];
  const liveMessagePreview = personalizeMessage(
    config.messageTemplate,
    firstSelectedDealer?.cleanName,
    config.appendStopNotice
  );

  // Ready to launch checks
  const canLaunch =
    selectedCount > 0 &&
    image !== null &&
    checkExistingDealers &&
    checkWhatsAppOpen &&
    checkTestedNumber;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#C9A24B]">
            Troika Campaign Desk Setup
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Configure &amp; Preview Campaign
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Import dealer contacts, compose personalized message, and prepare promotional photo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={generateSampleExcelFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample Excel
          </button>

          <button
            type="button"
            onClick={onOpenTestModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#C9A24B]" />
            Test With My Own Number
          </button>
        </div>
      </div>

      {/* Grid: Left Column (Import & Dealers Table) | Right Column (Message Composer & Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Data Import & Contacts Preview */}
        <div className="lg:col-span-7 space-y-6">
          {/* File Upload Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#0B1F3A]" />
                1. Upload Dealer Contacts (.xlsx, .xls, .csv)
              </h2>
              {fileName && (
                <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">
                  {fileName}
                </span>
              )}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingExcel(true);
              }}
              onDragLeave={() => setIsDraggingExcel(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingExcel(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChosen(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDraggingExcel
                  ? 'border-[#0B1F3A] bg-blue-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChosen(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-800 mb-0.5">
                Click or drag &amp; drop dealer spreadsheet here
              </p>
              <p className="text-[11px] text-slate-500">
                Supports up to 200+ contacts, Devanagari numerals, scientific notations, and UTF-8 BOM
              </p>
            </div>

            {/* Multi-sheet selector if present */}
            {sheetNames.length > 1 && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-semibold text-slate-700">Choose Sheet:</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium text-slate-800"
                >
                  {sheetNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Column Mapping Toggle */}
            {headerOptions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowColumnMapper(!showColumnMapper)}
                  className="text-xs font-semibold text-[#0B1F3A] hover:underline flex items-center gap-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {showColumnMapper ? 'Hide Column Mapping' : 'Adjust Detected Columns & Header Row'}
                </button>

                {showColumnMapper && (
                  <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Header Row (Row #{detectedHeaders.headerRowIndex + 1})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={detectedHeaders.headerRowIndex + 1}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) - 1 || 0);
                          handleManualRemap(val, detectedHeaders.nameColIndex, detectedHeaders.phoneColIndex);
                        }}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Dealer Name Column
                      </label>
                      <select
                        value={detectedHeaders.nameColIndex}
                        onChange={(e) => {
                          handleManualRemap(
                            detectedHeaders.headerRowIndex,
                            parseInt(e.target.value, 10),
                            detectedHeaders.phoneColIndex
                          );
                        }}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                      >
                        {headerOptions.map((h, i) => (
                          <option key={i} value={i}>
                            Col {i + 1}: {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        WhatsApp / Phone Column
                      </label>
                      <select
                        value={detectedHeaders.phoneColIndex}
                        onChange={(e) => {
                          handleManualRemap(
                            detectedHeaders.headerRowIndex,
                            detectedHeaders.nameColIndex,
                            parseInt(e.target.value, 10)
                          );
                        }}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                      >
                        {headerOptions.map((h, i) => (
                          <option key={i} value={i}>
                            Col {i + 1}: {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact List Table with Verification & Inline Edits */}
          {dealers.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Summary Counts Bar */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Contacts Overview:</span>
                  <span className="text-slate-600 font-mono font-medium">
                    {totalCount} Total
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-emerald-700 font-semibold font-mono">
                    {validCount} Valid
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-rose-700 font-semibold font-mono">
                    {invalidCount + missingCount} Issues
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-amber-700 font-semibold font-mono">
                    {duplicateCount} Duplicates
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    {selectedCount} Selected for Send
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllValid(selectedCount < validCount)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {selectedCount < validCount ? 'Select All Valid' : 'Deselect All'}
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      filterStatus === 'all'
                        ? 'bg-[#0B1F3A] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('valid')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      filterStatus === 'valid'
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Valid ({validCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('duplicate')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      filterStatus === 'duplicate'
                        ? 'bg-amber-700 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Duplicates ({duplicateCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('invalid')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      filterStatus === 'invalid'
                        ? 'bg-rose-700 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Invalid ({invalidCount})
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]"
                />
              </div>

              {/* Table */}
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 select-none">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">Send</th>
                      <th className="py-2.5 px-3 w-12 text-slate-500">Row</th>
                      <th className="py-2.5 px-3">Dealer Name</th>
                      <th className="py-2.5 px-3">WhatsApp Phone</th>
                      <th className="py-2.5 px-3">Status / Notes</th>
                      <th className="py-2.5 px-3 w-16 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredDealers.map((d) => {
                      const isEditing = editingRowId === d.id;

                      return (
                        <tr
                          key={d.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !d.selected ? 'opacity-70 bg-slate-50/40' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={d.selected}
                              onChange={() => toggleSelectRow(d.id)}
                              className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-400">
                            #{d.rawIndex}
                          </td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editNameVal}
                                onChange={(e) => setEditNameVal(e.target.value)}
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                              />
                            ) : (
                              <div className="font-medium text-slate-900">
                                {d.cleanName}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPhoneVal}
                                onChange={(e) => setEditPhoneVal(e.target.value)}
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                              />
                            ) : (
                              <div>
                                <span className="font-mono font-medium">
                                  {d.normalizedPhone ? `+${d.normalizedPhone}` : d.rawPhone || '—'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {d.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Valid
                              </span>
                            )}
                            {d.status === 'duplicate' && (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Duplicate (Row #{d.duplicateOfIndex})
                              </span>
                            )}
                            {d.status === 'invalid' && (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {d.errorReason || 'Invalid'}
                              </span>
                            )}
                            {d.status === 'missing_number' && (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Missing Number
                              </span>
                            )}
                            {d.warning && (
                              <div className="text-[11px] text-amber-600 mt-0.5">
                                {d.warning}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => saveEditRow(d.id)}
                                className="px-2 py-0.5 bg-[#0B1F3A] text-white rounded text-[11px] font-semibold"
                              >
                                Save
                              </button>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditRow(d)}
                                  className="text-slate-400 hover:text-slate-700 p-1"
                                  title="Edit contact"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeRow(d.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                  title="Delete contact"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Composer, Image Upload & Launch */}
        <div className="lg:col-span-5 space-y-6">
          {/* Campaign Details & Template */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white text-[10px] flex items-center justify-center font-bold">
                2
              </span>
              Campaign Message Composer
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campaign Name / Internal Reference
              </label>
              <input
                type="text"
                placeholder="e.g. Troika Luxury Bathware Monsoon 2026 Promo"
                value={config.campaignName}
                onChange={(e) => onUpdateConfig({ campaignName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Message Template
                </label>
                <span className="text-[11px] text-slate-500">
                  Use <code className="bg-slate-100 text-[#0B1F3A] px-1 py-0.5 rounded font-mono font-bold">{'{name}'}</code> for dealer name
                </span>
              </div>
              <textarea
                rows={5}
                value={config.messageTemplate}
                onChange={(e) => onUpdateConfig({ messageTemplate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="appendStopNotice"
                checked={config.appendStopNotice}
                onChange={(e) => onUpdateConfig({ appendStopNotice: e.target.checked })}
                className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="appendStopNotice" className="text-xs text-slate-700 cursor-pointer">
                Append opt-out notice: &ldquo;Reply STOP if you do not want these messages.&rdquo;
              </label>
            </div>

            {/* Live Message Preview */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Live Preview for First Dealer ({firstSelectedDealer?.cleanName || 'Sir/Madam'}):
              </span>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {liveMessagePreview}
              </div>
            </div>
          </div>

          {/* Image Upload Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#0B1F3A]" />
                3. Promotional Image (ONE Image)
              </h2>
              {image && (
                <button
                  type="button"
                  onClick={() => onSetImage(null)}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            {image ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center max-h-60">
                  <img
                    src={image.objectUrl}
                    alt="Promotional Campaign Preview"
                    className="max-h-60 w-auto object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium truncate max-w-[220px]">{image.name}</span>
                  <span className="font-mono text-slate-500">
                    {(image.size / 1024).toFixed(0)} KB · PNG/JPG
                  </span>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingImage(true);
                }}
                onDragLeave={() => setIsDraggingImage(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingImage(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleImageChosen(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => imageInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDraggingImage
                    ? 'border-[#0B1F3A] bg-blue-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageChosen(e.target.files[0]);
                    }
                  }}
                />
                <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-800 mb-0.5">
                  Click or drag &amp; drop promotional catalog photo
                </p>
                <p className="text-[11px] text-slate-500">
                  JPG, PNG, or WebP. Held in React memory only.
                </p>
              </div>
            )}
          </div>

          {/* Advanced Sending Preferences (Pacing & Link Mode) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-800"
            >
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-[#0B1F3A]" />
                Sending Options &amp; Cooldown Pacing
              </span>
              {showAdvancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedSettings && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-4 text-xs">
                {/* Default Country */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Country for Local Numbers
                  </label>
                  <select
                    value={config.defaultCountry}
                    onChange={(e) => {
                      const newCountry = e.target.value;
                      onUpdateConfig({ defaultCountry: newCountry });
                      if (fileBuffer) {
                        const rows = getRowsFromSheet(fileBuffer, selectedSheet);
                        applySheetData(rows, newCountry);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cooldown Seconds */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Cooldown Delay Between Chats
                    </label>
                    <span className="font-mono text-slate-600 font-bold">
                      {config.cooldownSeconds}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={config.cooldownSeconds}
                    onChange={(e) =>
                      onUpdateConfig({ cooldownSeconds: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-[#0B1F3A] cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Slows down chat opening pace to safeguard Troika WhatsApp numbers from rapid burst restrictions.
                  </p>
                </div>

                {/* Break Interval */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Remind to Take a Break Every N Chats
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    step="5"
                    value={config.breakInterval}
                    onChange={(e) =>
                      onUpdateConfig({ breakInterval: parseInt(e.target.value, 10) || 40 })
                    }
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                {/* Message Mode */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Message Pre-fill Mode
                  </label>
                  <div className="space-y-1.5">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="messageMode"
                        value="prefill"
                        checked={config.messageMode === 'prefill'}
                        onChange={() => onUpdateConfig({ messageMode: 'prefill' })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-semibold text-slate-800">Mode A: Pre-fill message in WhatsApp link (default)</span>
                        <p className="text-[11px] text-slate-500">Opens chat with text pre-populated in the compose box.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="messageMode"
                        value="blank"
                        checked={config.messageMode === 'blank'}
                        onChange={() => onUpdateConfig({ messageMode: 'blank' })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-semibold text-slate-800">Mode B: Open blank chat</span>
                        <p className="text-[11px] text-slate-500">Opens chat with empty compose box; user manually pastes caption.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Link Type */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    WhatsApp Protocol / Direct Link Mode
                  </label>
                  <select
                    value={config.linkType}
                    onChange={(e) => onUpdateConfig({ linkType: e.target.value as 'desktop' | 'web' | 'wame' })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                  >
                    <option value="desktop">Windows WhatsApp Desktop App (whatsapp:// protocol) [Default / Recommended]</option>
                    <option value="web">Direct WhatsApp Web (web.whatsapp.com)</option>
                    <option value="wame">wa.me (Universal Web Redirect)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Pre-Campaign Verification Checklist */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pre-Campaign Checklist
              </h3>
              <button
                type="button"
                onClick={() => {
                  const allActive = checkExistingDealers && checkWhatsAppOpen && checkTestedNumber;
                  setCheckExistingDealers(!allActive);
                  setCheckWhatsAppOpen(!allActive);
                  setCheckTestedNumber(!allActive);
                }}
                className="text-[11px] font-semibold text-[#0B1F3A] hover:underline cursor-pointer"
              >
                {checkExistingDealers && checkWhatsAppOpen && checkTestedNumber ? 'Uncheck All' : 'Check All'}
              </button>
            </div>
            <p className="text-[11px] text-slate-600">
              Pre-confirmed safe defaults for Troika dealer outreach:
            </p>

            <div className="space-y-2 text-xs text-slate-800">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkExistingDealers}
                  onChange={(e) => setCheckExistingDealers(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#0B1F3A] focus:ring-0 cursor-pointer"
                />
                <span>These are existing Troika dealers who expect our communications.</span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkWhatsAppOpen}
                  onChange={(e) => setCheckWhatsAppOpen(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#0B1F3A] focus:ring-0 cursor-pointer"
                />
                <span>WhatsApp Windows Desktop App (or Web) is ready on this computer.</span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={image !== null}
                  readOnly
                  className="mt-0.5 w-4 h-4 rounded text-[#0B1F3A] focus:ring-0"
                />
                <span className={image ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                  Promotional image selected ({image ? image.name : 'Missing image'}).
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkTestedNumber}
                  onChange={(e) => setCheckTestedNumber(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#0B1F3A] focus:ring-0 cursor-pointer"
                />
                <span>I verified the promotional message and recipient list.</span>
              </label>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!canLaunch}
                onClick={onLaunchDesk}
                className="w-full py-3 px-4 bg-[#0B1F3A] hover:bg-[#162E52] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-[#C9A24B]" />
                Launch Assisted Send Desk ({selectedCount} Dealers Selected)
              </button>
              {!canLaunch && (
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  Complete the checklist and ensure at least 1 dealer &amp; image are selected.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
