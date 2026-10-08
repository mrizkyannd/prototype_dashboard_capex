import React, { useState, useMemo } from 'react';
import { RouteId } from '../types';
import { Download, Receipt, BarChart2, Clock } from 'lucide-react';
import { useData } from '../context/DataContext';

interface VowdAndRnaProps {
  onNavigate: (route: RouteId) => void;
}

const SIX_BUNDLINGS = [
  'SPAM Jatiluhur Hilir',
  'SPAM Karian Serpong Hilir',
  'SPAM Buaran 3 Hulu',
  'SPAM Buaran 3 Hilir',
  'Sambungan Rumah',
  'Cyclical Maintenance',
];

function formatRupiah(
  val: number | null | undefined
): string {
  if (val === null || val === undefined) return '—';

  return 'Rp ' + Math.round(val).toLocaleString('id-ID', {
    maximumFractionDigits: 0,
  });
}

export const VowdAndRna: React.FC<VowdAndRnaProps> = () => {
  const {
    controlRows,
    projects,
    getFilteredFinancialTotals,
    getFilteredProcurementTotals,
    getFilteredVowdTotals,
  } = useData();

  const [projectTypeFilter, setProjectTypeFilter] = useState('All');
  const [bundlingFilter, setBundlingFilter] = useState('All');
  const [scheduleFilter, setScheduleFilter] = useState('All');
  const [tokFilter, setTokFilter] = useState('All');

  const tokOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.tok && p.tok.trim()) set.add(p.tok.trim());
    });
    const sorted = Array.from(set).sort((a, b) => {
      const timeA = Date.parse(a);
      const timeB = Date.parse(b);
      if (!isNaN(timeA) && !isNaN(timeB)) return timeA - timeB;
      return a.localeCompare(b);
    });
    return ['All', ...sorted];
  }, [projects]);

  const isPortfolioDefault =
    projectTypeFilter === 'All' &&
    bundlingFilter === 'All' &&
    scheduleFilter === 'All' &&
    tokFilter === 'All';

  const isBundlingOnly =
    projectTypeFilter === 'All' &&
    bundlingFilter !== 'All' &&
    scheduleFilter === 'All' &&
    tokFilter === 'All';

  const isDetailFiltered =
    projectTypeFilter !== 'All' ||
    scheduleFilter !== 'All' ||
    tokFilter !== 'All';

  const isOfficialControl = isPortfolioDefault || isBundlingOnly;

  // Filter DASH_PROJECT rows
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (projectTypeFilter !== 'All' && p.projectType !== projectTypeFilter) return false;
      if (bundlingFilter !== 'All' && p.projectBundling !== bundlingFilter) return false;
      if (scheduleFilter !== 'All' && p.schedule !== scheduleFilter) return false;
      if (tokFilter !== 'All' && p.tok !== tokFilter) return false;
      return true;
    });
  }, [projects, projectTypeFilter, bundlingFilter, scheduleFilter, tokFilter]);

  const matchingKeysSet = useMemo(() => {
    return new Set(filteredProjects.map(p => p.projectKey));
  }, [filteredProjects]);

  // Headline KPI Data
  const kpiData = useMemo(() => {
    if (isPortfolioDefault) {
      const totalRow = controlRows.find(r => r.projectBundling === 'TOTAL');
      return {
        po: totalRow?.summaryPO ?? null,
        vowd: totalRow?.summaryVOWD ?? null,
        rna: totalRow?.summaryRNA ?? null,
        status: 'Official Control',
      };
    }

    if (isBundlingOnly) {
      const bRow = controlRows.find(r => r.projectBundling === bundlingFilter);
      return {
        po: bRow?.summaryPO ?? null,
        vowd: bRow?.summaryVOWD ?? null,
        rna: bRow?.summaryRNA ?? null,
        status: 'Official Control',
      };
    }

    // Filtered Detail Mode
    const proc = getFilteredProcurementTotals(matchingKeysSet);
    const vowdTot = getFilteredVowdTotals(matchingKeysSet);
    const fin = getFilteredFinancialTotals(matchingKeysSet);

    return {
      po: proc.poTotal,
      vowd: vowdTot.totalVowd,
      rna: fin.rna,
      status: 'Filtered Detail',
    };
  }, [isPortfolioDefault, isBundlingOnly, controlRows, bundlingFilter, matchingKeysSet, getFilteredProcurementTotals, getFilteredVowdTotals, getFilteredFinancialTotals]);

  // VOWD Historical Trend Data
