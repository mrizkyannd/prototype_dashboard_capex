import React from 'react';
import { VowdRow } from '../../types';
import { formatRupiahFull, formatRupiahCompactId } from './FinancialPositionChart';

interface VowdByYearChartProps {
  vowdRows: VowdRow[];
  projectKey: string;
}

interface YearSlot {
  yearLabel: string;
  sourceYearKey: string;
  record: VowdRow | null;
  val: number | null;
  periodStatus: string;
  note?: string;
}

export const VowdByYearChart: React.FC<VowdByYearChartProps> = ({ vowdRows }) => {
  // Normalize year strings from vowdRows (e.g. "2023", "2024", "2025", "2026", "2026 YTD")
  const yearMap = new Map<string, VowdRow>();
  vowdRows.forEach((r) => {
    const yrStr = String(r.year || '').trim();
    if (yrStr.startsWith('2023')) yearMap.set('2023', r);
    else if (yrStr.startsWith('2024')) yearMap.set('2024', r);
    else if (yrStr.startsWith('2025')) yearMap.set('2025', r);
    else if (yrStr.startsWith('2026')) yearMap.set('2026', r);
  });

  const slots: YearSlot[] = [
    {
      yearLabel: '2023',
      sourceYearKey: '2023',
      record: yearMap.get('2023') || null,
      val: yearMap.get('2023')?.vowd ?? null,
      periodStatus: yearMap.get('2023')?.periodStatus || 'Historical',
    },
    {
      yearLabel: '2024',
      sourceYearKey: '2024',
      record: yearMap.get('2024') || null,
      val: yearMap.get('2024')?.vowd ?? null,
      periodStatus: yearMap.get('2024')?.periodStatus || 'Historical',
    },
    {
      yearLabel: '2025',
      sourceYearKey: '2025',
      record: yearMap.get('2025') || null,
      val: yearMap.get('2025')?.vowd ?? null,
      periodStatus: yearMap.get('2025')?.periodStatus || 'Historical',
    },
    {
      yearLabel: '2026 YTD',
      sourceYearKey: '2026',
      record: yearMap.get('2026') || null,
      val: yearMap.get('2026')?.vowd ?? null,
      periodStatus: yearMap.get('2026')?.periodStatus || 'Through Reporting Cut-Off',
      note: 'Reporting Cut-Off: 28 Jun 2026',
    },
  ];

  // Max value among existing valid values for height scaling
  const validVals = slots
    .map((s) => s.val)
    .filter((v): v is number => v !== null && v !== undefined);
  const maxVal = validVals.length > 0 ? Math.max(...validVals) : 1;

  const totalVowd = validVals.reduce((acc, v) => acc + v, 0);

  return (
    <div className="flex flex-col h-full justify-between gap-3 w-full">
      {/* Header Total Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-[#dde3eb]">
        <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
          Annual VOWD Breakdown
        </span>
        <div className="text-[12px] font-mono font-bold text-[#004ac6]">
          Total: {validVals.length > 0 ? formatRupiahFull(totalVowd) : 'No Records'}
        </div>
      </div>

      {/* 4-Year Columns Grid */}
      <div className="grid grid-cols-4 gap-3 bg-[#f8fafc] border border-[#dde3eb] rounded-lg p-3">
        {slots.map((s, idx) => {
          const isNull = s.val === null || s.val === undefined;
          const heightPct = isNull ? 0 : Math.min(100, Math.max(6, (s.val! / maxVal) * 100));

          return (
            <div
              key={idx}
              className="group relative flex flex-col items-center w-full"
            >
              {/* 1. ValueLabelArea */}
              <div className="h-6 flex items-center justify-center w-full mb-1">
                {!isNull ? (
                  <span className="text-[11px] font-mono font-bold text-[#161c22] text-center truncate px-1">
                    {formatRupiahCompactId(s.val)}
                  </span>
                ) : (
                  <span className="h-4" />
                )}
              </div>

              {/* 2. BarPlotArea (Fixed height container) */}
              <div className="w-full max-w-[64px] h-32 flex flex-col justify-end items-center relative">
                {!isNull ? (
                  <div
                    className="w-full bg-[#004ac6] hover:bg-[#2563eb] transition-all rounded-t shadow-xs"
                    style={{ height: `${heightPct}%` }}
                  />
                ) : (
                  <div className="w-full h-full border border-dashed border-[#cbd5e1] bg-[#f1f5f9] rounded flex flex-col items-center justify-center p-1 text-center">
                    <span className="text-[10px] font-semibold text-[#94a3b8]">No Record</span>
                  </div>
                )}
              </div>

              {/* 3. Year Label */}
              <div className="mt-2 text-center w-full">
                <span className="text-[12px] font-bold text-[#161c22] block font-mono">
                  {s.yearLabel}
                </span>
              </div>

              {/* 4. Status Badge */}
              <div className="mt-1 text-center w-full">
                <span
                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full inline-block ${
                    isNull
                      ? 'bg-[#f1f5f9] text-[#94a3b8]'
                      : 'bg-[#e0edff] text-[#004ac6] font-semibold'
                  }`}
                >
                  {isNull ? 'Missing' : s.periodStatus}
                </span>
              </div>

              {/* Tooltip Card */}
              <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-[#0f172a] text-white text-[11px] rounded p-2 shadow-xl z-30 whitespace-nowrap border border-slate-700 min-w-[170px]">
                <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-1">
                  <span className="font-bold text-sky-400 font-mono">{s.yearLabel}</span>
                  <span className="text-[10px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                    {s.periodStatus}
                  </span>
                </div>
                <div className="font-mono text-slate-100 text-[12px] font-bold mt-0.5">
                  {isNull ? 'No Data Recorded' : formatRupiahFull(s.val)}
                </div>
                {s.note && (
                  <div className="text-[10px] text-slate-400 mt-1 italic border-t border-slate-800 pt-1">
                    {s.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
