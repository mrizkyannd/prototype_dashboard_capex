import React, { useState, useEffect, useMemo } from 'react';
import { ProjectItem, RouteId, ProjectRow, FinancialRow, ProcurementRow, VowdRow, UIProcurementRow } from '../types';
import { useData } from '../context/DataContext';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  RefreshCw, 
  AlertTriangle, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown,
  X
} from 'lucide-react';

interface ProjectPortfolioProps {
  onSelectProject: (project: ProjectItem) => void;
  onNavigate: (route: RouteId) => void;
}

type ViewMode = 'financial' | 'procurement';


// Rupiah compact formatting helper according to guidelines
const hasRealVal = (v?: string | null): v is string =>
  v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '—';

const getVisibleRkapCode = (r: { kodeBudgetRkapDisplay?: string | null; kodeBudgetRkap?: string | null }) => {
  if (hasRealVal(r.kodeBudgetRkapDisplay)) return r.kodeBudgetRkapDisplay;
  if (hasRealVal(r.kodeBudgetRkap)) return r.kodeBudgetRkap;
  return null;
};

const getVisiblePrPoCode = (r?: { kodeBudgetPrPoDisplay?: string | null; kodeBudgetPrPo?: string | null } | null) => {
  if (!r) return null;
  if (hasRealVal(r.kodeBudgetPrPoDisplay)) return r.kodeBudgetPrPoDisplay;
  if (hasRealVal(r.kodeBudgetPrPo)) return r.kodeBudgetPrPo;
  return null;
};

const getVisiblePrNumber = (r?: { prNumberDisplay?: string | null; prNumber?: string | null } | null) => {
  if (!r) return null;
  if (hasRealVal(r.prNumberDisplay)) return r.prNumberDisplay;
  if (hasRealVal(r.prNumber)) return r.prNumber;
  return null;
};

const getVisiblePoNumber = (r?: { poNumberDisplay?: string | null; poNumber?: string | null } | null) => {
  if (!r) return null;
  if (hasRealVal(r.poNumberDisplay)) return r.poNumberDisplay;
  if (hasRealVal(r.poNumber)) return r.poNumber;
  return null;
};

const getVisiblePrLineValue = (r?: { prLineValueDisplay?: number | null; prLineValue?: number | null } | null): number | null => {
  if (!r) return null;
  if (r.prLineValueDisplay !== undefined && r.prLineValueDisplay !== null) return r.prLineValueDisplay;
  if (r.prLineValue !== undefined && r.prLineValue !== null) return r.prLineValue;
  return null;
};

const getVisiblePoLineValue = (r?: { poLineValueDisplay?: number | null; poLineValue?: number | null } | null): number | null => {
  if (!r) return null;
  if (r.poLineValueDisplay !== undefined && r.poLineValueDisplay !== null) return r.poLineValueDisplay;
  if (r.poLineValue !== undefined && r.poLineValue !== null) return r.poLineValue;
  return null;
};

const formatRupiahCompact = (
  val: number | null | undefined
): string => {
  if (val === null || val === undefined) return '—';

  return 'Rp ' + Math.round(val).toLocaleString('id-ID', {
    maximumFractionDigits: 0,
  });
};

// Date helper for latest PR/PO date
const getLatestDateStr = (dates: (string | null | undefined)[]): string => {
  const valid = dates.filter((d): d is string => Boolean(d && d.trim() && d !== '-'));
  if (valid.length === 0) return '—';
  valid.sort((a, b) => {
    const timeA = Date.parse(a);
    const timeB = Date.parse(b);
    if (!isNaN(timeA) && !isNaN(timeB)) return timeB - timeA;
    return b.localeCompare(a);
  });
  return valid[0];
};

function hasRealValue(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string' && val.trim() === '') return false;
  return true;
}