// Always derived dynamically from DASH_VOWD through DataContext.
// No hard-coded annual VOWD values.
const vowdTrend = useMemo(() => {
  const vowdTot = getFilteredVowdTotals(matchingKeysSet);

  return {
    v2023: vowdTot.vowd2023 ?? 0,
    v2024: vowdTot.vowd2024 ?? 0,
    v2025: vowdTot.vowd2025 ?? 0,
    v2026: vowdTot.vowd2026 ?? 0,
    total: vowdTot.totalVowd ?? 0,
  };
}, [
  matchingKeysSet,
  getFilteredVowdTotals,
]);

  const maxAnnualVowd = Math.max(vowdTrend.v2023, vowdTrend.v2024, vowdTrend.v2025, vowdTrend.v2026, 1);
  const getAnnualBarHeight = (val: number) => {
    if (!val || val <= 0) return '0%';
    const pct = (val / maxAnnualVowd) * 100;
    return `${Math.max(pct, 2)}%`;
  };

  // VOWD by Project Bundling (Visual Bars)
  const vowdByBundlingData = useMemo(() => {
    return SIX_BUNDLINGS.map(bName => {
      if (isPortfolioDefault) {
        const cRow = controlRows.find(r => r.projectBundling === bName);
        return { name: bName, vowd: cRow?.summaryVOWD ?? 0 };
      }

      if (isBundlingOnly) {
        if (bundlingFilter === bName) {
          const cRow = controlRows.find(r => r.projectBundling === bName);
          return { name: bName, vowd: cRow?.summaryVOWD ?? 0 };
        } else {
          return { name: bName, vowd: 0 };
        }
      }

      // Filtered Detail Mode
      const bProjects = filteredProjects.filter(p => p.projectBundling === bName);
      if (bProjects.length === 0) {
        return { name: bName, vowd: 0 };
      }
      const bKeys = new Set(bProjects.map(p => p.projectKey));
      const bVowd = getFilteredVowdTotals(bKeys);
      return {
        name: bName,
        vowd: bVowd.totalVowd,
      };
    });
  }, [isPortfolioDefault, isBundlingOnly, controlRows, bundlingFilter, filteredProjects, getFilteredVowdTotals]);

  const maxBundlingVowd = Math.max(...vowdByBundlingData.map(d => d.vowd), 1);

  // Table Data (PO vs VOWD vs RNA)
  const tableData = useMemo(() => {
    const rows = SIX_BUNDLINGS.map(bName => {
      if (isPortfolioDefault) {
        const cRow = controlRows.find(r => r.projectBundling === bName);
        return {
          name: bName,
          po: cRow?.summaryPO ?? null,
          vowd: cRow?.summaryVOWD ?? null,
          rna: cRow?.summaryRNA ?? null,
        };
      }

      if (isBundlingOnly) {
        if (bundlingFilter === bName) {
          const cRow = controlRows.find(r => r.projectBundling === bName);
          return {
            name: bName,
            po: cRow?.summaryPO ?? null,
            vowd: cRow?.summaryVOWD ?? null,
            rna: cRow?.summaryRNA ?? null,
          };
        } else {
          return { name: bName, po: 0, vowd: 0, rna: 0 };
        }
      }

      // Filtered Detail Mode
      const bProjects = filteredProjects.filter(p => p.projectBundling === bName);
      if (bProjects.length === 0) {
        return { name: bName, po: 0, vowd: 0, rna: 0 };
      }
      const bKeys = new Set(bProjects.map(p => p.projectKey));
      const bProc = getFilteredProcurementTotals(bKeys);
      const bVowd = getFilteredVowdTotals(bKeys);
      const bFin = getFilteredFinancialTotals(bKeys);

      return {
        name: bName,
        po: bProc.poTotal,
        vowd: bVowd.totalVowd,
        rna: bFin.rna,
      };
    });

    let totalPo: number | null = 0;
    let totalVowd: number | null = 0;
    let totalRna: number | null = 0;

    if (isPortfolioDefault) {
      const cTotal = controlRows.find(r => r.projectBundling === 'TOTAL');
      totalPo = cTotal?.summaryPO ?? null;
      totalVowd = cTotal?.summaryVOWD ?? null;
      totalRna = cTotal?.summaryRNA ?? null;
    } else if (isBundlingOnly) {
      const cRow = controlRows.find(r => r.projectBundling === bundlingFilter);
      totalPo = cRow?.summaryPO ?? null;
      totalVowd = cRow?.summaryVOWD ?? null;
      totalRna = cRow?.summaryRNA ?? null;
    } else {
      totalPo = kpiData.po;
      totalVowd = kpiData.vowd;
      totalRna = kpiData.rna;
    }

    return {
      rows,
      total: { po: totalPo, vowd: totalVowd, rna: totalRna },
    };
  }, [isPortfolioDefault, isBundlingOnly, controlRows, bundlingFilter, filteredProjects, getFilteredProcurementTotals, getFilteredVowdTotals, getFilteredFinancialTotals, kpiData]);

  // Calculation for progress bar percentages
  const vowdRatio = (kpiData.po && kpiData.po > 0 && kpiData.vowd) ? Math.min((kpiData.vowd / kpiData.po) * 100, 100) : 0;
  const rnaRatio = (kpiData.po && kpiData.po > 0 && kpiData.rna) ? Math.min((kpiData.rna / kpiData.po) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 pb-1 border-b border-[#dde3eb]">
        <div>
          <h2 className="text-xl font-bold text-[#161c22]">VOWD & RNA</h2>
          <p className="text-[13px] text-[#5c647a] mt-0.5">
            Project execution and asset finalization monitoring
          </p>
          <div className="flex items-center gap-3 text-[11px] text-[#5c647a] mt-1">
            <span><strong className="text-[#161c22]">VOWD:</strong> Value of Work Done</span>
            <span>•</span>
            <span><strong className="text-[#161c22]">RNA:</strong> Rekapitulasi Nilai Akhir</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-[12px] text-[#434655] bg-white px-3 py-1.5 rounded border border-[#c3c6d7] shadow-2xs">
            Reporting Cut-Off: <strong className="text-[#161c22]">28 Jun 2026</strong> | Status: <strong className="text-[#004ac6]">{kpiData.status}</strong>
          </div>
          <button className="flex items-center gap-1.5 bg-white border border-[#c3c6d7] text-[#161c22] text-[13px] font-semibold px-3 py-1.5 rounded hover:bg-[#eef4fc] transition-colors">
            <Download className="w-3.5 h-3.5 text-[#004ac6]" /> Export Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#c3c6d7] rounded-lg p-2.5 shadow-2xs flex flex-wrap items-center gap-2">
        <select
          value={projectTypeFilter}
          onChange={(e) => setProjectTypeFilter(e.target.value)}
          className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-3 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6]"
        >
          <option value="All">Project Type: All</option>
          <option value="Greenfield">Greenfield</option>
          <option value="Brownfield">Brownfield</option>
        </select>

        <select
          value={bundlingFilter}
          onChange={(e) => setBundlingFilter(e.target.value)}
          className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-3 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6]"
        >
          <option value="All">Project Bundling: All</option>
          {SIX_BUNDLINGS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          value={scheduleFilter}
          onChange={(e) => setScheduleFilter(e.target.value)}
          className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-3 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6]"
        >
          <option value="All">Schedule: All</option>
          <option value="Master Schedule">Master Schedule</option>
          <option value="Non-Master Schedule">Non-Master Schedule</option>
        </select>

        <select
          value={tokFilter}
          onChange={(e) => setTokFilter(e.target.value)}
          className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-3 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6]"
        >
          {tokOptions.map(t => (
            <option key={t} value={t}>{t === 'All' ? 'TOK: All' : `TOK: ${t}`}</option>
          ))}
        </select>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total PO */}
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block">TOTAL PO</span>
              <span className="text-[11px] text-[#737686]">Committed PO Value</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#5c647a] bg-[#f1f5f9] px-2 py-0.5 rounded">
                {kpiData.status}
              </span>
              <Receipt className="w-5 h-5 text-[#004ac6]" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-mono font-bold text-[#004ac6] my-1">
              {formatRupiah(kpiData.po)}
            </div>
            <div className="w-full h-1.5 bg-[#dde3eb] rounded-full overflow-hidden">
              <div className="w-full h-full bg-[#004ac6]" />
            </div>
          </div>
        </div>

        {/* Total VOWD */}
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block">TOTAL VOWD</span>
              <span className="text-[11px] text-[#737686]">Value of Work Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#5c647a] bg-[#f1f5f9] px-2 py-0.5 rounded">
                {kpiData.status}
              </span>
              <BarChart2 className="w-5 h-5 text-[#004ac6]" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-mono font-bold text-[#004ac6] my-1">
              {formatRupiah(kpiData.vowd)}
            </div>
            <div className="w-full h-1.5 bg-[#dde3eb] rounded-full overflow-hidden">
              <div className="h-full bg-[#004ac6]" style={{ width: `${vowdRatio}%` }} />
            </div>
          </div>
        </div>

        {/* Total RNA */}
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block">TOTAL RNA</span>
              <span className="text-[11px] text-[#737686]">Rekapitulasi Nilai Akhir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#5c647a] bg-[#f1f5f9] px-2 py-0.5 rounded">
                {kpiData.status}
              </span>
              <Clock className="w-5 h-5 text-[#004ac6]" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-mono font-bold text-[#004ac6] my-1">
              {formatRupiah(kpiData.rna)}
            </div>
            <div className="w-full h-1.5 bg-[#dde3eb] rounded-full overflow-hidden">
              <div className="h-full bg-[#004ac6]" style={{ width: `${rnaRatio}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* VOWD Historical Trend */}
<div className="lg:col-span-7 bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs flex flex-col">
  <div className="flex justify-between items-center mb-3">
    <h3 className="text-[14px] font-bold text-[#161c22]">
      VOWD Historical Trend
    </h3>

    <span className="text-[11px] text-[#5c647a]">
      Total:{' '}
      <strong className="text-[#004ac6] font-mono">
        {formatRupiah(vowdTrend.total)}
      </strong>
    </span>
  </div>

  {/* Chart Area */}
  <div className="border border-[#d7deea] rounded-lg bg-[#f8fafc] px-5 pt-5 pb-3">
    <div className="h-[210px] flex items-end justify-around gap-5">
      
      {/* 2023 */}
      <div className="h-full flex flex-col justify-end items-center flex-1 min-w-0">
        <div className="h-[170px] w-full flex items-end justify-center">
          <div
            className="w-16 bg-[#80a9ff] rounded-t transition-all relative"
            style={{ height: getAnnualBarHeight(vowdTrend.v2023) }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[#004ac6] whitespace-nowrap">
              {formatRupiah(vowdTrend.v2023)}
            </span>
          </div>
        </div>

        <span className="mt-2 text-[12px] font-bold text-[#434655]">
          2023
        </span>
      </div>

      {/* 2024 */}
      <div className="h-full flex flex-col justify-end items-center flex-1 min-w-0">
        <div className="h-[170px] w-full flex items-end justify-center">
          <div
            className="w-16 bg-[#407cff] rounded-t transition-all relative"
            style={{ height: getAnnualBarHeight(vowdTrend.v2024) }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[#004ac6] whitespace-nowrap">
              {formatRupiah(vowdTrend.v2024)}
            </span>
          </div>
        </div>

        <span className="mt-2 text-[12px] font-bold text-[#434655]">
          2024
        </span>
      </div>

      {/* 2025 */}
      <div className="h-full flex flex-col justify-end items-center flex-1 min-w-0">
        <div className="h-[170px] w-full flex items-end justify-center">
          <div
            className="w-16 bg-[#004ac6] rounded-t transition-all relative"
            style={{ height: getAnnualBarHeight(vowdTrend.v2025) }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[#004ac6] whitespace-nowrap">
              {formatRupiah(vowdTrend.v2025)}
            </span>
          </div>
        </div>

        <span className="mt-2 text-[12px] font-bold text-[#434655]">
          2025
        </span>
      </div>

      {/* 2026 YTD */}
      <div className="h-full flex flex-col justify-end items-center flex-1 min-w-0">
        <div className="h-[170px] w-full flex items-end justify-center">
          <div
            className="w-16 border-2 border-dashed border-[#004ac6] bg-[#eef4fc] rounded-t relative transition-all"
            style={{ height: getAnnualBarHeight(vowdTrend.v2026) }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[#004ac6] whitespace-nowrap">
              {formatRupiah(vowdTrend.v2026)}
            </span>
          </div>
        </div>

        <span className="mt-2 text-[12px] font-bold text-[#004ac6]">
          2026 YTD
        </span>
      </div>

    </div>
  </div>
</div>
        {/* VOWD by Project Bundling */}
        <div className="lg:col-span-5 bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[14px] font-bold text-[#161c22]">VOWD by Project Bundling</h3>
            <span className="text-[11px] text-[#5c647a]">View by: <strong>VOWD</strong></span>
          </div>

          <div className="space-y-3 flex-1 justify-center flex flex-col">
            {vowdByBundlingData.map((item) => {
              const widthPct = Math.max((item.vowd / maxBundlingVowd) * 100, item.vowd > 0 ? 3 : 0);
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="font-semibold text-[#161c22] truncate pr-2">{item.name}</span>
                    <span className="font-mono font-bold text-[#004ac6] whitespace-nowrap">{formatRupiah(item.vowd)}</span>
                  </div>
                  <div className="w-full h-2 bg-[#dde3eb] rounded-full overflow-hidden">
                    <div className="h-full bg-[#004ac6] transition-all" style={{ width: `${widthPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PO vs VOWD vs RNA by Project Bundling Table */}
      <div className="bg-white border border-[#c3c6d7] rounded-lg shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-[#c3c6d7] bg-[#f8fafc] flex justify-between items-center">
          <h3 className="text-[14px] font-bold text-[#161c22]">
            PO vs VOWD vs RNA by Project Bundling
          </h3>
          <span className="text-[11px] font-medium text-[#565e74] bg-white px-2 py-0.5 rounded border border-[#c3c6d7]">
            {kpiData.status}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#f1f5f9] text-[#565e74] font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 border-b border-[#c3c6d7]">PROJECT BUNDLING</th>
                <th className="py-2.5 px-4 border-b border-[#c3c6d7] text-right font-mono">PO</th>
                <th className="py-2.5 px-4 border-b border-[#c3c6d7] text-right font-mono">VOWD</th>
                <th className="py-2.5 px-4 border-b border-[#c3c6d7] text-right font-mono">RNA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dde3eb]">
              {tableData.rows.map((r, idx) => (
                <tr key={idx} className="hover:bg-[#f6f9ff] transition-colors h-[38px]">
                  <td className="py-2 px-4 font-semibold text-[#161c22]">{r.name}</td>
                  <td className="py-2 px-4 text-right font-mono text-[#161c22]">{formatRupiah(r.po)}</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-[#004ac6]">{formatRupiah(r.vowd)}</td>
                  <td className="py-2 px-4 text-right font-mono text-[#161c22]">{formatRupiah(r.rna)}</td>
                </tr>
              ))}
              <tr className="bg-[#eef4fc] font-bold border-t-2 border-[#c3c6d7]">
                <td className="py-2.5 px-4 text-[#161c22]">TOTAL</td>
                <td className="py-2.5 px-4 text-right font-mono text-[#161c22]">{formatRupiah(tableData.total.po)}</td>
                <td className="py-2.5 px-4 text-right font-mono text-[#004ac6]">{formatRupiah(tableData.total.vowd)}</td>
                <td className="py-2.5 px-4 text-right font-mono text-[#161c22]">{formatRupiah(tableData.total.rna)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

