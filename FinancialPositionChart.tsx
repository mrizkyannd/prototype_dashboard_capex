import React from 'react';
import { FinancialRow, ProcurementRow, VowdRow, ProjectItem } from '../../types';

interface FinancialPositionChartProps {
  financialRow: FinancialRow | null;
  procurementRows: ProcurementRow[];
  vowdRows: VowdRow[];
  project: ProjectItem;
}

export function formatRupiahFull(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  const hasDecimals = num % 1 !== 0;
  return 'Rp ' + num.toLocaleString('id-ID', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export function formatRupiahCompactId(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  if (num === 0) return 'Rp 0';
  const abs = Math.abs(num);
  if (abs >= 1e12) {
    return `Rp ${(num / 1e12).toFixed(2).replace('.', ',')} T`;
  } else if (abs >= 1e9) {
    return `Rp ${(num / 1e9).toFixed(2).replace('.', ',')} M`;
  } else if (abs >= 1e6) {
    return `Rp ${(num / 1e6).toFixed(2).replace('.', ',')} Jt`;
  } else {
    return `Rp ${num.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
  }
}

function hasRealValue(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string' && val.trim() === '') return false;
  return true;
}

export const FinancialPositionChart: React.FC<FinancialPositionChartProps> = ({
  financialRow,
  procurementRows,
  vowdRows,
  project,
}) => {
  // 1. CAPEX Base
  const capexBase = hasRealValue(financialRow?.capexBaseDisplay)
    ? financialRow!.capexBaseDisplay!
    : (hasRealValue(financialRow?.capexBase) ? financialRow!.capexBase! : (project.capexBaseNum ?? null));

  // 2. CAPEX Inflated
  const capexInflated = hasRealValue(financialRow?.capexInflatedDisplay)
    ? financialRow!.capexInflatedDisplay!
    : (hasRealValue(financialRow?.capexInflated) ? financialRow!.capexInflated! : (project.capexInflatedNum ?? null));

  // 3. RAB
  const rab = hasRealValue(financialRow?.rabDisplay)
    ? financialRow!.rabDisplay!
    : (hasRealValue(financialRow?.rab) ? financialRow!.rab! : (project.rabNum ?? null));

  // 4. RKAP
  const rkap = hasRealValue(financialRow?.rkapDisplay)
    ? financialRow!.rkapDisplay!
    : (hasRealValue(financialRow?.rkap) ? financialRow!.rkap! : (project.rkapNum ?? null));

  // 5. OB
  const ob = hasRealValue(financialRow?.obDisplay)
    ? financialRow!.obDisplay!
    : (hasRealValue(financialRow?.ob) ? financialRow!.ob! : (project.obNum ?? null));

  // 6. PR = SUM(PR Line Value) for selected Project Key
  const pr = procurementRows.length > 0
    ? procurementRows.reduce((sum, r) => sum + (r.prLineValue || 0), 0)
    : (project.prNum ?? null);

  // 7. PO = SUM(PO Line Value) for selected Project Key
  const po = procurementRows.length > 0
    ? procurementRows.reduce((sum, r) => sum + (r.poLineValue || 0), 0)
    : (project.poNum ?? null);

  // 8. VOWD = SUM(VOWD) for selected Project Key
  const vowd = vowdRows.length > 0
    ? vowdRows.reduce((sum, r) => sum + (r.vowd || 0), 0)
    : (project.vowdNum ?? null);

  // 9. RNA
  const rna = financialRow?.rna ?? project.rnaNum ?? null;

  const metrics = [
    { label: 'CAPEX Base', val: capexBase, color: 'bg-[#004ac6]' },
    { label: 'CAPEX Inflated', val: capexInflated, color: 'bg-[#2563eb]' },
    { label: 'RAB', val: rab, color: 'bg-[#0284c7]' },
    { label: 'RKAP', val: rkap, color: 'bg-[#0d9488]' },
    { label: 'OB', val: ob, color: 'bg-[#059669]' },
    { label: 'PR', val: pr, color: 'bg-[#16a34a]' },
    { label: 'PO', val: po, color: 'bg-[#d97706]' },
    { label: 'VOWD', val: vowd, color: 'bg-[#4f46e5]' },
    { label: 'RNA', val: rna, color: 'bg-[#7c3aed]' },
  ];

  // Find max value among non-null values for scaling
  const validVals = metrics.map((m) => m.val).filter((v): v is number => v !== null && v !== undefined);
  const maxVal = validVals.length > 0 ? Math.max(...validVals) : 1;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {metrics.map((m, idx) => {
        const isNull = m.val === null || m.val === undefined;
        const pct = isNull ? 0 : Math.min(100, Math.max(2, (m.val! / maxVal) * 100));

        return (
          <div key={idx} className="group relative flex items-center gap-3 text-[12px]">
            {/* Label */}
            <div className="w-28 shrink-0 font-semibold text-[#434655] truncate" title={m.label}>
              {m.label}
            </div>

            {/* Bar Track & Fill */}
            <div className="flex-1 bg-[#f1f5f9] h-6 rounded border border-[#e2e8f0] relative overflow-hidden flex items-center px-2">
              {!isNull ? (
                <>
                  <div
                    className={`absolute left-0 top-0 bottom-0 ${m.color} transition-all duration-300 opacity-85 group-hover:opacity-100 rounded-r`}
                    style={{ width: `${pct}%` }}
                  />
                  <span className="relative z-10 font-mono font-bold text-[11px] text-[#161c22] drop-shadow-xs ml-1">
                    {formatRupiahCompactId(m.val)}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] italic">
                  <span className="w-2 h-2 rounded-full bg-[#cbd5e1]" />
                  <span>No Data (Null)</span>
                </div>
              )}
            </div>

            {/* Full Value Tooltip */}
            <div className="pointer-events-none absolute right-0 bottom-full mb-1 hidden group-hover:flex flex-col bg-[#0f172a] text-white text-[11px] rounded py-1.5 px-2.5 shadow-xl z-30 whitespace-nowrap border border-slate-700">
              <span className="font-bold text-sky-400">{m.label}</span>
              <span className="font-mono text-slate-100 mt-0.5">
                {isNull ? 'Missing / Null in source' : formatRupiahFull(m.val)}
              </span>
              {!isNull && (
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Compact: {formatRupiahCompactId(m.val)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
