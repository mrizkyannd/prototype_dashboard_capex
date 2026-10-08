import React, { useState, useMemo } from 'react';
import { ProcurementRow } from '../../types';
import { formatRupiahFull, formatRupiahCompactId } from './FinancialPositionChart';
import { Search, ArrowRight, Layers, FileCode, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BudgetCodeMappingFlowProps {
  procurementRows: ProcurementRow[];
  projectKey: string;
}

const hasRealVal = (v?: string | null): v is string =>
  v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '—';

const getVisibleRkapCode = (r: { kodeBudgetRkapDisplay?: string | null; kodeBudgetRkap?: string | null }) => {
  if (hasRealVal(r.kodeBudgetRkapDisplay)) return r.kodeBudgetRkapDisplay;
  if (hasRealVal(r.kodeBudgetRkap)) return r.kodeBudgetRkap;
  return null;
};

export const BudgetCodeMappingFlow: React.FC<BudgetCodeMappingFlowProps> = ({
  procurementRows,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Group procurement rows & collect unique entities
  const flowData = useMemo(() => {
    // Collect distinct RKAP Budget Codes
    const rkapCodes = Array.from(
      new Set(procurementRows.map((r) => getVisibleRkapCode(r)).filter((c): c is string => Boolean(c)))
    );

    // Collect distinct PR/PO Budget Codes
    const prPoCodes = Array.from(
      new Set(procurementRows.map((r) => r.kodeBudgetPrPo).filter((c): c is string => Boolean(c && c.trim())))
    );

    // Filter rows based on search
    const q = searchTerm.trim().toLowerCase();
    const filteredRows = procurementRows.filter((r) => {
      if (!q) return true;
      const visRkap = getVisibleRkapCode(r);
      return (
        (visRkap && visRkap.toLowerCase().includes(q)) ||
        (r.kodeBudgetRkap && r.kodeBudgetRkap.toLowerCase().includes(q)) ||
        (r.kodeBudgetPrPo && r.kodeBudgetPrPo.toLowerCase().includes(q)) ||
        (r.prNumber && r.prNumber.toLowerCase().includes(q)) ||
        (r.poNumber && r.poNumber.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    });

    const uniquePrs = new Set(filteredRows.map((r) => r.prNumber).filter(Boolean));
    const uniquePos = new Set(filteredRows.map((r) => r.poNumber).filter(Boolean));
    const prWithoutPoCount = filteredRows.filter((r) => r.prNumber && (!r.poNumber || r.poNumber === '—')).length;

    return {
      rkapCodes,
      prPoCodes,
      rows: filteredRows,
      uniquePrCount: uniquePrs.size,
      uniquePoCount: uniquePos.size,
      prWithoutPoCount,
    };
  }, [procurementRows, searchTerm]);

  // Find hovered item path
  const activeRow = useMemo(() => {
    if (!hoveredRowId) return null;
    return procurementRows.find((r) => r.procurementLineKey === hoveredRowId || r.prNumber === hoveredRowId) || null;
  }, [hoveredRowId, procurementRows]);

  if (!procurementRows || procurementRows.length === 0) {
    return (
      <div className="h-36 border border-dashed border-[#c3c6d7] rounded bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="w-5 h-5 text-[#94a3b8] mb-1" />
        <span className="text-[13px] font-semibold text-[#5c647a]">No Procurement Data Found</span>
        <span className="text-[11px] text-[#94a3b8]">No procurement lines available for this project.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Top Controls & Summary Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#dde3eb]">
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold">
          <span className="bg-[#e0edff] text-[#004ac6] px-2.5 py-1 rounded-full flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {flowData.rkapCodes.length > 0 ? `${flowData.rkapCodes.length} RKAP Code` : 'No RKAP Code'}
          </span>
          <span className="bg-[#eef2ff] text-[#4f46e5] px-2.5 py-1 rounded-full flex items-center gap-1">
            <FileCode className="w-3 h-3" />
            {flowData.prPoCodes.length > 0 ? `${flowData.prPoCodes.length} PR/PO Code` : 'No PR/PO Code'}
          </span>
          <span className="bg-[#f0fdf4] text-[#16a34a] px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {flowData.uniquePrCount} PRs
          </span>
          <span className="bg-[#fff7ed] text-[#ea580c] px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {flowData.uniquePoCount} POs ({flowData.prWithoutPoCount} PR without PO)
          </span>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter PR / PO / Code..."
            className="w-full text-[12px] pl-8 pr-3 py-1 bg-white border border-[#c3c6d7] rounded focus:outline-none focus:border-[#004ac6]"
          />
        </div>
      </div>

      {/* Main Flow Table / Tree Container */}
      <div className="max-h-[440px] overflow-auto border border-[#c3c6d7] rounded-lg bg-[#f8fafc] p-2">
        {/* Stage Columns Headers */}
        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-[#565e74] uppercase tracking-wider bg-[#f1f5f9] p-2 rounded border-b border-[#cbd5e1] sticky top-0 z-10">
          <div className="col-span-3">1. Kode Budget RKAP</div>
          <div className="col-span-3">2. Kode Budget PR/PO</div>
          <div className="col-span-3">3. PR Number & Value</div>
          <div className="col-span-3">4. PO Number & Value</div>
        </div>

        {/* Rows Mapping List */}
        <div className="divide-y divide-[#e2e8f0] mt-1">
          {flowData.rows.map((row, idx) => {
            const isHovered =
              hoveredRowId === row.procurementLineKey ||
              hoveredRowId === row.prNumber ||
              (activeRow && activeRow.prNumber === row.prNumber);

            const hasPo = Boolean(row.poNumber && row.poNumber !== '—');

            return (
              <div
                key={row.procurementLineKey || `flow-row-${idx}`}
                onMouseEnter={() => setHoveredRowId(row.procurementLineKey)}
                onMouseLeave={() => setHoveredRowId(null)}
                className={`grid grid-cols-12 gap-2 py-2 px-2 items-center text-[12px] transition-colors rounded ${
                  isHovered ? 'bg-[#e0edff] border-l-4 border-l-[#004ac6]' : 'hover:bg-[#f1f5f9]'
                }`}
              >
                {/* Level 1: Kode Budget RKAP */}
                <div className="col-span-3 flex items-center gap-1.5 overflow-hidden">
                  {(() => {
                    const visCode = getVisibleRkapCode(row);
                    return (
                      <span
                        className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] truncate ${
                          visCode
                            ? 'bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]'
                            : 'bg-[#f1f5f9] text-[#94a3b8] italic'
                        }`}
                        title={visCode || 'Blank RKAP Budget Code'}
                      >
                        {visCode || '—'}
                      </span>
                    );
                  })()}
                  <ArrowRight className="w-3 h-3 text-[#94a3b8] shrink-0" />
                </div>

                {/* Level 2: Kode Budget PR/PO */}
                <div className="col-span-3 flex items-center gap-1.5 overflow-hidden">
                  <span
                    className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] truncate ${
                      row.kodeBudgetPrPo
                        ? 'bg-[#e0e7ff] text-[#3730a3] border border-[#c7d2fe]'
                        : 'bg-[#f1f5f9] text-[#94a3b8] italic'
                    }`}
                    title={row.kodeBudgetPrPo || 'Blank PR/PO Budget Code'}
                  >
                    {row.kodeBudgetPrPo || '—'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-[#94a3b8] shrink-0" />
                </div>

                {/* Level 3: PR Number */}
                <div className="col-span-3 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-1 font-mono font-bold text-[#004ac6] text-[11px] truncate">
                    <span title={row.prNumber || 'No PR'}>{row.prNumber || '—'}</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#475569]">
                    {row.prLineValue ? formatRupiahCompactId(row.prLineValue) : '—'}
                    {row.prDate && <span className="text-[#94a3b8] ml-1">({row.prDate})</span>}
                  </div>
                </div>

                {/* Level 4: PO Number or Terminal Node 'No PO' */}
                <div className="col-span-3 flex flex-col overflow-hidden">
                  {hasPo ? (
                    <>
                      <div className="font-mono font-bold text-[#0f172a] text-[11px] truncate" title={row.poNumber!}>
                        {row.poNumber}
                      </div>
                      <div className="text-[10px] font-mono text-[#059669]">
                        {row.poLineValue ? formatRupiahCompactId(row.poLineValue) : '—'}
                        {row.poDate && <span className="text-[#94a3b8] ml-1">({row.poDate})</span>}
                      </div>
                    </>
                  ) : (
                    <div className="inline-flex items-center gap-1 bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5] px-2 py-0.5 rounded text-[10px] font-bold font-mono w-fit">
                      <AlertTriangle className="w-3 h-3 text-[#ea580c]" />
                      <span>No PO</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Detail Drawer / Active Hover Card */}
      {activeRow && (
        <div className="bg-[#0f172a] text-white p-3 rounded-lg text-[12px] flex flex-col gap-1 border border-slate-700 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-bold text-sky-400 font-mono">
              PR: {activeRow.prNumber || 'N/A'} {activeRow.poNumber ? `→ PO: ${activeRow.poNumber}` : '→ [No PO]'}
            </span>
            <span className="text-[10px] text-slate-400">
              RKAP Code: {getVisibleRkapCode(activeRow) || 'None'} | PR/PO Code: {activeRow.kodeBudgetPrPo || 'None'}
            </span>
          </div>
          <div className="text-slate-200 mt-1 line-clamp-2">
            <span className="text-slate-400 font-semibold">Description: </span>
            {activeRow.description || 'No description provided'}
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono mt-1 text-slate-300">
            <span>PR Value: <strong className="text-emerald-400">{formatRupiahFull(activeRow.prLineValue)}</strong></span>
            <span>PO Value: <strong className="text-amber-400">{formatRupiahFull(activeRow.poLineValue)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
