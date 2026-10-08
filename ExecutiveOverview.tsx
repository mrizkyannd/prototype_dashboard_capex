import React, { useState, useMemo } from 'react';
import { RouteId, ControlRow, ProjectRow, FinancialRow, ProcurementRow, VowdRow } from '../types';
import { ArrowUpRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';

interface ExecutiveOverviewProps {
  onNavigate: (route: RouteId) => void;
}

type ViewByMetric = 'RAB' | 'RKAP' | 'OB' | 'PR' | 'PO' | 'VOWD' | 'RNA';

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({ onNavigate }) => {
  // Shared Data Context
  const {
    controlRows,
    projects,
    financials,
    procurement,
    vowd,
    getFilteredFinancialTotals,
    getFilteredProcurementTotals,
    getFilteredVowdTotals,
    loading,
    refreshing,
    error,
    lastRefreshed,
    refreshData,
  } = useData();

  // Filters state
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('All');
  const [bundlingFilter, setBundlingFilter] = useState<string>('All');
  const [scheduleFilter, setScheduleFilter] = useState<string>('All');
  const [tokFilter, setTokFilter] = useState<string>('All');

  // Chart Metric selector
  const [viewByMetric, setViewByMetric] = useState<ViewByMetric>('RAB');

  // Fixed list of the six bundlings
  const BUNDLINGS = useMemo(() => [
    'SPAM Jatiluhur Hilir',
    'SPAM Karian Serpong Hilir',
    'SPAM Buaran 3 Hulu',
    'SPAM Buaran 3 Hilir',
    'Sambungan Rumah',
    'Cyclical Maintenance'
  ], []);


  // Lookups for detail joins
  const financialMap = useMemo(() => {
    const map = new Map<string, FinancialRow>();
    financials.forEach(f => {
      if (f.projectKey) map.set(f.projectKey, f);
    });
    return map;
  }, [financials]);

  const procurementGroupedMap = useMemo(() => {
    const map = new Map<string, ProcurementRow[]>();
    procurement.forEach(p => {
      if (p.projectKey) {
        let list = map.get(p.projectKey);
        if (!list) {
          list = [];
          map.set(p.projectKey, list);
        }
        list.push(p);
      }
    });
    return map;
  }, [procurement]);

  const vowdGroupedMap = useMemo(() => {
    const map = new Map<string, VowdRow[]>();
    vowd.forEach(v => {
      if (v.projectKey) {
        let list = map.get(v.projectKey);
        if (!list) {
          list = [];
          map.set(v.projectKey, list);
        }
        list.push(v);
      }
    });
    return map;
  }, [vowd]);

  // Distinct schedule & TOK options from DASH_PROJECT
  const scheduleOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.schedule) set.add(p.schedule);
    });
    return ['All', ...Array.from(set).sort()];
  }, [projects]);

  const tokOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.tok) set.add(p.tok);
    });
    // Chronological / String sort
    return ['All', ...Array.from(set).sort((a, b) => {
      const timeA = Date.parse(a);
      const timeB = Date.parse(b);
      if (!isNaN(timeA) && !isNaN(timeB)) return timeA - timeB;
      return a.localeCompare(b);
    })];
  }, [projects]);

  // Helper functions to get metric values
  const getMetricFromTotals = (
    metric: ViewByMetric,
    fin: { capexBase: number; capexInflated: number; rab: number; rkap: number; ob: number; rna: number },
    proc: { prTotal: number; poTotal: number },
    vowdTot: { totalVowd: number }
  ) => {
    switch (metric) {
      case 'RAB': return fin.rab;
      case 'RKAP': return fin.rkap;
      case 'OB': return fin.ob;
      case 'PR': return proc.prTotal;
      case 'PO': return proc.poTotal;
      case 'VOWD': return vowdTot.totalVowd;
      case 'RNA': return fin.rna;
      default: return 0;
    }
  };

  const getMetricFromControlRow = (metric: ViewByMetric, cRow?: ControlRow | null) => {
    if (!cRow) return 0;
    switch (metric) {
      case 'RAB': return cRow.summaryRAB ?? 0;
      case 'RKAP': return cRow.summaryRKAP ?? 0;
      case 'OB': return cRow.summaryOB ?? 0;
      case 'PR': return cRow.summaryPR ?? 0;
      case 'PO': return cRow.summaryPO ?? 0;
      case 'VOWD': return cRow.summaryVOWD ?? 0;
      case 'RNA': return cRow.summaryRNA ?? 0;
      default: return 0;
    }
  };

  // Determine calculation mode
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

  // Project counts
  const totalProjectCount = filteredProjects.length;
  const greenfieldCount = useMemo(() => filteredProjects.filter(p => p.projectType === 'Greenfield').length, [filteredProjects]);
  const brownfieldCount = useMemo(() => filteredProjects.filter(p => p.projectType === 'Brownfield').length, [filteredProjects]);

  const greenfieldCountPct = totalProjectCount > 0 ? (greenfieldCount / totalProjectCount) * 100 : 0;
  const brownfieldCountPct = totalProjectCount > 0 ? (brownfieldCount / totalProjectCount) * 100 : 0;

  // Format Rupiah helper
  const formatRupiahShort = (
  val: number | null | undefined
): string => {
  if (val === null || val === undefined) return '—';

  return 'Rp ' + Math.round(val).toLocaleString('id-ID', {
    maximumFractionDigits: 0,
  });
};

  // Simplified Rupiah Formatter specifically for FINANCIAL KPI POSITIONS (Base & Budget and Procurement & Execution)
  const formatRupiahSimplified = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '' || trimmed === '—' || trimmed === '-') return '—';
      if (/[TMJtRb]/.test(trimmed)) {
        if (!trimmed.startsWith('Rp') && !trimmed.startsWith('-Rp')) {
          return `Rp ${trimmed}`;
        }
        return trimmed.replace(/^Rp\s*/, 'Rp ').replace(/^-Rp\s*/, '-Rp ');
      }
      const cleanedNum = parseFloat(trimmed.replace(/[^\d.-]/g, ''));
      if (!isNaN(cleanedNum)) {
        val = cleanedNum;
      } else {
        return trimmed;
      }
    }

    if (typeof val === 'number') {
      if (isNaN(val)) return '—';
      if (val === 0) return 'Rp 0';

      const isNegative = val < 0;
      const abs = Math.abs(val);

      let numStr = '';
      let unit = '';

      if (abs >= 1e12) {
        numStr = (abs / 1e12).toLocaleString('id-ID', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        unit = ' T';
      } else if (abs >= 1e9) {
        numStr = (abs / 1e9).toLocaleString('id-ID', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        unit = ' M';
      } else if (abs >= 1e6) {
        numStr = (abs / 1e6).toLocaleString('id-ID', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        unit = ' Jt';
      } else if (abs >= 1e3) {
        numStr = (abs / 1e3).toLocaleString('id-ID', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        unit = ' Rb';
      } else {
        numStr = abs.toLocaleString('id-ID', {
          maximumFractionDigits: 0,
        });
      }

      return `${isNegative ? '-Rp ' : 'Rp '}${numStr}${unit}`;
    }

    return '—';
  };

  // KPI calculations
  const kpis = useMemo(() => {
    if (isOfficialControl) {
      const targetBundling = isPortfolioDefault ? 'TOTAL' : bundlingFilter;
      const cRow = controlRows.find(r => r.projectBundling === targetBundling);

      return {
        capexBase: cRow?.summaryBase ?? null,
        capexInflated: cRow?.summaryInflated ?? null,
        rab: cRow?.summaryRAB ?? null,
        rkap: cRow?.summaryRKAP ?? null,
        ob: cRow?.summaryOB ?? null,
        pr: cRow?.summaryPR ?? null,
        po: cRow?.summaryPO ?? null,
        vowd: cRow?.summaryVOWD ?? null,
        rna: cRow?.summaryRNA ?? null,
      };
    } else {
      // Filtered Detail Mode using Distinct Group Key Aggregation
      const matchingKeysSet = new Set(filteredProjects.map(p => p.projectKey));
      const finTotals = getFilteredFinancialTotals(matchingKeysSet);
      const procTotals = getFilteredProcurementTotals(matchingKeysSet);
      const vowdTotals = getFilteredVowdTotals(matchingKeysSet);

      return {
        capexBase: finTotals.capexBase,
        capexInflated: finTotals.capexInflated,
        rab: finTotals.rab,
        rkap: finTotals.rkap,
        ob: finTotals.ob,
        pr: procTotals.prTotal,
        po: procTotals.poTotal,
        vowd: vowdTotals.totalVowd,
        rna: finTotals.rna,
      };
    }
  }, [isOfficialControl, isPortfolioDefault, bundlingFilter, controlRows, filteredProjects, getFilteredFinancialTotals, getFilteredProcurementTotals, getFilteredVowdTotals]);

  // Greenfield vs Brownfield breakdown
  const greenfieldVsBrownfield = useMemo(() => {
    let gfVal = 0;
    let bfVal = 0;

    if (isOfficialControl) {
      if (isPortfolioDefault) {
        const gfBundlings = [
          'SPAM Jatiluhur Hilir',
          'SPAM Karian Serpong Hilir',
          'SPAM Buaran 3 Hulu',
          'SPAM Buaran 3 Hilir',
          'Sambungan Rumah',
        ];
        gfBundlings.forEach(bName => {
          const c = controlRows.find(r => r.projectBundling === bName);
          gfVal += getMetricFromControlRow(viewByMetric, c);
        });
        const bfC = controlRows.find(r => r.projectBundling === 'Cyclical Maintenance');
        bfVal = getMetricFromControlRow(viewByMetric, bfC);
      } else {
        // Bundling Only Mode
        const c = controlRows.find(r => r.projectBundling === bundlingFilter);
        const val = getMetricFromControlRow(viewByMetric, c);
        if (bundlingFilter === 'Cyclical Maintenance') {
          gfVal = 0;
          bfVal = val;
        } else {
          gfVal = val;
          bfVal = 0;
        }
      }
    } else {
      // Filtered Detail Mode using Distinct Group Key Aggregation
      const gfProjects = filteredProjects.filter(p => p.projectType === 'Greenfield');
      const bfProjects = filteredProjects.filter(p => p.projectType === 'Brownfield');

      const gfKeys = new Set(gfProjects.map(p => p.projectKey));
      const bfKeys = new Set(bfProjects.map(p => p.projectKey));

      const gfFin = getFilteredFinancialTotals(gfKeys);
      const gfProc = getFilteredProcurementTotals(gfKeys);
      const gfVowd = getFilteredVowdTotals(gfKeys);

      const bfFin = getFilteredFinancialTotals(bfKeys);
      const bfProc = getFilteredProcurementTotals(bfKeys);
      const bfVowd = getFilteredVowdTotals(bfKeys);

      gfVal = getMetricFromTotals(viewByMetric, gfFin, gfProc, gfVowd);
      bfVal = getMetricFromTotals(viewByMetric, bfFin, bfProc, bfVowd);
    }

    const totalVal = gfVal + bfVal;
    const gfShare = totalVal > 0 ? (gfVal / totalVal) * 100 : 0;
    const bfShare = totalVal > 0 ? (bfVal / totalVal) * 100 : 0;

    return {
      gfVal,
      bfVal,
      totalVal,
      gfShare,
      bfShare,
    };
  }, [isOfficialControl, isPortfolioDefault, bundlingFilter, controlRows, viewByMetric, filteredProjects, getFilteredFinancialTotals, getFilteredProcurementTotals, getFilteredVowdTotals]);

  // Portfolio Composition Horizontal Bar Chart values by Bundling
  const bundlingChartData = useMemo(() => {
    const list = BUNDLINGS.map(bName => {
      const bProjects = filteredProjects.filter(p => p.projectBundling === bName);
      const pCount = bProjects.length;

      let val = 0;

      if (isOfficialControl) {
        if (isPortfolioDefault) {
          const c = controlRows.find(r => r.projectBundling === bName);
          val = getMetricFromControlRow(viewByMetric, c);
        } else {
          // Bundling Only Mode
          if (bName === bundlingFilter) {
            const c = controlRows.find(r => r.projectBundling === bName);
            val = getMetricFromControlRow(viewByMetric, c);
          } else {
            val = 0;
          }
        }
      } else {
        // Filtered Detail Mode
        const bKeysSet = new Set(bProjects.map(p => p.projectKey));
        const fin = getFilteredFinancialTotals(bKeysSet);
        const proc = getFilteredProcurementTotals(bKeysSet);
        const vowdTot = getFilteredVowdTotals(bKeysSet);

        val = getMetricFromTotals(viewByMetric, fin, proc, vowdTot);
      }

      return {
        name: bName,
        count: pCount,
        value: val,
      };
    });

    const totalVal = list.reduce((acc, curr) => acc + (curr.value || 0), 0);

    return list.map(item => ({
      ...item,
      percent: totalVal > 0 ? Math.round((item.value / totalVal) * 100) : 0,
    }));
  }, [BUNDLINGS, filteredProjects, isOfficialControl, isPortfolioDefault, bundlingFilter, controlRows, viewByMetric, getFilteredFinancialTotals, getFilteredProcurementTotals, getFilteredVowdTotals]);

  // Portfolio Position by Project Bundling Table Data
  const bundlingTableData = useMemo(() => {
    const rows = BUNDLINGS.map(bName => {
      if (isOfficialControl) {
        if (isPortfolioDefault) {
          const c = controlRows.find(r => r.projectBundling === bName);
          return {
            name: bName,
            rab: c?.summaryRAB ?? null,
            pr: c?.summaryPR ?? null,
            po: c?.summaryPO ?? null,
            vowd: c?.summaryVOWD ?? null,
            rna: c?.summaryRNA ?? null,
          };
        } else {
          // Bundling Only Mode
          if (bName === bundlingFilter) {
            const c = controlRows.find(r => r.projectBundling === bName);
            return {
              name: bName,
              rab: c?.summaryRAB ?? null,
              pr: c?.summaryPR ?? null,
              po: c?.summaryPO ?? null,
              vowd: c?.summaryVOWD ?? null,
              rna: c?.summaryRNA ?? null,
            };
          } else {
            return {
              name: bName,
              rab: 0,
              pr: 0,
              po: 0,
              vowd: 0,
              rna: 0,
            };
          }
        }
      } else {
        // Filtered Detail Mode
        const bProjects = filteredProjects.filter(p => p.projectBundling === bName);
        const bKeysSet = new Set(bProjects.map(p => p.projectKey));

        const fin = getFilteredFinancialTotals(bKeysSet);
        const proc = getFilteredProcurementTotals(bKeysSet);
        const vowdTot = getFilteredVowdTotals(bKeysSet);

        return {
          name: bName,
          rab: fin.rab,
          pr: proc.prTotal,
          po: proc.poTotal,
          vowd: vowdTot.totalVowd,
          rna: fin.rna,
        };
      }
    });

    return {
      rows,
      total: {
        rab: kpis.rab,
        pr: kpis.pr,
        po: kpis.po,
        vowd: kpis.vowd,
        rna: kpis.rna,
      },
    };
  }, [BUNDLINGS, isOfficialControl, isPortfolioDefault, bundlingFilter, controlRows, filteredProjects, getFilteredFinancialTotals, getFilteredProcurementTotals, getFilteredVowdTotals, kpis]);

  // KPI Card Config Arrays
  const kpiRow1 = [
    { title: 'CAPEX Base FinMod', value: formatRupiahSimplified(kpis.capexBase), sub: 'Baseline model' },
    { title: 'CAPEX Inflated FinMod', value: formatRupiahSimplified(kpis.capexInflated), sub: 'Adjusted model' },
    { title: 'RAB Sent to PAM Jaya', value: formatRupiahSimplified(kpis.rab), sub: 'Approved RAB' },
    { title: 'RKAP', value: formatRupiahSimplified(kpis.rkap), sub: 'Annual budget' },
    { title: 'Over Budget (OB)', value: formatRupiahSimplified(kpis.ob), sub: 'Unbudgeted' },
  ];

  const kpiRow2 = [
    { title: 'PR', value: formatRupiahSimplified(kpis.pr), sub: 'Requisitions' },
    { title: 'PO', value: formatRupiahSimplified(kpis.po), sub: 'Committed PO' },
    { title: 'VOWD', value: formatRupiahSimplified(kpis.vowd), sub: 'Work done' },
    { title: 'RNA', value: formatRupiahSimplified(kpis.rna), sub: 'Remaining net' },
  ];

  const splitRupiahValue = (value: string) => {
  if (!value || value === '—') {
    return {
      prefix: '',
      amount: '—',
    };
  }

  const clean = String(value).trim();

  if (clean.startsWith('-Rp ')) {
    return {
      prefix: '-Rp',
      amount: clean.replace(/^-Rp\s*/, ''),
    };
  }

  if (clean.startsWith('Rp ')) {
    return {
      prefix: 'Rp',
      amount: clean.replace(/^Rp\s*/, ''),
    };
  }

  return {
    prefix: '',
    amount: clean,
  };
};

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-[#c3c6d7] rounded-lg p-12 text-center shadow-2xs">
        <RefreshCw className="w-8 h-8 text-[#004ac6] animate-spin mb-3" />
        <p className="text-sm font-semibold text-[#161c22]">Loading Executive Overview Real Data...</p>
        <p className="text-xs text-[#5c647a] mt-1">Reading master datasets from Google Sheets</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800 my-4">
        <div className="flex items-center gap-2 font-bold mb-1">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Data Connection Error</span>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => refreshData(true)}
          className="mt-3 px-3 py-1.5 bg-red-800 text-white text-xs font-semibold rounded hover:bg-red-900 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto w-full">
      {/* Header & Reporting Cut-Off */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 pb-1 border-b border-[#dde3eb]">
        <div>
          <h2 className="text-xl font-bold text-[#161c22] tracking-tight">Executive Overview</h2>
          <p className="text-[13px] text-[#5c647a] mt-0.5">
            High-level CAPEX bundling financial oversight and portfolio position
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-[12px] text-[#434655] bg-white px-3 py-1.5 rounded border border-[#c3c6d7] shadow-2xs">
          <span>Reporting Cut-Off: <strong className="text-[#161c22]">28 Jun 2026</strong></span>
          <span className="text-[#c3c6d7]">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-[#5c647a]">Data Basis:</span>
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
              isOfficialControl 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {isOfficialControl ? 'Official Control' : 'Filtered Detail'}
            </span>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#c3c6d7] rounded-lg p-3 shadow-2xs flex flex-wrap items-center gap-3">
        <span className="text-[12px] font-semibold text-[#161c22] uppercase tracking-wider">Filters:</span>

        {/* Project Type */}
        <select
          value={projectTypeFilter}
          onChange={(e) => setProjectTypeFilter(e.target.value)}
          className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-3 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6] cursor-pointer"
        >
          <option value="All">Project Type: All</option>
          <option value="Greenfield">Greenfield</option>
          <option value="Brownfield">Brownfield</option>
        </select>

        {/* Project Bundling */}
        <select
          value={bundlingFilter}
          onChange={(e) => setBundlingFilter(e.target.value)}
          className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-3 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6] cursor-pointer"
        >
          <option value="All">Project Bundling: All</option>
          {BUNDLINGS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Schedule */}
        <select
          value={scheduleFilter}
          onChange={(e) => setScheduleFilter(e.target.value)}
          className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-3 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6] cursor-pointer"
        >
          {scheduleOptions.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'Schedule: All' : s}
            </option>
          ))}
        </select>

        {/* TOK */}
        <select
          value={tokFilter}
          onChange={(e) => setTokFilter(e.target.value)}
          className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-3 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6] cursor-pointer"
        >
          {tokOptions.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'TOK: All' : t}
            </option>
          ))}
        </select>

        {/* Reset Filters button if active */}
        {!isPortfolioDefault && (
          <button
            onClick={() => {
              setProjectTypeFilter('All');
              setBundlingFilter('All');
              setScheduleFilter('All');
              setTokFilter('All');
            }}
            className="text-[12px] font-semibold text-[#004ac6] hover:underline ml-auto cursor-pointer"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* FINANCIAL KPI SEQUENCE: ROW 1 */}
<div>
  <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-2">
    FINANCIAL KPI POSITIONS — BASE & BUDGET
  </span>

  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
    {kpiRow1.map((kpi, idx) => {
      const rupiah = splitRupiahValue(kpi.value);

      return (
        <div
          key={idx}
          className="bg-white border border-[#c3c6d7] rounded-lg p-3.5 shadow-2xs hover:border-[#2563eb] transition-colors min-w-0"
        >
          <div
            className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider truncate"
            title={kpi.title}
          >
            {kpi.title}
          </div>

          <div className="my-1.5">
            {rupiah.prefix && (
              <div className="text-[12px] font-bold text-[#565e74] leading-none mb-1">
                {rupiah.prefix}
              </div>
            )}

            <div className="text-[22px] xl:text-[24px] font-extrabold text-[#004ac6] font-mono tracking-tight whitespace-nowrap">
              {rupiah.amount}
            </div>
          </div>

          <div className="text-[11px] text-[#737686]">
            {kpi.sub}
          </div>
        </div>
      );
    })}
  </div>
</div>

      {/* FINANCIAL KPI SEQUENCE: ROW 2 */}
<div>
  <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-2">
    FINANCIAL KPI POSITIONS — PROCUREMENT & EXECUTION
  </span>

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {kpiRow2.map((kpi, idx) => {
      const rupiah = splitRupiahValue(kpi.value);

      return (
        <div
          key={idx}
          className="bg-white border border-[#c3c6d7] rounded-lg p-3.5 shadow-2xs border-l-4 border-l-[#2563eb] hover:border-[#2563eb] transition-colors min-w-0"
        >
          <div
            className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider truncate"
            title={kpi.title}
          >
            {kpi.title}
          </div>

          <div className="my-1.5">
            {rupiah.prefix && (
              <div className="text-[12px] font-bold text-[#565e74] leading-none mb-1">
                {rupiah.prefix}
              </div>
            )}

            <div className="text-[22px] xl:text-[24px] font-extrabold text-[#161c22] font-mono tracking-tight whitespace-nowrap">
              {rupiah.amount}
            </div>
          </div>

          <div className="text-[11px] text-[#737686]">
            {kpi.sub}
          </div>
        </div>
      );
    })}
  </div>
</div>

      {/* Portfolio Composition & Greenfield vs Brownfield */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Portfolio Composition */}
        <div className="lg:col-span-7 bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#161c22]">Portfolio Composition</h3>
              <p className="text-[12px] text-[#5c647a]">Project breakdown by operational type</p>
            </div>
            <button
              onClick={() => onNavigate('project-portfolio')}
              className="text-[12px] font-medium text-[#004ac6] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Directory <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 my-2">
            <div className="bg-[#f6f9ff] border border-[#dde3eb] p-3 rounded text-center">
              <span className="text-[11px] font-bold text-[#5c647a] uppercase">Total Projects</span>
              <span className="block text-[24px] font-extrabold text-[#004ac6] mt-1">{totalProjectCount.toLocaleString()}</span>
            </div>
            <div className="bg-[#eef4fc] border border-[#d5e3fc] p-3 rounded text-center">
              <span className="text-[11px] font-bold text-[#003ea8] uppercase">Greenfield</span>
              <span className="block text-[24px] font-extrabold text-[#003ea8] mt-1">{greenfieldCount.toLocaleString()}</span>
            </div>
            <div className="bg-[#f6f9ff] border border-[#dde3eb] p-3 rounded text-center">
              <span className="text-[11px] font-bold text-[#48566a] uppercase">Brownfield</span>
              <span className="block text-[24px] font-extrabold text-[#48566a] mt-1">{brownfieldCount.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-[12px] font-medium text-[#434655]">
              <span>Greenfield ({greenfieldCountPct.toFixed(0)}%)</span>
              <span>Brownfield ({brownfieldCountPct.toFixed(0)}%)</span>
            </div>
            <div className="w-full h-3 bg-[#e8eef6] rounded-full overflow-hidden flex">
              <div className="h-full bg-[#004ac6]" style={{ width: `${greenfieldCountPct}%` }} />
              <div className="h-full bg-[#606e83]" style={{ width: `${brownfieldCountPct}%` }} />
            </div>
          </div>
        </div>

        {/* Greenfield vs Brownfield Value Breakdown */}
        <div className="lg:col-span-5 bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-[#161c22] mb-1">Greenfield vs Brownfield</h3>
            <p className="text-[12px] text-[#5c647a] mb-4">CAPEX distribution comparison ({viewByMetric} Basis)</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[13px] mb-1">
                <span className="font-semibold text-[#161c22]">Greenfield ({viewByMetric})</span>
                <span className="font-mono font-bold text-[#004ac6]">
                  {formatRupiahShort(greenfieldVsBrownfield.gfVal)} ({greenfieldVsBrownfield.gfShare.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#e8eef6] rounded-full overflow-hidden">
                <div className="h-full bg-[#004ac6]" style={{ width: `${greenfieldVsBrownfield.gfShare}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[13px] mb-1">
                <span className="font-semibold text-[#161c22]">Brownfield ({viewByMetric})</span>
                <span className="font-mono font-bold text-[#48566a]">
                  {formatRupiahShort(greenfieldVsBrownfield.bfVal)} ({greenfieldVsBrownfield.bfShare.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#e8eef6] rounded-full overflow-hidden">
                <div className="h-full bg-[#606e83]" style={{ width: `${greenfieldVsBrownfield.bfShare}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#dde3eb] flex justify-between text-[12px] text-[#5c647a]">
            <span>Total Filtered {viewByMetric} Portfolio:</span>
            <strong className="text-[#161c22] font-mono">{formatRupiahShort(greenfieldVsBrownfield.totalVal)}</strong>
          </div>
        </div>
      </div>

      {/* PORTFOLIO COMPOSITION — CAPEX BY PROJECT BUNDLING (BAR CHART) */}
      <div className="bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#161c22]">
              Portfolio Composition — CAPEX by Project Bundling
            </h3>
            <p className="text-[12px] text-[#5c647a]">
              Allocation breakdown across the six core bundlings
            </p>
          </div>

          {/* View By Metric Selector */}
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-semibold text-[#565e74]">View by:</label>
            <select
              value={viewByMetric}
              onChange={(e) => setViewByMetric(e.target.value as ViewByMetric)}
              className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-2.5 py-1 text-[12px] font-bold text-[#004ac6] focus:outline-none focus:border-[#004ac6] cursor-pointer"
            >
              <option value="RAB">RAB</option>
              <option value="RKAP">RKAP</option>
              <option value="OB">Over Budget (OB)</option>
              <option value="PR">PR</option>
              <option value="PO">PO</option>
              <option value="VOWD">VOWD</option>
              <option value="RNA">RNA</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {bundlingChartData.map((item, idx) => (
            <div key={idx} className="p-2.5 bg-[#f6f9ff] border border-[#dde3eb] rounded flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="w-full md:w-1/3">
                <span className="text-[13px] font-bold text-[#161c22]">{item.name}</span>
                <span className="text-[11px] text-[#5c647a] block">{item.count} Projects</span>
              </div>

              <div className="w-full md:w-1/3">
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-[#5c647a]">Allocation Weight ({viewByMetric})</span>
                  <span className="font-semibold text-[#161c22]">{item.percent}%</span>
                </div>
                <div className="w-full h-2 bg-[#dde3eb] rounded-full overflow-hidden">
                  <div className="h-full bg-[#004ac6] rounded-full" style={{ width: `${item.percent}%` }} />
                </div>
              </div>

              <div className="w-full md:w-1/4 text-right">
                <span className="text-[14px] font-mono font-bold text-[#004ac6]">
                  {formatRupiahShort(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PORTFOLIO POSITION BY PROJECT BUNDLING (TABLE) */}
      <div className="bg-white border border-[#c3c6d7] rounded-lg overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#dde3eb]">
          <h3 className="text-[15px] font-bold text-[#161c22]">
            Portfolio Position by Project Bundling
          </h3>
          <p className="text-[12px] text-[#5c647a]">
            Detailed financial metrics across bundlings (RAB, PR, PO, VOWD, RNA)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[#f6f9ff] text-[#565e74] font-bold border-b border-[#c3c6d7] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Project Bundling</th>
                <th className="px-4 py-3 text-right">RAB</th>
                <th className="px-4 py-3 text-right">PR</th>
                <th className="px-4 py-3 text-right">PO</th>
                <th className="px-4 py-3 text-right">VOWD</th>
                <th className="px-4 py-3 text-right">RNA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dde3eb]">
              {bundlingTableData.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#f6f9ff]">
                  <td className="px-4 py-3 font-semibold text-[#161c22] whitespace-nowrap">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-[#004ac6]">
                    {formatRupiahShort(row.rab)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#161c22]">
                    {formatRupiahShort(row.pr)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#161c22]">
                    {formatRupiahShort(row.po)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#161c22]">
                    {formatRupiahShort(row.vowd)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#161c22]">
                    {formatRupiahShort(row.rna)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#eef4fc] font-bold border-t-2 border-[#004ac6]">
              <tr>
                <td className="px-4 py-3 text-[#004ac6] uppercase tracking-wider">
                  TOTAL PORTFOLIO
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#004ac6]">
                  {formatRupiahShort(bundlingTableData.total.rab)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#161c22]">
                  {formatRupiahShort(bundlingTableData.total.pr)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#161c22]">
                  {formatRupiahShort(bundlingTableData.total.po)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#161c22]">
                  {formatRupiahShort(bundlingTableData.total.vowd)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#161c22]">
                  {formatRupiahShort(bundlingTableData.total.rna)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