export const ProjectPortfolio: React.FC<ProjectPortfolioProps> = ({
  onSelectProject,
  onNavigate,
}) => {
  // Shared Data Context
  const {
    projects: projectRows,
    financials: financialRows,
    procurement: procurementRows,
    vowd: vowdRows,
    procurementLineGroups,
    vowdProjectGroups,
    procurementValueGroupByKeyMap,
    vowdGroupByKeyMap,
    loading,
    refreshing,
    error,
    refreshData,
  } = useData();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('financial');


  // Primary Controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [bundlingFilter, setBundlingFilter] = useState<string>('All');
  const [scheduleFilter, setScheduleFilter] = useState<string>('All');
  const [tokFilter, setTokFilter] = useState<string>('All');

  // Secondary Filters ("More Filters")
  const [tahunFilter, setTahunFilter] = useState<string>('All');
  const [subProjectFilter, setSubProjectFilter] = useState<string>('All');
  const [programFilter, setProgramFilter] = useState<string>('All');
  const [kategoriFilter, setKategoriFilter] = useState<string>('All');
  const [lokasiFilter, setLokasiFilter] = useState<string>('All');

  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);

  // Sorting State
  const [sortField, setSortField] = useState<string>('projectCode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Lookups & Aggregations
  const financialMap = useMemo(() => {
    const map = new Map<string, FinancialRow>();
    financialRows.forEach(f => {
      if (f.projectKey) map.set(f.projectKey, f);
    });
    return map;
  }, [financialRows]);

  const procurementGroupedMap = useMemo(() => {
    const map = new Map<string, ProcurementRow[]>();
    procurementRows.forEach(p => {
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
  }, [procurementRows]);

  const vowdGroupedMap = useMemo(() => {
    const map = new Map<string, VowdRow[]>();
    vowdRows.forEach(v => {
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
  }, [vowdRows]);

  const procurementLineGroupsMap = useMemo(() => {
    const map = new Map<string, typeof procurementLineGroups>();
    procurementLineGroups.forEach(lg => {
      if (lg.projectKey) {
        let list = map.get(lg.projectKey);
        if (!list) {
          list = [];
          map.set(lg.projectKey, list);
        }
        list.push(lg);
      }
    });
    return map;
  }, [procurementLineGroups]);

  const vowdProjectGroupsMap = useMemo(() => {
    const map = new Map<string, typeof vowdProjectGroups>();
    vowdProjectGroups.forEach(vpg => {
      if (vpg.projectKey) {
        let list = map.get(vpg.projectKey);
        if (!list) {
          list = [];
          map.set(vpg.projectKey, list);
        }
        list.push(vpg);
      }
    });
    return map;
  }, [vowdProjectGroups]);

  // Distinct Filter Options
  const BUNDLINGS = useMemo(() => [
    'All',
    'SPAM Jatiluhur Hilir',
    'SPAM Karian Serpong Hilir',
    'SPAM Buaran 3 Hulu',
    'SPAM Buaran 3 Hilir',
    'Sambungan Rumah',
    'Cyclical Maintenance'
  ], []);

  const tokOptions = useMemo(() => {
    const set = new Set<string>();
    projectRows.forEach(p => {
      if (p.tok && p.tok.trim()) set.add(p.tok.trim());
    });
    const sorted = Array.from(set).sort((a, b) => {
      const timeA = Date.parse(a);
      const timeB = Date.parse(b);
      if (!isNaN(timeA) && !isNaN(timeB)) return timeA - timeB;
      return a.localeCompare(b);
    });
    return ['All', ...sorted];
  }, [projectRows]);

  const tahunOptions = useMemo(() => {
    const set = new Set<string>();
    projectRows.forEach(p => {
      if (p.tahunProgram && p.tahunProgram.trim()) set.add(p.tahunProgram.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [projectRows]);

  const subProjectOptions = useMemo(() => {
    const set = new Set<string>();
    projectRows.forEach(p => {
      if (p.subProject && p.subProject.trim()) set.add(p.subProject.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [projectRows]);

  const programOptions = useMemo(() => {
    const set = new Set<string>();
    projectRows.forEach(p => {
      if (p.program && p.program.trim()) set.add(p.program.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [projectRows]);

  const kategoriOptions = useMemo(() => {
    const set = new Set<string>();
    projectRows.forEach(p => {
      if (p.kategori && p.kategori.trim()) set.add(p.kategori.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [projectRows]);

  const lokasiOptions = useMemo(() => {
    const set = new Set<string>();
    projectRows.forEach(p => {
      if (p.lokasi && p.lokasi.trim()) set.add(p.lokasi.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [projectRows]);

  // Combine and map DASH_PROJECT into unified ProjectItem list
  const allProjectItems = useMemo<ProjectItem[]>(() => {
    return projectRows.map(p => {
      const pKey = p.projectKey;
      const fin = financialMap.get(pKey);
      const procList = procurementGroupedMap.get(pKey) || [];
      const vowdList = vowdGroupedMap.get(pKey) || [];

      // Financials (Display fields fallback to Raw fields)
      const capexBaseNum = hasRealValue(fin?.capexBaseDisplay) ? fin!.capexBaseDisplay! : (fin?.capexBase ?? null);
      const capexInflatedNum = hasRealValue(fin?.capexInflatedDisplay) ? fin!.capexInflatedDisplay! : (fin?.capexInflated ?? null);
      const rabNum = hasRealValue(fin?.rabDisplay) ? fin!.rabDisplay! : (fin?.rab ?? null);
      const rkapNum = hasRealValue(fin?.rkapDisplay) ? fin!.rkapDisplay! : (fin?.rkap ?? null);
      const obNum = hasRealValue(fin?.obDisplay) ? fin!.obDisplay! : (fin?.ob ?? null);
      const rnaNum = hasRealValue(fin?.rnaDisplay) ? fin!.rnaDisplay! : (fin?.rna ?? null);

      // Procurement totals & distinct sets
      const prGroupKeys = new Set<string>();
      procList.forEach(r => { if (r.prValueGroupKey) prGroupKeys.add(r.prValueGroupKey); });
      const procLineGroups = procurementLineGroupsMap.get(pKey) || [];
      procLineGroups.forEach(lg => {
        const f = (lg.field || '').trim();
        if ((f === 'PR Line Value' || f === 'PR Value') && lg.procurementValueGroupKey) {
          prGroupKeys.add(lg.procurementValueGroupKey);
        }
      });

      let prNum = 0;
      if (prGroupKeys.size > 0) {
        prGroupKeys.forEach(gk => {
          const vg = procurementValueGroupByKeyMap.get(gk);
          if (vg) prNum += vg.groupRawValue || 0;
        });
      } else {
        prNum = procList.reduce((acc, r) => acc + (getVisiblePrLineValue(r) || 0), 0);
      }

      const poGroupKeys = new Set<string>();
      procList.forEach(r => { if (r.poValueGroupKey) poGroupKeys.add(r.poValueGroupKey); });
      procLineGroups.forEach(lg => {
        const f = (lg.field || '').trim();
        if ((f === 'PO Line Value' || f === 'PO Value') && lg.procurementValueGroupKey) {
          poGroupKeys.add(lg.procurementValueGroupKey);
        }
      });

      let poNum = 0;
      if (poGroupKeys.size > 0) {
        poGroupKeys.forEach(gk => {
          const vg = procurementValueGroupByKeyMap.get(gk);
          if (vg) poNum += vg.groupRawValue || 0;
        });
      } else {
        poNum = procList.reduce((acc, r) => acc + (getVisiblePoLineValue(r) || 0), 0);
      }

      const budgetCodesSet = new Set(
        procList.map(r => getVisiblePrPoCode(r) || getVisibleRkapCode(r)).filter((code): code is string => Boolean(code && code.trim() && code !== '—'))
      );
      const prSet = new Set(
        procList.map(r => getVisiblePrNumber(r)).filter((num): num is string => Boolean(num && num.trim() && num !== '—'))
      );
      const poSet = new Set(
        procList.map(r => getVisiblePoNumber(r)).filter((num): num is string => Boolean(num && num.trim() && num !== '—'))
      );

      const numBudgetCodes = budgetCodesSet.size;
      const numPr = prSet.size;
      const numPo = poSet.size;

      const latestPrDate = getLatestDateStr(procList.map(r => r.prDate));
      const latestPoDate = getLatestDateStr(procList.map(r => r.poDate));

      // Relationship status calculation
      let relStatus = 'No Procurement';
      if (procList.length === 0 || (numPr === 0 && numPo === 0)) {
        relStatus = 'No Procurement';
      } else if (numPr === 1 && numPo === 1) {
        relStatus = '1 PR → 1 PO';
      } else if (numPr >= 1 && numPo === 0) {
        relStatus = 'PR Without PO';
      } else if (numPr === 1 && numPo > 1) {
        relStatus = 'PR → Multiple PO';
      } else if (numPr > 1 && numPo === 1) {
        relStatus = 'Multiple PR → PO';
      } else {
        relStatus = 'Complex Relationship';
      }

      // VOWD total
      const vowdGroupKeys = new Set<string>();
      vowdList.forEach(r => {
        if (r.vowdGroupKeys) {
          r.vowdGroupKeys.split(',').map(k => k.trim()).filter(Boolean).forEach(k => vowdGroupKeys.add(k));
        }
      });
      const vowdProjectGroups = vowdProjectGroupsMap.get(pKey) || [];
      vowdProjectGroups.forEach(vpg => {
        if (vpg.vowdGroupKey) vowdGroupKeys.add(vpg.vowdGroupKey);
      });

      let vowdNum = 0;
      if (vowdGroupKeys.size > 0) {
        vowdGroupKeys.forEach(gk => {
          const vg = vowdGroupByKeyMap.get(gk);
          if (vg) vowdNum += vg.groupRawValue || 0;
        });
      } else {
        vowdNum = vowdList.reduce((acc, r) => acc + (r.vowdDisplay ?? r.vowd ?? 0), 0);
      }

      // Detail rows mapping for UI
      const uiProcRows: UIProcurementRow[] = procList.map((r, idx) => ({
        id: r.procurementLineKey || `proc-${pKey}-${idx}`,
        rkapBudgetCode: getVisibleRkapCode(r) || '—',
        prPoBudgetCode: getVisiblePrPoCode(r) || '—',
        description: r.description || '—',
        prNumber: getVisiblePrNumber(r) || '—',
        prDate: r.prDate || '—',
        prValue: formatRupiahCompact(getVisiblePrLineValue(r)),
        poNumber: getVisiblePoNumber(r) || '—',
        poDate: r.poDate || '—',
        poValue: formatRupiahCompact(getVisiblePoLineValue(r)),
      }));

      // Resolve Project Code with fallbacks across procurement, financial, vowd, or projectKey
      let resolvedProjectCode = p.projectCode ? p.projectCode.trim() : '';
      if (!resolvedProjectCode) {
        const procCode = procList.find(r => r.projectCode && r.projectCode.trim())?.projectCode;
        if (procCode && procCode.trim()) resolvedProjectCode = procCode.trim();
      }
      if (!resolvedProjectCode && fin?.projectCode && fin.projectCode.trim()) {
        resolvedProjectCode = fin.projectCode.trim();
      }
      if (!resolvedProjectCode) {
        const vowdCode = vowdList.find(r => r.projectCode && r.projectCode.trim())?.projectCode;
        if (vowdCode && vowdCode.trim()) resolvedProjectCode = vowdCode.trim();
      }
      if (!resolvedProjectCode && p.projectKey && p.projectKey.includes('| CODE:')) {
        const parts = p.projectKey.split('|');
        const codePart = parts.find(pt => pt.trim().startsWith('CODE:'));
        if (codePart) {
          const extracted = codePart.trim().substring(5).trim();
          if (extracted) resolvedProjectCode = extracted;
        }
      }

      return {
        id: pKey,
        projectKey: pKey,
        projectCode: resolvedProjectCode,
        projectType: p.projectType || 'Greenfield',
        projectBundling: p.projectBundling || 'Uncategorized',
        schedule: p.schedule || 'Master Schedule',
        tok: p.tok || '—',
        subProject: p.subProject || '—',
        program: p.program || '—',
        tahunProgram: p.tahunProgram || '—',
        kategori: p.kategori || '—',
        lokasi: p.lokasi || '—',
        sectionContext: p.sectionContext || '',
        volume: p.volume ? p.volume.toLocaleString('id-ID') : '—',
        unit: p.unit || '—',

        // Numeric fields for sorting
        capexBaseNum,
        capexInflatedNum,
        rabNum,
        rkapNum,
        obNum,
        prNum,
        poNum,
        vowdNum,
        rnaNum,

        // Formatted display fields
        capexBase: formatRupiahCompact(capexBaseNum),
        capexInflated: formatRupiahCompact(capexInflatedNum),
        rab: formatRupiahCompact(rabNum),
        rkap: formatRupiahCompact(rkapNum),
        ob: formatRupiahCompact(obNum),
        pr: formatRupiahCompact(prNum),
        po: formatRupiahCompact(poNum),
        vowd: formatRupiahCompact(vowdNum),
        rna: formatRupiahCompact(rnaNum),

        // Procurement stats
        numBudgetCodes,
        numPr,
        prValueNum: prNum,
        prValue: formatRupiahCompact(prNum),
        latestPrDate,
        numPo,
        poValueNum: poNum,
        poValue: formatRupiahCompact(poNum),
        latestPoDate,
        relationshipStatus: relStatus,

        procurementRows: uiProcRows,
      };
    });
  }, [projectRows, financialMap, procurementGroupedMap, vowdGroupedMap]);

  // Filtering Logic
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allProjectItems.filter((item) => {
      // Search predicate across Project Code, Sub Project, Program, Tahun Program, Project Bundling, Section Context
      if (q) {
        const matchesSearch = [
          item.projectCode,
          item.subProject,
          item.program,
          item.tahunProgram,
          item.projectBundling,
          item.sectionContext,
        ].some((value) =>
          String(value ?? '')
            .trim()
            .toLowerCase()
            .includes(q)
        );

        if (!matchesSearch) return false;
      }

      // Primary filters
      if (typeFilter !== 'All' && item.projectType !== typeFilter) return false;
      if (bundlingFilter !== 'All' && item.projectBundling !== bundlingFilter) return false;
      if (scheduleFilter !== 'All' && item.schedule !== scheduleFilter) return false;
      if (tokFilter !== 'All' && item.tok !== tokFilter) return false;

      // Secondary filters
      if (tahunFilter !== 'All' && item.tahunProgram !== tahunFilter) return false;
      if (subProjectFilter !== 'All' && item.subProject !== subProjectFilter) return false;
      if (programFilter !== 'All' && item.program !== programFilter) return false;
      if (kategoriFilter !== 'All' && item.kategori !== kategoriFilter) return false;
      if (lokasiFilter !== 'All' && item.lokasi !== lokasiFilter) return false;

      return true;
    });
  }, [
    allProjectItems,
    searchQuery,
    typeFilter,
    bundlingFilter,
    scheduleFilter,
    tokFilter,
    tahunFilter,
    subProjectFilter,
    programFilter,
    kategoriFilter,
    lokasiFilter,
  ]);

  // Sorting Logic
  const sortedProjects = useMemo(() => {
    const list = [...filteredProjects];

    list.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortField) {
        case 'projectCode':
          if (!a.projectCode && b.projectCode) return 1;
          if (a.projectCode && !b.projectCode) return -1;
          valA = a.projectCode;
          valB = b.projectCode;
          break;
        case 'projectType':
          valA = a.projectType;
          valB = b.projectType;
          break;
        case 'projectBundling':
          valA = a.projectBundling;
          valB = b.projectBundling;
          break;
        case 'schedule':
          valA = a.schedule;
          valB = b.schedule;
          break;
        case 'tok':
          valA = a.tok;
          valB = b.tok;
          break;
        case 'subProject':
          valA = a.subProject;
          valB = b.subProject;
          break;
        case 'program':
          valA = a.program;
          valB = b.program;
          break;

        // Financial numeric metrics
        case 'capexBase':
          valA = a.capexBaseNum;
          valB = b.capexBaseNum;
          break;
        case 'capexInflated':
          valA = a.capexInflatedNum;
          valB = b.capexInflatedNum;
          break;
        case 'rab':
          valA = a.rabNum;
          valB = b.rabNum;
          break;
        case 'rkap':
          valA = a.rkapNum;
          valB = b.rkapNum;
          break;
        case 'ob':
          valA = a.obNum;
          valB = b.obNum;
          break;
        case 'pr':
          valA = a.prNum;
          valB = b.prNum;
          break;
        case 'po':
          valA = a.poNum;
          valB = b.poNum;
          break;
        case 'vowd':
          valA = a.vowdNum;
          valB = b.vowdNum;
          break;
        case 'rna':
          valA = a.rnaNum;
          valB = b.rnaNum;
          break;

        // Procurement view metrics
        case 'numBudgetCodes':
          valA = a.numBudgetCodes;
          valB = b.numBudgetCodes;
          break;
        case 'numPr':
          valA = a.numPr;
          valB = b.numPr;
          break;
        case 'prValue':
          valA = a.prValueNum;
          valB = b.prValueNum;
          break;
        case 'numPo':
          valA = a.numPo;
          valB = b.numPo;
          break;
        case 'poValue':
          valA = a.poValueNum;
          valB = b.poValueNum;
          break;
        case 'relationshipStatus':
          valA = a.relationshipStatus;
          valB = b.relationshipStatus;
          break;

        default:
          valA = a.projectCode;
          valB = b.projectCode;
      }

      // Null handling: keep nulls at the bottom regardless of sort direction
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredProjects, sortField, sortDirection]);

  // Reset pagination when filters, query, viewMode, or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    typeFilter,
    bundlingFilter,
    scheduleFilter,
    tokFilter,
    tahunFilter,
    subProjectFilter,
    programFilter,
    kategoriFilter,
    lokasiFilter,
    viewMode,
  ]);

  // Dynamic Page Counts
  const totalCount = filteredProjects.length;
  const greenfieldCount = useMemo(() => filteredProjects.filter(p => p.projectType === 'Greenfield').length, [filteredProjects]);
  const brownfieldCount = useMemo(() => filteredProjects.filter(p => p.projectType === 'Brownfield').length, [filteredProjects]);

  // Active secondary filters count
  const activeSecondaryFiltersCount = useMemo(() => {
    let cnt = 0;
    if (tahunFilter !== 'All') cnt++;
    if (subProjectFilter !== 'All') cnt++;
    if (programFilter !== 'All') cnt++;
    if (kategoriFilter !== 'All') cnt++;
    if (lokasiFilter !== 'All') cnt++;
    return cnt;
  }, [tahunFilter, subProjectFilter, programFilter, kategoriFilter, lokasiFilter]);

  const hasAnyFilterActive =
    searchQuery !== '' ||
    typeFilter !== 'All' ||
    bundlingFilter !== 'All' ||
    scheduleFilter !== 'All' ||
    tokFilter !== 'All' ||
    activeSecondaryFiltersCount > 0;

  const resetAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('All');
    setBundlingFilter('All');
    setScheduleFilter('All');
    setTokFilter('All');
    setTahunFilter('All');
    setSubProjectFilter('All');
    setProgramFilter('All');
    setKategoriFilter('All');
    setLokasiFilter('All');
  };

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const pageItems = sortedProjects.slice(startIndex, startIndex + pageSize);

  // Pagination Generator
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (validCurrentPage > 3) pages.push('...');

      const start = Math.max(2, validCurrentPage - 1);
      const end = Math.min(totalPages - 1, validCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) pages.push(i);
      }

      if (validCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, validCurrentPage]);

  // Sort click handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Row click handler - passes technical Project Key internally
  const handleRowClick = (item: ProjectItem) => {
    onSelectProject(item);
    onNavigate('project-detail');
  };

  // Sort indicator icon
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-[#a0a4b8] opacity-60 inline ml-1" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-[#004ac6] inline ml-1 font-bold" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-[#004ac6] inline ml-1 font-bold" />
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-[#c3c6d7] rounded-lg p-12 text-center shadow-2xs">
        <RefreshCw className="w-8 h-8 text-[#004ac6] animate-spin mb-3" />
        <p className="text-sm font-semibold text-[#161c22]">Loading Master Project Directory...</p>
        <p className="text-xs text-[#5c647a] mt-1">Integrating DASH_PROJECT and financial metrics</p>
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
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 pb-1 border-b border-[#dde3eb]">
        <div>
          <h2 className="text-xl font-bold text-[#161c22] tracking-tight">Project Portfolio</h2>
          <p className="text-[13px] text-[#5c647a] mt-0.5">
            Master project directory and financial monitoring
          </p>
        </div>

        {/* Dynamic Page Header Counts */}
        <div className="flex items-center gap-2 text-[13px] text-[#434655] bg-white px-3 py-1.5 rounded border border-[#c3c6d7] shadow-2xs">
          <span className="font-bold text-[#161c22]">
            {totalCount.toLocaleString()} Projects
          </span>
          <span className="text-[#c3c6d7]">•</span>
          <span className="font-semibold text-[#003ea8]">
            {greenfieldCount.toLocaleString()} Greenfield
          </span>
          <span className="text-[#c3c6d7]">•</span>
          <span className="font-semibold text-[#48566a]">
            {brownfieldCount.toLocaleString()} Brownfield
          </span>
        </div>
      </div>

      {/* Toolbar (Search & Filters & View Toggle) */}
      <div className="bg-white border border-[#c3c6d7] rounded-lg p-3 shadow-2xs flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Box */}
            <div className="relative w-full sm:w-[320px]">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-[#737686]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Project Code, Sub Project, Program..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#f6f9ff] border border-[#c3c6d7] rounded text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6]"
              />
            </div>

            {/* Quick Filter: Project Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-2.5 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6] cursor-pointer"
            >
              <option value="All">Project Type: All</option>
              <option value="Greenfield">Greenfield</option>
              <option value="Brownfield">Brownfield</option>
            </select>

            {/* Quick Filter: Project Bundling */}
            <select
              value={bundlingFilter}
              onChange={(e) => setBundlingFilter(e.target.value)}
              className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-2.5 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6] cursor-pointer"
            >
              <option value="All">Project Bundling: All</option>
              {BUNDLINGS.slice(1).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Quick Filter: Schedule */}
            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
              className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-2.5 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6] cursor-pointer"
            >
              <option value="All">Schedule: All</option>
              <option value="Master Schedule">Master Schedule</option>
              <option value="Non-Master Schedule">Non-Master Schedule</option>
            </select>

            {/* Quick Filter: TOK */}
            <select
              value={tokFilter}
              onChange={(e) => setTokFilter(e.target.value)}
              className="bg-[#f6f9ff] border border-[#c3c6d7] rounded px-2.5 py-1.5 text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6] cursor-pointer max-w-[180px]"
            >
              {tokOptions.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'TOK: All' : t}
                </option>
              ))}
            </select>

            {/* More Filters Toggle */}
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-[13px] font-medium transition-colors cursor-pointer ${
                activeSecondaryFiltersCount > 0 || showMoreFilters
                  ? 'bg-[#eef4fc] border-[#004ac6] text-[#004ac6]'
                  : 'bg-[#f6f9ff] border-[#c3c6d7] text-[#434655] hover:bg-[#eef4fc]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>More Filters</span>
              {activeSecondaryFiltersCount > 0 && (
                <span className="bg-[#004ac6] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeSecondaryFiltersCount}
                </span>
              )}
            </button>

            {/* Clear Filters Button */}
            {hasAnyFilterActive && (
              <button
                onClick={resetAllFilters}
                className="text-[12px] font-semibold text-[#004ac6] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </div>

          {/* View Mode Toggle: Financial View | Procurement View */}
          <div className="flex bg-[#e3e9f1] rounded p-0.5 border border-[#c3c6d7] shrink-0 self-start lg:self-auto">
            <button
              onClick={() => setViewMode('financial')}
              className={`px-3 py-1 text-[13px] font-semibold rounded transition-all cursor-pointer ${
                viewMode === 'financial'
                  ? 'bg-white text-[#004ac6] shadow-2xs'
                  : 'text-[#434655] hover:text-[#161c22]'
              }`}
            >
              Financial View
            </button>
            <button
              onClick={() => setViewMode('procurement')}
              className={`px-3 py-1 text-[13px] font-semibold rounded transition-all cursor-pointer ${
                viewMode === 'procurement'
                  ? 'bg-white text-[#004ac6] shadow-2xs'
                  : 'text-[#434655] hover:text-[#161c22]'
              }`}
            >
              Procurement View
            </button>
          </div>
        </div>

        {/* Expandable "More Filters" Drawer */}
        {showMoreFilters && (
          <div className="pt-3 border-t border-[#dde3eb] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-[#f8fafc] p-3 rounded">
            <div>
              <label className="text-[11px] font-bold text-[#565e74] uppercase block mb-1">
                Tahun Program
              </label>
              <select
                value={tahunFilter}
                onChange={(e) => setTahunFilter(e.target.value)}
                className="w-full bg-white border border-[#c3c6d7] rounded px-2 py-1 text-[12px] text-[#161c22] focus:outline-none focus:border-[#004ac6]"
              >
                {tahunOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#565e74] uppercase block mb-1">
                Sub Project
              </label>
              <select
                value={subProjectFilter}
                onChange={(e) => setSubProjectFilter(e.target.value)}
                className="w-full bg-white border border-[#c3c6d7] rounded px-2 py-1 text-[12px] text-[#161c22] focus:outline-none focus:border-[#004ac6]"
              >
                {subProjectOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#565e74] uppercase block mb-1">
                Program
              </label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full bg-white border border-[#c3c6d7] rounded px-2 py-1 text-[12px] text-[#161c22] focus:outline-none focus:border-[#004ac6]"
              >
                {programOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#565e74] uppercase block mb-1">
                Kategori
              </label>
              <select
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
                className="w-full bg-white border border-[#c3c6d7] rounded px-2 py-1 text-[12px] text-[#161c22] focus:outline-none focus:border-[#004ac6]"
              >
                {kategoriOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#565e74] uppercase block mb-1">
                Lokasi
              </label>
              <select
                value={lokasiFilter}
                onChange={(e) => setLokasiFilter(e.target.value)}
                className="w-full bg-white border border-[#c3c6d7] rounded px-2 py-1 text-[12px] text-[#161c22] focus:outline-none focus:border-[#004ac6]"
              >
                {lokasiOptions.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* FINANCIAL VIEW TABLE */}
      {viewMode === 'financial' && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg shadow-2xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[2000px] text-left border-collapse text-[13px]">
              <thead className="bg-[#f1f5f9] text-[#434655] font-bold text-[11px] uppercase tracking-wider sticky top-0 z-20 border-b border-[#c3c6d7]">
                <tr>
                  <th colSpan={7} className="py-2.5 px-3 border-r border-[#c3c6d7] bg-[#eef4fc] text-[#003ea8]">
                    PROJECT INFORMATION
                  </th>
                  <th colSpan={9} className="py-2.5 px-3 text-center bg-[#f1f5f9]">
                    FINANCIAL POSITION
                  </th>
                </tr>
                <tr className="border-t border-[#c3c6d7] bg-[#f8fafc]">
                  <th
                    onClick={() => handleSort('projectCode')}
                    className="py-2 px-3 border-b border-[#c3c6d7] sticky left-0 bg-[#f8fafc] z-30 shadow-xs w-[140px] cursor-pointer hover:bg-[#eef4fc]"
                  >
                    Project Code {renderSortIcon('projectCode')}
                  </th>
                  <th onClick={() => handleSort('projectType')} className="py-2 px-3 border-b border-[#c3c6d7] cursor-pointer hover:bg-[#eef4fc]">
                    Project Type {renderSortIcon('projectType')}
                  </th>
                  <th onClick={() => handleSort('projectBundling')} className="py-2 px-3 border-b border-[#c3c6d7] cursor-pointer hover:bg-[#eef4fc]">
                    Project Bundling {renderSortIcon('projectBundling')}
                  </th>
                  <th onClick={() => handleSort('schedule')} className="py-2 px-3 border-b border-[#c3c6d7] cursor-pointer hover:bg-[#eef4fc]">
                    Schedule {renderSortIcon('schedule')}
                  </th>
                  <th onClick={() => handleSort('tok')} className="py-2 px-3 border-b border-[#c3c6d7] text-center cursor-pointer hover:bg-[#eef4fc]">
                    TOK {renderSortIcon('tok')}
                  </th>
                  <th onClick={() => handleSort('subProject')} className="py-2 px-3 border-b border-[#c3c6d7] cursor-pointer hover:bg-[#eef4fc]">
                    Sub Project {renderSortIcon('subProject')}
                  </th>
                  <th onClick={() => handleSort('program')} className="py-2 px-3 border-b border-[#c3c6d7] border-r border-[#c3c6d7] cursor-pointer hover:bg-[#eef4fc]">
                    Program {renderSortIcon('program')}
                  </th>

                  <th onClick={() => handleSort('capexBase')} className="py-2 px-3 border-b border-[#c3c6d7] text-right font-mono cursor-pointer hover:bg-[#eef4fc]">
                    CAPEX Base {renderSortIcon('capexBase')}
                  </th>
                  <th onClick={() => handleSort('capexInflated')} className="py-2 px-3 border-b border-[#c3c6d7] text-right font-mono cursor-pointer hover:bg-[#eef4fc]">
                    CAPEX Inflated {renderSortIcon('capexInflated')}
                  </th>
                  <th onClick={() => handleSort('rab')} className="py-2 px-3 border-b border-[#c3c6d7] text-right font-mono cursor-pointer hover:bg-[#eef4fc]">
                    RAB {renderSortIcon('rab')}
                  </th>
                  <th onClick={() => handleSort('rkap')} className="py-2 px-3 border-b border-[#c3c6d7] text-right font-mono cursor-pointer hover:bg-[#eef4fc]">
                    RKAP {renderSortIcon('rkap')}
                  </th>
                  <th onClick={() => handleSort('ob')} className="py-2 px-3 border-b border-[#c3c6d7] text-right font-mono cursor-pointer hover:bg-[#eef4fc]">
                    OB {renderSortIcon('ob')}
                  </th>
                  <th onClick={() => handleSort('pr')} className="py-2 px-3 border-b border-[#c3c6d7] text-right font-mono cursor-pointer hover:bg-[#eef4fc]">
                    PR {renderSortIcon('pr')}
                  </th>
                  <th onClick={() => handleSort('po')} className="py-2 px-3 border-b border-[#c3c6d7] text-right font-mono cursor-pointer hover:bg-[#eef4fc]">
                    PO {renderSortIcon('po')}
                  </th>
                  <th onClick={() => handleSort('vowd')} className="py-2 px-3 border-b border-[#c3c6d7] text-right font-mono cursor-pointer hover:bg-[#eef4fc]">
                    VOWD {renderSortIcon('vowd')}
                  </th>
                  <th onClick={() => handleSort('rna')} className="py-2 px-3 border-b border-[#c3c6d7] text-right font-mono cursor-pointer hover:bg-[#eef4fc]">
                    RNA {renderSortIcon('rna')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde3eb]">
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-8 text-center text-[#5c647a]">
                      No projects found matching the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item) => (
                    <tr
                      key={item.projectKey}
                      onClick={() => handleRowClick(item)}
                      className="hover:bg-[#f6f9ff] cursor-pointer transition-colors h-[38px] group"
                    >
                      <td className="py-2 px-3 sticky left-0 bg-white group-hover:bg-[#f6f9ff] z-10 shadow-xs font-semibold text-[#004ac6]">
                        {item.projectCode ? (
                          <span className="group-hover:underline">{item.projectCode}</span>
                        ) : (
                          <span className="text-[#737686] italic font-normal">No Project Code</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#161c22] whitespace-nowrap">{item.projectType}</td>
                      <td className="py-2 px-3 text-[#161c22] whitespace-nowrap">{item.projectBundling}</td>
                      <td className="py-2 px-3 text-[#161c22] whitespace-nowrap">{item.schedule}</td>
                      <td className="py-2 px-3 text-[#161c22] text-center whitespace-nowrap">{item.tok}</td>
                      <td className="py-2 px-3 text-[#161c22] whitespace-nowrap max-w-[200px] truncate" title={item.subProject}>
                        {item.subProject}
                      </td>
                      <td className="py-2 px-3 text-[#161c22] border-r border-[#dde3eb] whitespace-nowrap max-w-[200px] truncate" title={item.program}>
                        {item.program}
                      </td>

                      <td className="py-2 px-3 text-right font-mono text-[#161c22] whitespace-nowrap">{item.capexBase}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#004ac6] font-medium whitespace-nowrap">{item.capexInflated}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#161c22] whitespace-nowrap">{item.rab}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#161c22] whitespace-nowrap">{item.rkap}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#161c22] whitespace-nowrap">{item.ob}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#161c22] whitespace-nowrap">{item.pr}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#161c22] whitespace-nowrap">{item.po}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#004ac6] whitespace-nowrap">{item.vowd}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#161c22] whitespace-nowrap">{item.rna}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="border-t border-[#c3c6d7] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f6f9ff]">
            <div className="text-[12px] text-[#5c647a]">
              Showing {sortedProjects.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, sortedProjects.length)} of {sortedProjects.length.toLocaleString()} projects
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 rounded border border-[#c3c6d7] text-[#161c22] hover:bg-[#e3e9f1] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((p, idx) => {
                if (typeof p === 'string') {
                  return <span key={idx} className="px-1 text-[#5c647a] text-[12px]">...</span>;
                }
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded text-[12px] font-bold flex items-center justify-center cursor-pointer transition-colors ${
                      validCurrentPage === p
                        ? 'bg-[#004ac6] text-white shadow-2xs'
                        : 'text-[#161c22] hover:bg-[#e3e9f1]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={validCurrentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 rounded border border-[#c3c6d7] text-[#161c22] hover:bg-[#e3e9f1] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCUREMENT VIEW TABLE */}
      {viewMode === 'procurement' && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg shadow-2xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead className="bg-[#f1f5f9] text-[#434655] font-bold text-[11px] uppercase tracking-wider sticky top-0 z-20 border-b border-[#c3c6d7]">
                <tr>
                  <th
                    onClick={() => handleSort('projectCode')}
                    className="py-2.5 px-3 border-b border-[#c3c6d7] sticky left-0 bg-[#f1f5f9] z-30 shadow-xs w-[140px] cursor-pointer hover:bg-[#eef4fc]"
                  >
                    Project Code {renderSortIcon('projectCode')}
                  </th>
                  <th onClick={() => handleSort('projectBundling')} className="py-2.5 px-3 border-b border-[#c3c6d7] cursor-pointer hover:bg-[#eef4fc]">
                    Project Bundling {renderSortIcon('projectBundling')}
                  </th>
                  <th onClick={() => handleSort('numBudgetCodes')} className="py-2.5 px-3 border-b border-[#c3c6d7] text-right cursor-pointer hover:bg-[#eef4fc]">
                    # Budget Codes {renderSortIcon('numBudgetCodes')}
                  </th>
                  <th onClick={() => handleSort('numPr')} className="py-2.5 px-3 border-b border-[#c3c6d7] text-right cursor-pointer hover:bg-[#eef4fc]">
                    Unique PR {renderSortIcon('numPr')}
                  </th>
                  <th onClick={() => handleSort('prValue')} className="py-2.5 px-3 border-b border-[#c3c6d7] text-right font-mono cursor-pointer hover:bg-[#eef4fc]">
                    Total PR Value {renderSortIcon('prValue')}
                  </th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-center">
                    Latest PR Date
                  </th>
                  <th onClick={() => handleSort('numPo')} className="py-2.5 px-3 border-b border-[#c3c6d7] text-right cursor-pointer hover:bg-[#eef4fc]">
                    Unique PO {renderSortIcon('numPo')}
                  </th>
                  <th onClick={() => handleSort('poValue')} className="py-2.5 px-3 border-b border-[#c3c6d7] text-right font-mono cursor-pointer hover:bg-[#eef4fc]">
                    Total PO Value {renderSortIcon('poValue')}
                  </th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-center">
                    Latest PO Date
                  </th>
                  <th onClick={() => handleSort('relationshipStatus')} className="py-2.5 px-3 border-b border-[#c3c6d7] cursor-pointer hover:bg-[#eef4fc]">
                    Relationship Status {renderSortIcon('relationshipStatus')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde3eb]">
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-[#5c647a]">
                      No projects found matching the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item) => (
                    <tr
                      key={item.projectKey}
                      onClick={() => handleRowClick(item)}
                      className="hover:bg-[#f6f9ff] cursor-pointer transition-colors h-[38px] group"
                    >
                      <td className="py-2 px-3 sticky left-0 bg-white group-hover:bg-[#f6f9ff] z-10 shadow-xs font-semibold text-[#004ac6]">
                        {item.projectCode ? (
                          <span className="group-hover:underline">{item.projectCode}</span>
                        ) : (
                          <span className="text-[#737686] italic font-normal">No Project Code</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#161c22] whitespace-nowrap">{item.projectBundling}</td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-[#161c22]">{item.numBudgetCodes}</td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-[#161c22]">{item.numPr}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#004ac6] font-medium whitespace-nowrap">{item.prValue}</td>
                      <td className="py-2 px-3 text-center text-[#5c647a] whitespace-nowrap">{item.latestPrDate}</td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-[#161c22]">{item.numPo}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#004ac6] font-medium whitespace-nowrap">{item.poValue}</td>
                      <td className="py-2 px-3 text-center text-[#5c647a] whitespace-nowrap">{item.latestPoDate}</td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.relationshipStatus === 'No Procurement'
                            ? 'bg-[#f1f5f9] text-[#5c647a]'
                            : item.relationshipStatus === '1 PR → 1 PO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.relationshipStatus === 'PR Without PO'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.relationshipStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="border-t border-[#c3c6d7] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f6f9ff]">
            <div className="text-[12px] text-[#5c647a]">
              Showing {sortedProjects.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, sortedProjects.length)} of {sortedProjects.length.toLocaleString()} projects
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 rounded border border-[#c3c6d7] text-[#161c22] hover:bg-[#e3e9f1] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((p, idx) => {
                if (typeof p === 'string') {
                  return <span key={idx} className="px-1 text-[#5c647a] text-[12px]">...</span>;
                }
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded text-[12px] font-bold flex items-center justify-center cursor-pointer transition-colors ${
                      validCurrentPage === p
                        ? 'bg-[#004ac6] text-white shadow-2xs'
                        : 'text-[#161c22] hover:bg-[#e3e9f1]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={validCurrentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 rounded border border-[#c3c6d7] text-[#161c22] hover:bg-[#e3e9f1] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
