import React, { useState, useEffect, useMemo } from 'react';
import { RouteId, ProcurementRow, ProjectRow, ProjectItem } from '../types';
import { useData } from '../context/DataContext';
import {
  Search,
  ExternalLink,
  ArrowRight,
  Wallet,
  FileText,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Building2,
} from 'lucide-react';


interface ProcurementExplorerProps {
  onNavigate: (route: RouteId) => void;
  onSelectProject?: (project: ProjectItem) => void;
}

// Rupiah Compact Formatter according to guidelines
const hasRealVal = (v?: string | null): v is string =>
  v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '—';

const getVisibleRkapCode = (r?: { kodeBudgetRkapDisplay?: string | null; kodeBudgetRkap?: string | null } | null) => {
  if (!r) return null;
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

const getVisibleDescription = (r?: { descriptionDisplay?: string | null; description?: string | null } | null) => {
  if (!r) return null;
  if (hasRealVal(r.descriptionDisplay)) return r.descriptionDisplay;
  if (hasRealVal(r.description)) return r.description;
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

const getVisibleRelationshipType = (r?: { relationshipTypeDisplay?: string | null; relationshipType?: string | null } | null) => {
  if (!r) return null;
  if (hasRealVal(r.relationshipTypeDisplay)) return r.relationshipTypeDisplay;
  if (hasRealVal(r.relationshipType)) return r.relationshipType;
  return null;
};

const getVisiblePrDate = (r?: { prDateDisplay?: string | null; prDate?: string | null } | null) => {
  if (!r) return null;
  if (hasRealVal(r.prDateDisplay)) return r.prDateDisplay;
  if (hasRealVal(r.prDate)) return r.prDate;
  return null;
};

const getVisiblePoDate = (r?: { poDateDisplay?: string | null; poDate?: string | null } | null) => {
  if (!r) return null;
  if (hasRealVal(r.poDateDisplay)) return r.poDateDisplay;
  if (hasRealVal(r.poDate)) return r.poDate;
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

const formatRupiahCompactId = (
  num: number | null | undefined
): string => {
  if (num === null || num === undefined) return '—';

  return 'Rp ' + Math.round(num).toLocaleString('id-ID', {
    maximumFractionDigits: 0,
  });
};

// Full Rupiah Formatter for Tooltips
const formatRupiahFull = (
  num: number | null | undefined
): string => {
  if (num === null || num === undefined) return '—';

  return 'Rp ' + Math.round(num).toLocaleString('id-ID', {
    maximumFractionDigits: 0,
  });
};

// Date Formatter: "06 Feb 2024", "16 Jul 2024"
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr === '-' || dateStr === '—' || !dateStr.trim()) return '—';
  const clean = dateStr.trim();

  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      let d = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10) - 1;
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      const dateObj = new Date(y, m, d);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    }
  }

  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return clean;
};

// Get Year helper from Date string
const getYearFromDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr === '-' || dateStr === '—' || !dateStr.trim()) return null;
  const clean = dateStr.trim();
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      return y.toString();
    }
  }
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.getFullYear().toString();
  }
  return null;
};

// Relationship Type Status Logic (strict DASH_PROCUREMENT)
const getProjectRelationshipStatus = (pRows: ProcurementRow[]): string => {
  if (!pRows || pRows.length === 0) return 'NO PROCUREMENT RECORD';

  const prToPos = new Map<string, Set<string>>();
  const poToPrs = new Map<string, Set<string>>();

  pRows.forEach((r) => {
    const pr = (getVisiblePrNumber(r) || '').trim();
    const po = (getVisiblePoNumber(r) || '').trim();

    if (pr && pr !== '—') {
      if (!prToPos.has(pr)) prToPos.set(pr, new Set());
      if (po && po !== '—') prToPos.get(pr)?.add(po);
    }

    if (po && po !== '—') {
      if (!poToPrs.has(po)) poToPrs.set(po, new Set());
      if (pr && pr !== '—') poToPrs.get(po)?.add(pr);
    }
  });

  if (prToPos.size === 0 && poToPrs.size === 0) return 'NO PR / PO';

  let hasPrWithoutPo = false;
  let hasPrMultiPo = false;
  prToPos.forEach((poSet) => {
    if (poSet.size === 0) hasPrWithoutPo = true;
    if (poSet.size > 1) hasPrMultiPo = true;
  });

  let hasMultiPrPo = false;
  poToPrs.forEach((prSet) => {
    if (prSet.size > 1) hasMultiPrPo = true;
  });

  const isComplex =
    (hasPrWithoutPo ? 1 : 0) + (hasPrMultiPo ? 1 : 0) + (hasMultiPrPo ? 1 : 0) > 1;

  if (isComplex) return 'Complex Relationship';
  if (hasPrMultiPo) return 'PR → Multiple PO';
  if (hasMultiPrPo) return 'Multiple PR → PO';
  if (hasPrWithoutPo) return 'PR Without PO';
  if (prToPos.size === 1 && poToPrs.size === 1) return '1 PR → 1 PO';

  return '1 PR → 1 PO';
};

export const ProcurementExplorer: React.FC<ProcurementExplorerProps> = ({
  onNavigate,
  onSelectProject,
}) => {
  // Shared Data Context
  const {
    procurement: procurementRows,
    projects: projectRows,
    procurementValueGroupByKeyMap,
    loading,
    refreshing,
    error,
    lastRefreshed,
    refreshData,
  } = useData();

  // View Mode: 'project' | 'pr' | 'po'
  const [viewMode, setViewMode] = useState<'project' | 'pr' | 'po'>('project');


  // Default Project Key
  const DEFAULT_PROJECT_KEY =
    'Jatiluhur Hilir | I | CODE:23ABJ.NSRJT1L07 | Biaya Persiapan | Asuransi Proyek & Aset 2023';

  // Selected Context State
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null);
  const [explicitProjectKey, setExplicitProjectKey] = useState<string | null>(null);

  const [selectedPrNumber, setSelectedPrNumber] = useState<string | null>(null);
  const [explicitPrNumber, setExplicitPrNumber] = useState<string | null>(null);

  const [selectedPoNumber, setSelectedPoNumber] = useState<string | null>(null);
  const [explicitPoNumber, setExplicitPoNumber] = useState<string | null>(null);

  // Focus state for Relationship Flow
  const [selectedRelNode, setSelectedRelNode] = useState<{
    type: 'pr' | 'po' | 'budgetCode';
    value: string;
  } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [bundlingFilter, setBundlingFilter] = useState<string>('All');
  const [scheduleFilter, setScheduleFilter] = useState<string>('All');
  const [tokFilter, setTokFilter] = useState<string>('All');
  const [prYearFilter, setPrYearFilter] = useState<string>('All');
  const [poYearFilter, setPoYearFilter] = useState<string>('All');
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState<string>('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Debounce search input (~250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    typeFilter,
    bundlingFilter,
    scheduleFilter,
    tokFilter,
    prYearFilter,
    poYearFilter,
    relationshipTypeFilter,
    viewMode,
  ]);

  // Handle View Mode Switching
  const handleViewModeChange = (mode: 'project' | 'pr' | 'po') => {
    setViewMode(mode);
    setSelectedRelNode(null);
    setSelectedProjectKey(null);
    setExplicitProjectKey(null);
    setSelectedPrNumber(null);
    setExplicitPrNumber(null);
    setSelectedPoNumber(null);
    setExplicitPoNumber(null);
  };

  // Overall Dataset KPIs (Unfiltered DASH_PROCUREMENT rules)
  const globalKpis = useMemo(() => {
    if (procurementRows.length === 0) {
      return {
        distinctPrPoCodes: 0,
        uniquePr: 0,
        uniquePo: 0,
        prWithoutPo: 0,
        prMultiPo: 0,
        multiPrPo: 0,
      };
    }

    const prPoSet = new Set<string>();
    const prToPos = new Map<string, Set<string>>();
    const poToPrs = new Map<string, Set<string>>();

    procurementRows.forEach((r) => {
      const code = (r.kodeBudgetPrPo || '').trim();
      if (code && code !== '—') prPoSet.add(code);

      const pr = (r.prNumber || '').trim();
      const po = (r.poNumber || '').trim();

      if (pr && pr !== '—') {
        if (!prToPos.has(pr)) prToPos.set(pr, new Set());
        if (po && po !== '—') prToPos.get(pr)?.add(po);
      }

      if (po && po !== '—') {
        if (!poToPrs.has(po)) poToPrs.set(po, new Set());
        if (pr && pr !== '—') poToPrs.get(po)?.add(pr);
      }
    });

    let prWithoutPo = 0;
    let prMultiPo = 0;
    prToPos.forEach((poSet) => {
      if (poSet.size === 0) prWithoutPo++;
      if (poSet.size > 1) prMultiPo++;
    });

    let multiPrPo = 0;
    poToPrs.forEach((prSet) => {
      if (prSet.size > 1) multiPrPo++;
    });

    return {
      distinctPrPoCodes: prPoSet.size,
      uniquePr: prToPos.size,
      uniquePo: poToPrs.size,
      prWithoutPo,
      prMultiPo,
      multiPrPo,
    };
  }, [procurementRows]);

  // Filter Dropdown Options
  const filterOptions = useMemo(() => {
    const bundlings = new Set<string>();
    const schedules = new Set<string>();
    const toks = new Set<string>();
    const prYears = new Set<string>();
    const poYears = new Set<string>();

    projectRows.forEach((p) => {
      if (p.projectBundling) bundlings.add(p.projectBundling);
      if (p.schedule) schedules.add(p.schedule);
      if (p.tok) toks.add(p.tok);
    });

    procurementRows.forEach((r) => {
      if (r.projectBundling) bundlings.add(r.projectBundling);
      if (r.schedule) schedules.add(r.schedule);
      if (r.tok) toks.add(r.tok);

      const pry = getYearFromDate(r.prDate);
      if (pry) prYears.add(pry);

      const poy = getYearFromDate(r.poDate);
      if (poy) poYears.add(poy);
    });

    return {
      bundlings: Array.from(bundlings).sort(),
      schedules: Array.from(schedules).sort(),
      toks: Array.from(toks).sort(),
      prYears: Array.from(prYears).sort(),
      poYears: Array.from(poYears).sort(),
    };
  }, [projectRows, procurementRows]);

  // Map of projectKey -> project lines
  const projectProcMap = useMemo(() => {
    const map = new Map<string, ProcurementRow[]>();
    procurementRows.forEach((r) => {
      if (!map.has(r.projectKey)) map.set(r.projectKey, []);
      map.get(r.projectKey)!.push(r);
    });
    return map;
  }, [procurementRows]);

  // Map of projectKey -> ProjectRow
  const projectDetailMap = useMemo(() => {
    const map = new Map<string, ProjectRow>();
    projectRows.forEach((p) => {
      map.set(p.projectKey, p);
    });
    return map;
  }, [projectRows]);

  // Base Project Universe for View Mode = 'project'
  const filteredProjects = useMemo(() => {
    if (viewMode !== 'project') return [];

    let list = projectRows;

    if (typeFilter !== 'All') {
      list = list.filter((p) => p.projectType === typeFilter);
    }
    if (bundlingFilter !== 'All') {
      list = list.filter((p) => p.projectBundling === bundlingFilter);
    }
    if (scheduleFilter !== 'All') {
      list = list.filter((p) => p.schedule === scheduleFilter);
    }
    if (tokFilter !== 'All') {
      list = list.filter((p) => p.tok === tokFilter);
    }

    if (relationshipTypeFilter !== 'All' || prYearFilter !== 'All' || poYearFilter !== 'All') {
      list = list.filter((p) => {
        const pRows = projectProcMap.get(p.projectKey) || [];

        if (relationshipTypeFilter !== 'All') {
          const status = getProjectRelationshipStatus(pRows);
          if (status !== relationshipTypeFilter) return false;
        }

        if (prYearFilter !== 'All') {
          const hasPrYear = pRows.some((r) => getYearFromDate(r.prDate) === prYearFilter);
          if (!hasPrYear) return false;
        }

        if (poYearFilter !== 'All') {
          const hasPoYear = pRows.some((r) => getYearFromDate(r.poDate) === poYearFilter);
          if (!hasPoYear) return false;
        }

        return true;
      });
    }

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.trim().toLowerCase();
      list = list.filter((p) => {
        const matchProjCode = p.projectCode && p.projectCode.toLowerCase().includes(q);
        const matchSubProj = p.subProject && p.subProject.toLowerCase().includes(q);
        const matchProg = p.program && p.program.toLowerCase().includes(q);
        if (matchProjCode || matchSubProj || matchProg) return true;

        const pRows = projectProcMap.get(p.projectKey) || [];
        return pRows.some((r) => {
          const visRkap = getVisibleRkapCode(r);
          const visPrPo = getVisiblePrPoCode(r);
          const visDesc = getVisibleDescription(r);
          const visPr = getVisiblePrNumber(r);
          const visPo = getVisiblePoNumber(r);
          return (
            (visPr && visPr.toLowerCase().includes(q)) ||
            (visPo && visPo.toLowerCase().includes(q)) ||
            (visRkap && visRkap.toLowerCase().includes(q)) ||
            (visPrPo && visPrPo.toLowerCase().includes(q)) ||
            (visDesc && visDesc.toLowerCase().includes(q))
          );
        });
      });
    }

    return list;
  }, [
    viewMode,
    projectRows,
    typeFilter,
    bundlingFilter,
    scheduleFilter,
    tokFilter,
    relationshipTypeFilter,
    prYearFilter,
    poYearFilter,
    debouncedSearchQuery,
    projectProcMap,
  ]);

  // Global Filtered Procurement Lines (used for PR and PO views)
  const filteredProcurementLines = useMemo(() => {
    let lines = procurementRows;

    // Search Query (debounced, case-insensitive per view mode specification)
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.trim().toLowerCase();
      if (viewMode === 'pr') {
        lines = lines.filter((r) => {
          const visRkap = getVisibleRkapCode(r);
          const visPrPo = getVisiblePrPoCode(r);
          const visDesc = getVisibleDescription(r);
          const visPr = getVisiblePrNumber(r);
          return (
            (visPr && visPr.toLowerCase().includes(q)) ||
            (r.projectCode && r.projectCode.toLowerCase().includes(q)) ||
            (visDesc && visDesc.toLowerCase().includes(q)) ||
            (visPrPo && visPrPo.toLowerCase().includes(q)) ||
            (visRkap && visRkap.toLowerCase().includes(q))
          );
        });
      } else if (viewMode === 'po') {
        lines = lines.filter((r) => {
          const visRkap = getVisibleRkapCode(r);
          const visPrPo = getVisiblePrPoCode(r);
          const visDesc = getVisibleDescription(r);
          const visPr = getVisiblePrNumber(r);
          const visPo = getVisiblePoNumber(r);
          return (
            (visPo && visPo.toLowerCase().includes(q)) ||
            (r.projectCode && r.projectCode.toLowerCase().includes(q)) ||
            (visPr && visPr.toLowerCase().includes(q)) ||
            (visDesc && visDesc.toLowerCase().includes(q)) ||
            (visPrPo && visPrPo.toLowerCase().includes(q)) ||
            (visRkap && visRkap.toLowerCase().includes(q))
          );
        });
      }
    }

    // Filters
    if (typeFilter !== 'All') {
      lines = lines.filter((r) => r.projectType === typeFilter);
    }
    if (bundlingFilter !== 'All') {
      lines = lines.filter((r) => r.projectBundling === bundlingFilter);
    }
    if (scheduleFilter !== 'All') {
      lines = lines.filter((r) => r.schedule === scheduleFilter);
    }
    if (tokFilter !== 'All') {
      lines = lines.filter((r) => r.tok === tokFilter);
    }
    if (prYearFilter !== 'All') {
      lines = lines.filter((r) => getYearFromDate(r.prDate) === prYearFilter);
    }
    if (poYearFilter !== 'All') {
      lines = lines.filter((r) => getYearFromDate(r.poDate) === poYearFilter);
    }
    if (relationshipTypeFilter !== 'All') {
      lines = lines.filter((r) => {
        const pRows = projectProcMap.get(r.projectKey) || [r];
        const status = getProjectRelationshipStatus(pRows);
        return status === relationshipTypeFilter;
      });
    }

    return lines;
  }, [
    procurementRows,
    debouncedSearchQuery,
    viewMode,
    typeFilter,
    bundlingFilter,
    scheduleFilter,
    tokFilter,
    prYearFilter,
    poYearFilter,
    relationshipTypeFilter,
    projectProcMap,
  ]);

  // Distinct Project Keys matching current filters & debounced search
  const matchingProjectKeys = useMemo(() => {
    if (viewMode === 'project') {
      return filteredProjects.map((p) => p.projectKey);
    }
    const setKeys = new Set<string>();
    filteredProcurementLines.forEach((r) => {
      if (r.projectKey) setKeys.add(r.projectKey);
    });
    return Array.from(setKeys);
  }, [viewMode, filteredProjects, filteredProcurementLines]);

  // Auto-selection Effect for all View Modes based on exact filter results
  useEffect(() => {
    if (viewMode === 'project') {
      if (matchingProjectKeys.length === 1) {
        // EXACTLY ONE Project Key: Auto-select it
        setSelectedProjectKey(matchingProjectKeys[0]);
      } else if (matchingProjectKeys.length > 1) {
        if (explicitProjectKey && matchingProjectKeys.includes(explicitProjectKey)) {
          setSelectedProjectKey(explicitProjectKey);
        } else {
          setSelectedProjectKey(null);
        }
      } else {
        setSelectedProjectKey(null);
      }
    } else if (viewMode === 'pr') {
      const availablePrs = Array.from(
        new Set(
          filteredProcurementLines
            .map((r) => (r.prNumber || '').trim())
            .filter((p) => p && p !== '—')
        )
      );
      if (availablePrs.length === 1) {
        setSelectedPrNumber(availablePrs[0]);
      } else if (availablePrs.length > 1) {
        if (explicitPrNumber && availablePrs.includes(explicitPrNumber)) {
          setSelectedPrNumber(explicitPrNumber);
        } else {
          setSelectedPrNumber(null);
        }
      } else {
        setSelectedPrNumber(null);
      }
    } else if (viewMode === 'po') {
      const availablePos = Array.from(
        new Set(
          filteredProcurementLines
            .map((r) => (r.poNumber || '').trim())
            .filter((p) => p && p !== '—')
        )
      );
      if (availablePos.length === 1) {
        setSelectedPoNumber(availablePos[0]);
      } else if (availablePos.length > 1) {
        if (explicitPoNumber && availablePos.includes(explicitPoNumber)) {
          setSelectedPoNumber(explicitPoNumber);
        } else {
          setSelectedPoNumber(null);
        }
      } else {
        setSelectedPoNumber(null);
      }
    }
  }, [
    viewMode,
    matchingProjectKeys,
    filteredProcurementLines,
    explicitProjectKey,
    explicitPrNumber,
    explicitPoNumber,
  ]);

  // Selected Context Data depending on View Mode
  const activeContextData = useMemo(() => {
    if (viewMode === 'project') {
      if (!selectedProjectKey) {
        return {
          key: null,
          projectCode: null,
          projectType: '—',
          projectBundling: '—',
          schedule: '—',
          tok: '—',
          subProject: '—',
          program: '—',
          tahunProgram: '—',
          numBudgetCodes: 0,
          numPr: 0,
          totalPrValue: 0,
          numPo: 0,
          totalPoValue: 0,
          rows: [],
        };
      }

      const rows = projectProcMap.get(selectedProjectKey) || [];
      const proj = projectDetailMap.get(selectedProjectKey);
      const firstRow = rows[0];

      const projectCode = proj?.projectCode || null;
      const projectType = proj?.projectType || '—';
      const projectBundling = proj?.projectBundling || '—';
      const schedule = proj?.schedule || '—';
      const tok = proj?.tok || '—';
      const subProject = proj?.subProject || '—';
      const program = proj?.program || '—';
      const tahunProgram = proj?.tahunProgram || '—';

      const budgetCodes = new Set(
        rows.map((r) => (getVisiblePrPoCode(r) || getVisibleRkapCode(r) || '').trim()).filter((c) => c && c !== '—')
      );
      const prs = new Set(
        rows.map((r) => (getVisiblePrNumber(r) || '').trim()).filter((p) => p && p !== '—')
      );
      const pos = new Set(
        rows.map((r) => (getVisiblePoNumber(r) || '').trim()).filter((p) => p && p !== '—')
      );

      const prGroupKeys = new Set<string>();
      rows.forEach((r) => { if (r.prValueGroupKey) prGroupKeys.add(r.prValueGroupKey); });
      let totalPrValue = 0;
      if (prGroupKeys.size > 0) {
        prGroupKeys.forEach((gk) => {
          const vg = procurementValueGroupByKeyMap.get(gk);
          if (vg) totalPrValue += vg.groupRawValue || 0;
        });
      } else {
        totalPrValue = rows.reduce((acc, r) => acc + (getVisiblePrLineValue(r) || 0), 0);
      }

      const poGroupKeys = new Set<string>();
      rows.forEach((r) => { if (r.poValueGroupKey) poGroupKeys.add(r.poValueGroupKey); });
      let totalPoValue = 0;
      if (poGroupKeys.size > 0) {
        poGroupKeys.forEach((gk) => {
          const vg = procurementValueGroupByKeyMap.get(gk);
          if (vg) totalPoValue += vg.groupRawValue || 0;
        });
      } else {
        totalPoValue = rows.reduce((acc, r) => acc + (getVisiblePoLineValue(r) || 0), 0);
      }

      return {
        key: selectedProjectKey,
        projectCode,
        projectType,
        projectBundling,
        schedule,
        tok,
        subProject,
        program,
        tahunProgram,
        numBudgetCodes: budgetCodes.size,
        numPr: prs.size,
        totalPrValue,
        numPo: pos.size,
        totalPoValue,
        rows,
      };
    } else if (viewMode === 'pr') {
      if (!selectedPrNumber) {
        return {
          key: null,
          prNumber: null,
          prDate: '—',
          projectCode: null,
          subProject: '—',
          program: '—',
          rkapBudgetCode: '—',
          prPoBudgetCode: '—',
          description: '—',
          numBudgetCodes: 0,
          numPr: 0,
          totalPrValue: 0,
          numPo: 0,
          totalPoValue: 0,
          linkedPos: [],
          rows: [],
        };
      }

      const rows = procurementRows.filter(
        (r) => (r.prNumber || '').trim() === selectedPrNumber
      );
      const firstRow = rows[0];

      const prDate = formatDate(firstRow?.prDate);
      const projectCode = firstRow?.projectCode || 'No Project Code';
      const subProject = firstRow?.subProject || '—';
      const program = firstRow?.program || '—';
      const rkapBudgetCode = getVisibleRkapCode(firstRow) || '—';
      const prPoBudgetCode = firstRow?.kodeBudgetPrPo || '—';
      const description = firstRow?.description || '—';

      const budgetCodes = new Set(
        rows.map((r) => (r.kodeBudgetPrPo || '').trim()).filter((c) => c && c !== '—')
      );
      const pos = new Set(
        rows.map((r) => (r.poNumber || '').trim()).filter((p) => p && p !== '—')
      );

      const totalPrValue = rows.reduce((acc, r) => acc + (r.prLineValue || 0), 0);
      const totalPoValue = rows.reduce((acc, r) => acc + (r.poLineValue || 0), 0);

      return {
        key: selectedPrNumber,
        prNumber: selectedPrNumber,
        prDate,
        projectCode,
        subProject,
        program,
        rkapBudgetCode,
        prPoBudgetCode,
        description,
        numBudgetCodes: budgetCodes.size,
        numPr: 1,
        totalPrValue,
        numPo: pos.size,
        totalPoValue,
        linkedPos: Array.from(pos),
        rows,
      };
    } else {
      if (!selectedPoNumber) {
        return {
          key: null,
          poNumber: null,
          poDate: '—',
          projectCode: null,
          subProject: '—',
          program: '—',
          rkapBudgetCode: '—',
          prPoBudgetCode: '—',
          description: '—',
          numBudgetCodes: 0,
          numPr: 0,
          totalPrValue: 0,
          numPo: 0,
          totalPoValue: 0,
          relatedPrs: [],
          rows: [],
        };
      }

      const rows = procurementRows.filter(
        (r) => (r.poNumber || '').trim() === selectedPoNumber
      );
      const firstRow = rows[0];

      const poDate = formatDate(firstRow?.poDate);
      const projectCode = firstRow?.projectCode || 'No Project Code';
      const subProject = firstRow?.subProject || '—';
      const program = firstRow?.program || '—';
      const rkapBudgetCode = getVisibleRkapCode(firstRow) || '—';
      const prPoBudgetCode = firstRow?.kodeBudgetPrPo || '—';
      const description = firstRow?.description || '—';

      const budgetCodes = new Set(
        rows.map((r) => (r.kodeBudgetPrPo || '').trim()).filter((c) => c && c !== '—')
      );
      const prs = new Set(
        rows.map((r) => (r.prNumber || '').trim()).filter((p) => p && p !== '—')
      );

      const totalPrValue = rows.reduce((acc, r) => acc + (r.prLineValue || 0), 0);
      const totalPoValue = rows.reduce((acc, r) => acc + (r.poLineValue || 0), 0);

      return {
        key: selectedPoNumber,
        poNumber: selectedPoNumber,
        poDate,
        projectCode,
        subProject,
        program,
        rkapBudgetCode,
        prPoBudgetCode,
        description,
        numBudgetCodes: budgetCodes.size,
        numPr: prs.size,
        totalPrValue,
        numPo: 1,
        totalPoValue,
        relatedPrs: Array.from(prs),
        rows,
      };
    }
  }, [
    viewMode,
    selectedProjectKey,
    selectedPrNumber,
    selectedPoNumber,
    procurementRows,
    projectProcMap,
    projectDetailMap,
  ]);

  // Complexity Table Grouping (grouped by projectKey)
  const complexityProjects = useMemo(() => {
    if (viewMode !== 'project') return [];

    return filteredProjects.map((proj) => {
      const pKey = proj.projectKey;
      const rows = projectProcMap.get(pKey) || [];

      const projectCode = proj.projectCode || null;
      const subProject = proj.subProject || '—';
      const program = proj.program || '—';
      const projectBundling = proj.projectBundling || '—';

      if (rows.length === 0) {
        return {
          projectKey: pKey,
          projectCode,
          subProject,
          program,
          projectBundling,
          numRkap: 0,
          numPrPoCodes: 0,
          numPr: 0,
          numPo: 0,
          prMultiPo: '—',
          multiPrPo: '—',
          status: 'NO PROCUREMENT RECORD',
          sampleRow: null,
        };
      }

      const rkapCodes = new Set(
        rows.map((r) => (getVisibleRkapCode(r) || '').trim()).filter((c) => c && c !== '—')
      );
      const prPoCodes = new Set(
        rows.map((r) => (getVisiblePrPoCode(r) || '').trim()).filter((c) => c && c !== '—')
      );

      const prToPos = new Map<string, Set<string>>();
      const poToPrs = new Map<string, Set<string>>();

      rows.forEach((r) => {
        const pr = (getVisiblePrNumber(r) || '').trim();
        const po = (getVisiblePoNumber(r) || '').trim();
        if (pr && pr !== '—') {
          if (!prToPos.has(pr)) prToPos.set(pr, new Set());
          if (po && po !== '—') prToPos.get(pr)?.add(po);
        }
        if (po && po !== '—') {
          if (!poToPrs.has(po)) poToPrs.set(po, new Set());
          if (pr && pr !== '—') poToPrs.get(po)?.add(pr);
        }
      });

      let prMultiPo = false;
      prToPos.forEach((poSet) => {
        if (poSet.size > 1) prMultiPo = true;
      });

      let multiPrPo = false;
      poToPrs.forEach((prSet) => {
        if (prSet.size > 1) multiPrPo = true;
      });

      const status = getProjectRelationshipStatus(rows);

      return {
        projectKey: pKey,
        projectCode,
        subProject,
        program,
        projectBundling,
        numRkap: rkapCodes.size,
        numPrPoCodes: prPoCodes.size,
        numPr: prToPos.size,
        numPo: poToPrs.size,
        prMultiPo: prMultiPo ? 'Yes' : '—',
        multiPrPo: multiPrPo ? 'Yes' : '—',
        status,
        sampleRow: rows[0],
      };
    });
  }, [viewMode, filteredProjects, projectProcMap]);

  // Available PR list for By PR selector table
  const availablePrList = useMemo(() => {
    const prMap = new Map<
      string,
      {
        prNumber: string;
        prDate: string;
        projectCode: string;
        subProject: string;
        program: string;
        budgetCode: string;
        totalValue: number;
        linkedPos: Set<string>;
      }
    >();

    filteredProcurementLines.forEach((r) => {
      const pr = (r.prNumber || '').trim();
      if (pr && pr !== '—') {
        if (!prMap.has(pr)) {
          prMap.set(pr, {
            prNumber: pr,
            prDate: r.prDate || '',
            projectCode: r.projectCode || 'No Project Code',
            subProject: r.subProject || '—',
            program: r.program || '—',
            budgetCode: r.kodeBudgetPrPo || '—',
            totalValue: 0,
            linkedPos: new Set(),
          });
        }
        const item = prMap.get(pr)!;
        item.totalValue += r.prLineValue || 0;
        const po = (r.poNumber || '').trim();
        if (po && po !== '—') item.linkedPos.add(po);
      }
    });

    return Array.from(prMap.values());
  }, [filteredProcurementLines]);

  // Available PO list for By PO selector table
  const availablePoList = useMemo(() => {
    const poMap = new Map<
      string,
      {
        poNumber: string;
        poDate: string;
        projectCode: string;
        subProject: string;
        program: string;
        budgetCode: string;
        totalValue: number;
        relatedPrs: Set<string>;
      }
    >();

    filteredProcurementLines.forEach((r) => {
      const po = (r.poNumber || '').trim();
      if (po && po !== '—') {
        if (!poMap.has(po)) {
          poMap.set(po, {
            poNumber: po,
            poDate: r.poDate || '',
            projectCode: r.projectCode || 'No Project Code',
            subProject: r.subProject || '—',
            program: r.program || '—',
            budgetCode: r.kodeBudgetPrPo || '—',
            totalValue: 0,
            relatedPrs: new Set(),
          });
        }
        const item = poMap.get(po)!;
        item.totalValue += r.poLineValue || 0;
        const pr = (r.prNumber || '').trim();
        if (pr && pr !== '—') item.relatedPrs.add(pr);
      }
    });

    return Array.from(poMap.values());
  }, [filteredProcurementLines]);

  // Lines for Procurement Detail Table based on selection
  const activeDetailLines = useMemo(() => {
    if (viewMode === 'project') {
      if (!selectedProjectKey) return [];
      return activeContextData.rows || [];
    } else if (viewMode === 'pr') {
      if (!selectedPrNumber) return [];
      return activeContextData.rows || [];
    } else {
      if (!selectedPoNumber) return [];
      return activeContextData.rows || [];
    }
  }, [viewMode, selectedProjectKey, selectedPrNumber, selectedPoNumber, activeContextData.rows]);

  // Detail Table Pagination
  const totalDetailLines = activeDetailLines.length;
  const totalPages = Math.ceil(totalDetailLines / pageSize) || 1;

  const paginatedDetailLines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeDetailLines.slice(start, start + pageSize);
  }, [activeDetailLines, currentPage, pageSize]);

  // Handlers for project selection
  const handleSelectProjectContext = (pKey: string) => {
    setSelectedProjectKey(pKey);
    setExplicitProjectKey(pKey);
    setSelectedRelNode(null);
    setViewMode('project');
  };

  const handleSelectPr = (prNum: string) => {
    setSelectedPrNumber(prNum);
    setExplicitPrNumber(prNum);
    setSelectedRelNode(null);
  };

  const handleSelectPo = (poNum: string) => {
    setSelectedPoNumber(poNum);
    setExplicitPoNumber(poNum);
    setSelectedRelNode(null);
  };

  const handleDrillToProjectDetail = (pKey: string) => {
    const proj = projectDetailMap.get(pKey);
    const rows = projectProcMap.get(pKey) || [];
    const firstRow = rows[0];
    const totalPrValue = rows.reduce((sum, r) => sum + (r.prLineValue || 0), 0);
    const totalPoValue = rows.reduce((sum, r) => sum + (r.poLineValue || 0), 0);

    const projectItem: ProjectItem = {
      id: pKey,
      projectKey: pKey,
      projectCode: proj?.projectCode || '',
      projectType: proj?.projectType || 'Greenfield',
      projectBundling: proj?.projectBundling || '—',
      schedule: proj?.schedule || 'Master Schedule',
      tok: proj?.tok || '—',
      subProject: proj?.subProject || '—',
      program: proj?.program || '—',
      tahunProgram: proj?.tahunProgram || '—',
      kategori: proj?.kategori || '—',
      lokasi: proj?.lokasi || '—',
      capexBase: '—',
      capexInflated: '—',
      rab: '—',
      rkap: '—',
      ob: '—',
      pr: formatRupiahCompactId(totalPrValue),
      po: formatRupiahCompactId(totalPoValue),
      vowd: '—',
      rna: '—',
      numBudgetCodes: new Set(rows.map((r) => getVisiblePrPoCode(r) || getVisibleRkapCode(r)).filter(Boolean)).size,
      numPr: new Set(rows.map((r) => getVisiblePrNumber(r)).filter((p) => p && p !== '—')).size,
      latestPrDate: formatDate(rows[0]?.prDate),
      numPo: new Set(rows.map((r) => getVisiblePoNumber(r)).filter((p) => p && p !== '—')).size,
      latestPoDate: formatDate(rows[0]?.poDate),
      prValue: formatRupiahCompactId(totalPrValue),
      poValue: formatRupiahCompactId(totalPoValue),
    };

    if (onSelectProject) {
      onSelectProject(projectItem);
    }
    onNavigate('project-detail');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setTypeFilter('All');
    setBundlingFilter('All');
    setScheduleFilter('All');
    setTokFilter('All');
    setPrYearFilter('All');
    setPoYearFilter('All');
    setRelationshipTypeFilter('All');
    setSelectedRelNode(null);
    setSelectedProjectKey(null);
    setExplicitProjectKey(null);
    setSelectedPrNumber(null);
    setExplicitPrNumber(null);
    setSelectedPoNumber(null);
    setExplicitPoNumber(null);
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case '1 PR → 1 PO':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceebd6] inline-block">
            1 PR → 1 PO
          </span>
        );
      case 'PR Without PO':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fef7e0] text-[#b06000] border border-[#feefc3] inline-block">
            PR Without PO
          </span>
        );
      case 'PR → Multiple PO':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] inline-block">
            PR → Multiple PO
          </span>
        );
      case 'Multiple PR → PO':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f3e8fd] text-[#8e24aa] border border-[#e9d2fd] inline-block">
            Multiple PR → PO
          </span>
        );
      case 'Complex Relationship':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf] inline-block">
            Complex Relationship
          </span>
        );
      case 'NO PR / PO':
      case 'No Procurement':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fef3c7] text-[#92400e] border border-[#fde68a] inline-block">
            NO PR / PO
          </span>
        );
      case 'NO PROCUREMENT RECORD':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1] inline-block">
            NO PROCUREMENT RECORD
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e8f0fe] text-[#1967d2] border border-[#c6dafc] inline-block">
            {status}
          </span>
        );
    }
  };

  // Flow Data Calculations
  const projectRowsForFlow = useMemo(() => {
    return activeContextData.rows || [];
  }, [activeContextData.rows]);

  const flowBudgets = useMemo(() => {
    const bMap = new Map<string, { code: string; desc: string; count: number }>();
    projectRowsForFlow.forEach((r) => {
      const c = (r.kodeBudgetPrPo || '').trim();
      if (c && c !== '—') {
        if (!bMap.has(c)) {
          bMap.set(c, {
            code: c,
            desc: r.description || r.program || 'Budget Line Allocation',
            count: 0,
          });
        }
        bMap.get(c)!.count++;
      }
    });
    return Array.from(bMap.values());
  }, [projectRowsForFlow]);

  const flowPrItems = useMemo(() => {
    const prMap = new Map<
      string,
      {
        prNumber: string;
        prDate: string;
        totalValue: number;
        linkedPos: Set<string>;
        budgetCodes: Set<string>;
      }
    >();

    projectRowsForFlow.forEach((r) => {
      const pr = (r.prNumber || '').trim();
      if (pr && pr !== '—') {
        if (!prMap.has(pr)) {
          prMap.set(pr, {
            prNumber: pr,
            prDate: r.prDate || '',
            totalValue: 0,
            linkedPos: new Set(),
            budgetCodes: new Set(),
          });
        }
        const item = prMap.get(pr)!;
        item.totalValue += r.prLineValue || 0;
        const po = (r.poNumber || '').trim();
        if (po && po !== '—') item.linkedPos.add(po);
        const code = (r.kodeBudgetPrPo || '').trim();
        if (code && code !== '—') item.budgetCodes.add(code);
      }
    });

    return Array.from(prMap.values());
  }, [projectRowsForFlow]);

  const flowPoItems = useMemo(() => {
    const poMap = new Map<
      string,
      {
        poNumber: string;
        poDate: string;
        totalValue: number;
        linkedPrs: Set<string>;
        budgetCodes: Set<string>;
      }
    >();

    projectRowsForFlow.forEach((r) => {
      const po = (r.poNumber || '').trim();
      if (po && po !== '—') {
        if (!poMap.has(po)) {
          poMap.set(po, {
            poNumber: po,
            poDate: r.poDate || '',
            totalValue: 0,
            linkedPrs: new Set(),
            budgetCodes: new Set(),
          });
        }
        const item = poMap.get(po)!;
        item.totalValue += r.poLineValue || 0;
        const pr = (r.prNumber || '').trim();
        if (pr && pr !== '—') item.linkedPrs.add(pr);
        const code = (r.kodeBudgetPrPo || '').trim();
        if (code && code !== '—') item.budgetCodes.add(code);
      }
    });

    return Array.from(poMap.values());
  }, [projectRowsForFlow]);

  const flowPrsWithoutPo = useMemo(() => {
    return flowPrItems.filter((p) => p.linkedPos.size === 0);
  }, [flowPrItems]);

  const visibleBudgets = useMemo(() => {
    if (!selectedRelNode) return flowBudgets;
    if (selectedRelNode.type === 'budgetCode') {
      return flowBudgets.filter((b) => b.code === selectedRelNode.value);
    }
    if (selectedRelNode.type === 'pr') {
      const prItem = flowPrItems.find((p) => p.prNumber === selectedRelNode.value);
      if (!prItem) return flowBudgets;
      return flowBudgets.filter((b) => prItem.budgetCodes.has(b.code));
    }
    if (selectedRelNode.type === 'po') {
      const poItem = flowPoItems.find((p) => p.poNumber === selectedRelNode.value);
      if (!poItem) return flowBudgets;
      return flowBudgets.filter((b) => poItem.budgetCodes.has(b.code));
    }
    return flowBudgets;
  }, [selectedRelNode, flowBudgets, flowPrItems, flowPoItems]);

  const visiblePrItems = useMemo(() => {
    if (!selectedRelNode) return flowPrItems;
    if (selectedRelNode.type === 'pr') {
      return flowPrItems;
    }
    if (selectedRelNode.type === 'po') {
      return flowPrItems.filter((p) => p.linkedPos.has(selectedRelNode.value));
    }
    if (selectedRelNode.type === 'budgetCode') {
      return flowPrItems.filter((p) => p.budgetCodes.has(selectedRelNode.value));
    }
    return flowPrItems;
  }, [selectedRelNode, flowPrItems]);

  const visiblePoItems = useMemo(() => {
    if (!selectedRelNode) return flowPoItems;
    if (selectedRelNode.type === 'po') {
      return flowPoItems;
    }
    if (selectedRelNode.type === 'pr') {
      const prItem = flowPrItems.find((p) => p.prNumber === selectedRelNode.value);
      if (!prItem) return flowPoItems;
      return flowPoItems.filter((p) => prItem.linkedPos.has(p.poNumber));
    }
    if (selectedRelNode.type === 'budgetCode') {
      return flowPoItems.filter((p) => p.budgetCodes.has(selectedRelNode.value));
    }
    return flowPoItems;
  }, [selectedRelNode, flowPoItems, flowPrItems]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#565e74]">
        <div className="w-8 h-8 border-3 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] font-medium">Loading Procurement Explorer dataset...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#fce8e6] border border-[#fad2cf] p-4 rounded-lg text-[#c5221f] text-[13px] flex items-center justify-between">
        <span>Error loading procurement data: {error}</span>
        <button
          onClick={() => refreshData(true)}
          className="px-3 py-1 bg-white border border-[#fad2cf] rounded text-[12px] font-medium hover:bg-[#f8d7da] cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: 'PR/PO BUDGET CODES',
      value: globalKpis.distinctPrPoCodes.toLocaleString('id-ID'),
      highlight: true,
    },
    {
      label: 'UNIQUE PR',
      value: globalKpis.uniquePr.toLocaleString('id-ID'),
      highlight: true,
    },
    {
      label: 'UNIQUE PO',
      value: globalKpis.uniquePo.toLocaleString('id-ID'),
      highlight: true,
    },
    {
      label: 'PR WITHOUT PO',
      value: globalKpis.prWithoutPo.toLocaleString('id-ID'),
      highlight: false,
    },
    {
      label: 'PR → MULTIPLE PO',
      value: globalKpis.prMultiPo.toLocaleString('id-ID'),
      highlight: false,
    },
    {
      label: 'MULTIPLE PR → PO',
      value: globalKpis.multiPrPo.toLocaleString('id-ID'),
      highlight: false,
    },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto w-full">
      {/* 1. SECTION: Page Header / KPI Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 pb-1 border-b border-[#dde3eb]">
        <div>
          <h2 className="text-xl font-bold text-[#161c22]">Procurement Explorer</h2>
          <p className="text-[13px] text-[#5c647a]">
            Budget Code, PR, and PO relationship investigation
          </p>
        </div>
        <div className="text-[12px] text-[#434655] bg-white px-3 py-1.5 rounded border border-[#c3c6d7] shadow-2xs">
          Reporting Cut-Off: <strong className="text-[#161c22]">28 Jun 2026</strong> | Last Refresh:{' '}
          <strong className="text-[#161c22]">{lastRefreshed || 'Just now'}</strong>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, idx) => (
          <div
            key={idx}
            className={`bg-white border border-[#c3c6d7] rounded-lg p-3 shadow-2xs ${
              k.highlight ? 'border-l-4 border-l-[#004ac6]' : 'border-l-4 border-l-[#565e74]'
            }`}
          >
            <div className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider mb-1 truncate">
              {k.label}
            </div>
            <div className="text-[18px] font-bold text-[#161c22] font-mono tracking-tight">
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* 2. SECTION: View Mode + Search + Filters */}
      <div className="bg-white border border-[#c3c6d7] rounded-lg p-3.5 shadow-2xs flex flex-col gap-3">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-[#161c22]">View Mode:</span>
            <div className="flex bg-[#e3e9f1] rounded p-0.5 border border-[#c3c6d7]">
              <button
                onClick={() => handleViewModeChange('project')}
                className={`px-3 py-1 text-[12px] font-medium rounded transition-colors ${
                  viewMode === 'project'
                    ? 'bg-white text-[#004ac6] font-bold shadow-2xs'
                    : 'text-[#434655] hover:text-[#161c22]'
                }`}
              >
                By Project
              </button>
              <button
                onClick={() => handleViewModeChange('pr')}
                className={`px-3 py-1 text-[12px] font-medium rounded transition-colors ${
                  viewMode === 'pr'
                    ? 'bg-white text-[#004ac6] font-bold shadow-2xs'
                    : 'text-[#434655] hover:text-[#161c22]'
                }`}
              >
                By PR
              </button>
              <button
                onClick={() => handleViewModeChange('po')}
                className={`px-3 py-1 text-[12px] font-medium rounded transition-colors ${
                  viewMode === 'po'
                    ? 'bg-white text-[#004ac6] font-bold shadow-2xs'
                    : 'text-[#434655] hover:text-[#161c22]'
                }`}
              >
                By PO
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-[420px]">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-[#737686]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                viewMode === 'project'
                  ? 'Search Project Code, Sub Project, Program...'
                  : viewMode === 'pr'
                  ? 'Search PR Number...'
                  : 'Search PO Number...'
              }
              className="w-full pl-9 pr-8 py-1.5 bg-[#f6f9ff] border border-[#c3c6d7] rounded text-[13px] text-[#161c22] focus:outline-none focus:border-[#004ac6]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#737686] hover:text-[#161c22] text-[12px]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Compact Filters Bar */}
        <div className="pt-2 border-t border-[#e2e8f0] flex flex-wrap items-center gap-2 text-[12px]">
          <div className="flex items-center gap-1 text-[#565e74] font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#f8fafc] border border-[#cbd5e1] rounded px-2 py-1 text-[#161c22] focus:outline-none focus:border-[#004ac6]"
          >
            <option value="All">Type: All</option>
            <option value="Greenfield">Greenfield</option>
            <option value="Brownfield">Brownfield</option>
          </select>

          <select
            value={bundlingFilter}
            onChange={(e) => setBundlingFilter(e.target.value)}
            className="bg-[#f8fafc] border border-[#cbd5e1] rounded px-2 py-1 text-[#161c22] max-w-[180px] truncate focus:outline-none focus:border-[#004ac6]"
          >
            <option value="All">Bundling: All</option>
            {filterOptions.bundlings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value)}
            className="bg-[#f8fafc] border border-[#cbd5e1] rounded px-2 py-1 text-[#161c22] focus:outline-none focus:border-[#004ac6]"
          >
            <option value="All">Schedule: All</option>
            {filterOptions.schedules.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={tokFilter}
            onChange={(e) => setTokFilter(e.target.value)}
            className="bg-[#f8fafc] border border-[#cbd5e1] rounded px-2 py-1 text-[#161c22] focus:outline-none focus:border-[#004ac6]"
          >
            <option value="All">TOK: All</option>
            {filterOptions.toks.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={prYearFilter}
            onChange={(e) => setPrYearFilter(e.target.value)}
            className="bg-[#f8fafc] border border-[#cbd5e1] rounded px-2 py-1 text-[#161c22] focus:outline-none focus:border-[#004ac6]"
          >
            <option value="All">PR Year: All</option>
            {filterOptions.prYears.map((y) => (
              <option key={y} value={y}>
                PR {y}
              </option>
            ))}
          </select>

          <select
            value={poYearFilter}
            onChange={(e) => setPoYearFilter(e.target.value)}
            className="bg-[#f8fafc] border border-[#cbd5e1] rounded px-2 py-1 text-[#161c22] focus:outline-none focus:border-[#004ac6]"
          >
            <option value="All">PO Year: All</option>
            {filterOptions.poYears.map((y) => (
              <option key={y} value={y}>
                PO {y}
              </option>
            ))}
          </select>

          <select
            value={relationshipTypeFilter}
            onChange={(e) => setRelationshipTypeFilter(e.target.value)}
            className="bg-[#f8fafc] border border-[#cbd5e1] rounded px-2 py-1 text-[#161c22] focus:outline-none focus:border-[#004ac6]"
          >
            <option value="All">Rel Type: All</option>
            <option value="1 PR → 1 PO">1 PR → 1 PO</option>
            <option value="PR Without PO">PR Without PO</option>
            <option value="PR → Multiple PO">PR → Multiple PO</option>
            <option value="Multiple PR → PO">Multiple PR → PO</option>
            <option value="Complex Relationship">Complex Relationship</option>
            <option value="NO PR / PO">NO PR / PO</option>
            <option value="NO PROCUREMENT RECORD">NO PROCUREMENT RECORD</option>
          </select>

          {(searchQuery ||
            typeFilter !== 'All' ||
            bundlingFilter !== 'All' ||
            scheduleFilter !== 'All' ||
            tokFilter !== 'All' ||
            prYearFilter !== 'All' ||
            poYearFilter !== 'All' ||
            relationshipTypeFilter !== 'All') && (
            <button
              onClick={handleResetFilters}
              className="ml-auto text-[11px] text-[#004ac6] hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. SECTION: Procurement Complexity by Project / Entity Selector */}
      {viewMode === 'project' && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-[#c3c6d7] bg-[#f8fafc] flex justify-between items-center">
            <h4 className="text-[13px] font-bold text-[#161c22]">
              Procurement Complexity by Project ({complexityProjects.length} Projects)
            </h4>
            <span className="text-[11px] text-[#5c647a]">
              Select a project row below to investigate details
            </span>
          </div>
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead className="bg-[#f1f5f9] text-[#565e74] font-bold text-[11px] uppercase tracking-wider sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">Project Code</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">Sub Project</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">Program</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">Project Bundling</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-right">
                    # PR/PO Budget Codes
                  </th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-right"># PR</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-right"># PO</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-center">Status</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde3eb]">
                {complexityProjects.map((cp) => {
                  const isSelected = cp.projectKey === selectedProjectKey;
                  return (
                    <tr
                      key={cp.projectKey}
                      onClick={() => handleSelectProjectContext(cp.projectKey)}
                      className={`cursor-pointer transition-colors h-[38px] ${
                        isSelected
                          ? 'bg-[#eef4fc] font-medium border-l-4 border-l-[#004ac6]'
                          : 'hover:bg-[#f6f9ff]'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono font-bold text-[#004ac6]">
                        {cp.projectCode || 'No Project Code'}
                      </td>
                      <td className="py-2 px-3 text-[#161c22] font-medium">{cp.subProject}</td>
                      <td className="py-2 px-3 text-[#161c22]">{cp.program}</td>
                      <td className="py-2 px-3 text-[#5c647a]">{cp.projectBundling}</td>
                      <td className="py-2 px-3 text-right font-mono">{cp.numPrPoCodes}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">{cp.numPr}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">{cp.numPo}</td>
                      <td className="py-2 px-3 text-center">{renderStatusBadge(cp.status)}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProjectContext(cp.projectKey);
                          }}
                          className={`text-[12px] font-semibold px-2.5 py-1 rounded transition-colors ${
                            isSelected
                              ? 'bg-[#004ac6] text-white'
                              : 'text-[#004ac6] hover:bg-[#e8f0fe]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Investigate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {complexityProjects.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#737686] text-[13px]">
                      No projects found matching your search and filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'pr' && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-[#c3c6d7] bg-[#f8fafc] flex justify-between items-center">
            <h4 className="text-[13px] font-bold text-[#161c22]">
              Available Requisitions ({availablePrList.length} PRs)
            </h4>
            <span className="text-[11px] text-[#5c647a]">
              Select a PR row below to investigate details
            </span>
          </div>
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead className="bg-[#f1f5f9] text-[#565e74] font-bold text-[11px] uppercase tracking-wider sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] w-[170px] min-w-[170px]">PR Number</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">PR Date</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">Project Code</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">Sub Project</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">Program</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">PR/PO Budget Code</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-right">Total PR Value</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde3eb]">
                {availablePrList.map((pr) => {
                  const isSelected = pr.prNumber === selectedPrNumber;
                  return (
                    <tr
                      key={pr.prNumber}
                      onClick={() => handleSelectPr(pr.prNumber)}
                      className={`cursor-pointer transition-colors h-[38px] ${
                        isSelected
                          ? 'bg-[#eef4fc] font-medium border-l-4 border-l-[#004ac6]'
                          : 'hover:bg-[#f6f9ff]'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono font-bold text-[#004ac6] w-[170px] min-w-[170px]">
                        {pr.prNumber}
                      </td>
                      <td className="py-2 px-3 text-[#5c647a]">{formatDate(pr.prDate)}</td>
                      <td className="py-2 px-3 font-mono text-[#161c22]">{pr.projectCode}</td>
                      <td className="py-2 px-3 text-[#161c22]">{pr.subProject}</td>
                      <td className="py-2 px-3 text-[#161c22]">{pr.program}</td>
                      <td className="py-2 px-3 font-mono text-[#161c22]">{pr.budgetCode}</td>
                      <td
                        className="py-2 px-3 text-right font-mono font-semibold text-[#161c22]"
                        title={formatRupiahFull(pr.totalValue)}
                      >
                        {formatRupiahCompactId(pr.totalValue)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPr(pr.prNumber);
                          }}
                          className={`text-[12px] font-semibold px-2.5 py-1 rounded transition-colors ${
                            isSelected
                              ? 'bg-[#004ac6] text-white'
                              : 'text-[#004ac6] hover:bg-[#e8f0fe]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Investigate PR'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {availablePrList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#737686] text-[13px]">
                      No PRs found matching your search and filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'po' && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-[#c3c6d7] bg-[#f8fafc] flex justify-between items-center">
            <h4 className="text-[13px] font-bold text-[#161c22]">
              Available Orders ({availablePoList.length} POs)
            </h4>
            <span className="text-[11px] text-[#5c647a]">
              Select a PO row below to investigate details
            </span>
          </div>
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead className="bg-[#f1f5f9] text-[#565e74] font-bold text-[11px] uppercase tracking-wider sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] w-[170px] min-w-[170px]">PO Number</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">PO Date</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">Project Code</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">Sub Project</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">Program</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">PR/PO Budget Code</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-right">Total PO Value</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde3eb]">
                {availablePoList.map((po) => {
                  const isSelected = po.poNumber === selectedPoNumber;
                  return (
                    <tr
                      key={po.poNumber}
                      onClick={() => handleSelectPo(po.poNumber)}
                      className={`cursor-pointer transition-colors h-[38px] ${
                        isSelected
                          ? 'bg-[#eef4fc] font-medium border-l-4 border-l-[#004ac6]'
                          : 'hover:bg-[#f6f9ff]'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono font-bold text-[#004ac6] w-[170px] min-w-[170px]">
                        {po.poNumber}
                      </td>
                      <td className="py-2 px-3 text-[#5c647a]">{formatDate(po.poDate)}</td>
                      <td className="py-2 px-3 font-mono text-[#161c22]">{po.projectCode}</td>
                      <td className="py-2 px-3 text-[#161c22]">{po.subProject}</td>
                      <td className="py-2 px-3 text-[#161c22]">{po.program}</td>
                      <td className="py-2 px-3 font-mono text-[#161c22]">{po.budgetCode}</td>
                      <td
                        className="py-2 px-3 text-right font-mono font-semibold text-[#161c22]"
                        title={formatRupiahFull(po.totalValue)}
                      >
                        {formatRupiahCompactId(po.totalValue)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPo(po.poNumber);
                          }}
                          className={`text-[12px] font-semibold px-2.5 py-1 rounded transition-colors ${
                            isSelected
                              ? 'bg-[#004ac6] text-white'
                              : 'text-[#004ac6] hover:bg-[#e8f0fe]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Investigate PO'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {availablePoList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#737686] text-[13px]">
                      No POs found matching your search and filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DOWNSTREAM SECTIONS: Context, Summary, Relationship Flow, Detail Table */}

      {/* When in By Project Mode and No Project Selected */}
      {viewMode === 'project' && selectedProjectKey === null && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-8 shadow-2xs text-center flex flex-col items-center justify-center gap-2 text-[#565e74]">
          <Building2 className="w-8 h-8 text-[#004ac6] opacity-60" />
          <p className="text-[14px] font-semibold text-[#161c22]">
            Select a project above to view procurement details.
          </p>
          <p className="text-[12px] text-[#5c647a]">
            Choose a project from the Procurement Complexity table above to inspect project
            context, budget allocations, relationship flow, and procurement line items.
          </p>
        </div>
      )}

      {/* When in By PR Mode and No PR Selected */}
      {viewMode === 'pr' && selectedPrNumber === null && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-8 shadow-2xs text-center flex flex-col items-center justify-center gap-2 text-[#565e74]">
          <FileText className="w-8 h-8 text-[#004ac6] opacity-60" />
          <p className="text-[14px] font-semibold text-[#161c22]">
            Select a PR to investigate its project, budget code, and linked PO relationships.
          </p>
          <p className="text-[12px] text-[#5c647a]">
            Choose a requisition from the list above to view context, summary figures, and line item breakdowns.
          </p>
        </div>
      )}

      {/* When in By PO Mode and No PO Selected */}
      {viewMode === 'po' && selectedPoNumber === null && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-8 shadow-2xs text-center flex flex-col items-center justify-center gap-2 text-[#565e74]">
          <Receipt className="w-8 h-8 text-[#004ac6] opacity-60" />
          <p className="text-[14px] font-semibold text-[#161c22]">
            Select a PO to investigate its project, budget code, and related PR relationships.
          </p>
          <p className="text-[12px] text-[#5c647a]">
            Choose an order from the list above to view context, summary figures, and line item breakdowns.
          </p>
        </div>
      )}

      {/* RENDER DOWNSTREAM DETAILS IF ENTITY IS SELECTED */}

      {/* 4. SECTION: Selected Context Bar */}
      {viewMode === 'project' && selectedProjectKey !== null && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-3.5 shadow-2xs flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
          <div>
            <span className="text-[#565e74]">Project Code:</span>{' '}
            <strong className="font-mono text-[#004ac6]">
              {activeContextData.projectCode || 'No Project Code'}
            </strong>
          </div>
          <div>
            <span className="text-[#565e74]">Type:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.projectType}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Bundling:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.projectBundling}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Schedule:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.schedule}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">TOK:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.tok}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Sub Project:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.subProject}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Program:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.program}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Tahun Program:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.tahunProgram}</strong>
          </div>
          {activeContextData.projectCode && (
            <button
              onClick={() => handleDrillToProjectDetail(selectedProjectKey)}
              className="ml-auto text-[12px] bg-[#004ac6] text-white px-2.5 py-1 rounded hover:bg-[#003ea8] transition-colors flex items-center gap-1 font-medium"
            >
              <span>View Project Detail</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {viewMode === 'pr' && selectedPrNumber !== null && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-3.5 shadow-2xs flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
          <div>
            <span className="text-[#565e74]">PR Number:</span>{' '}
            <strong className="font-mono text-[#004ac6]">
              {activeContextData.prNumber || 'None'}
            </strong>
          </div>
          <div>
            <span className="text-[#565e74]">PR Date:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.prDate}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Total PR Value:</span>{' '}
            <strong className="font-mono text-[#161c22]" title={formatRupiahFull(activeContextData.totalPrValue)}>
              {formatRupiahCompactId(activeContextData.totalPrValue)}
            </strong>
          </div>
          <div>
            <span className="text-[#565e74]">Project Code:</span>{' '}
            <strong className="font-mono text-[#004ac6]">{activeContextData.projectCode}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Sub Project:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.subProject}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Program:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.program}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">RKAP Budget Code:</span>{' '}
            <strong className="font-mono text-[#161c22]">{activeContextData.rkapBudgetCode}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">PR/PO Budget Code:</span>{' '}
            <strong className="font-mono text-[#161c22]">{activeContextData.prPoBudgetCode}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Description:</span>{' '}
            <strong
              className="text-[#161c22] truncate max-w-[200px] inline-block align-bottom"
              title={activeContextData.description}
            >
              {activeContextData.description}
            </strong>
          </div>
          <button
            onClick={() => {
              setSelectedPrNumber(null);
              setExplicitPrNumber(null);
              setSelectedRelNode(null);
            }}
            className="ml-auto text-[12px] text-[#004ac6] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>← Back to All PRs</span>
          </button>
        </div>
      )}

      {viewMode === 'po' && selectedPoNumber !== null && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-3.5 shadow-2xs flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
          <div>
            <span className="text-[#565e74]">PO Number:</span>{' '}
            <strong className="font-mono text-[#004ac6]">
              {activeContextData.poNumber || 'None'}
            </strong>
          </div>
          <div>
            <span className="text-[#565e74]">PO Date:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.poDate}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Total PO Value:</span>{' '}
            <strong className="font-mono text-[#161c22]" title={formatRupiahFull(activeContextData.totalPoValue)}>
              {formatRupiahCompactId(activeContextData.totalPoValue)}
            </strong>
          </div>
          <div>
            <span className="text-[#565e74]">Project Code:</span>{' '}
            <strong className="font-mono text-[#004ac6]">{activeContextData.projectCode}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Sub Project:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.subProject}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Program:</span>{' '}
            <strong className="text-[#161c22]">{activeContextData.program}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">RKAP Budget Code:</span>{' '}
            <strong className="font-mono text-[#161c22]">{activeContextData.rkapBudgetCode}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">PR/PO Budget Code:</span>{' '}
            <strong className="font-mono text-[#161c22]">{activeContextData.prPoBudgetCode}</strong>
          </div>
          <div>
            <span className="text-[#565e74]">Description:</span>{' '}
            <strong
              className="text-[#161c22] truncate max-w-[200px] inline-block align-bottom"
              title={activeContextData.description}
            >
              {activeContextData.description}
            </strong>
          </div>
          <button
            onClick={() => {
              setSelectedPoNumber(null);
              setExplicitPoNumber(null);
              setSelectedRelNode(null);
            }}
            className="ml-auto text-[12px] text-[#004ac6] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>← Back to All POs</span>
          </button>
        </div>
      )}

      {/* 5. SECTION: Selected Procurement Summary Pills */}
      {((viewMode === 'project' && selectedProjectKey !== null) ||
        (viewMode === 'pr' && selectedPrNumber !== null) ||
        (viewMode === 'po' && selectedPoNumber !== null)) && (
        <div className="bg-[#eef4fc] border border-[#d5e3fc] rounded-lg px-4 py-2.5 flex flex-wrap gap-8 text-[12px]">
          <div>
            <span className="text-[#565e74] uppercase font-bold block">PR/PO BUDGET CODES</span>
            <span className="font-mono font-bold text-[#161c22] text-[14px]">
              {activeContextData.numBudgetCodes}
            </span>
          </div>
          <div>
            <span className="text-[#565e74] uppercase font-bold block">UNIQUE PR</span>
            <span className="font-mono font-bold text-[#161c22] text-[14px]">
              {activeContextData.numPr}
            </span>
          </div>
          <div>
            <span className="text-[#565e74] uppercase font-bold block">TOTAL PR VALUE</span>
            <span
              className="font-mono font-bold text-[#161c22] text-[14px]"
              title={formatRupiahFull(activeContextData.totalPrValue)}
            >
              {formatRupiahCompactId(activeContextData.totalPrValue)}
            </span>
          </div>
          <div>
            <span className="text-[#565e74] uppercase font-bold block">UNIQUE PO</span>
            <span className="font-mono font-bold text-[#161c22] text-[14px]">
              {activeContextData.numPo}
            </span>
          </div>
          <div>
            <span className="text-[#565e74] uppercase font-bold block">TOTAL PO VALUE</span>
            <span
              className="font-mono font-bold text-[#161c22] text-[14px]"
              title={formatRupiahFull(activeContextData.totalPoValue)}
            >
              {formatRupiahCompactId(activeContextData.totalPoValue)}
            </span>
          </div>
        </div>
      )}

      {/* 6. SECTION: PR/PO Relationship Flow */}
      {((viewMode === 'project' && selectedProjectKey !== null) ||
        (viewMode === 'pr' && selectedPrNumber !== null) ||
        (viewMode === 'po' && selectedPoNumber !== null)) && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-[#dde3eb]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-[#161c22]">
                  PR/PO Budget Code → PR → PO Relationship Flow
                </h3>
                {selectedRelNode && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e8f0fe] text-[#004ac6] border border-[#d2e3fc]">
                    Filtered Context
                  </span>
                )}
              </div>
              <div className="text-[12px] text-[#565e74] flex items-center gap-1 mt-0.5">
                <span className="font-semibold text-[#161c22]">Scope:</span>
                <span className="text-[#565e74]">All Relationships</span>
                {selectedRelNode && (
                  <>
                    <span className="text-[#94a3b8]">/</span>
                    <span className="font-mono font-bold text-[#004ac6]">
                      {selectedRelNode.type === 'pr' && `PR ${selectedRelNode.value}`}
                      {selectedRelNode.type === 'po' && `PO ${selectedRelNode.value}`}
                      {selectedRelNode.type === 'budgetCode' &&
                        `Budget Code ${selectedRelNode.value}`}
                    </span>
                  </>
                )}
              </div>
            </div>

            {selectedRelNode !== null && (
              <button
                onClick={() => setSelectedRelNode(null)}
                className="px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#004ac6] border border-[#cbd5e1] rounded text-[12px] font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>← Back to All Relationships</span>
              </button>
            )}
          </div>

          <div className="p-4 bg-[#f6f9ff] border border-[#dde3eb] rounded-lg flex flex-col md:flex-row items-stretch justify-between gap-4">
            {/* Column 1: Budget Codes */}
            <div className="flex-1 bg-white border border-[#c3c6d7] rounded p-3 shadow-2xs flex flex-col">
              <div className="sticky top-0 bg-white z-10 pb-2 mb-2 border-b border-[#dde3eb] flex justify-between items-center shrink-0">
                <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
                  PR/PO BUDGET CODE ({visibleBudgets.length})
                </span>
                <Wallet className="w-4 h-4 text-[#565e74]" />
              </div>

              <div
                className={`flex-1 flex flex-col space-y-2 max-h-[320px] overflow-y-auto pr-1 ${
                  visibleBudgets.length <= 3 ? 'justify-center' : 'justify-start'
                }`}
              >
                {visibleBudgets.length > 0 ? (
                  visibleBudgets.map((b) => {
                    const isSelected =
                      selectedRelNode?.type === 'budgetCode' && selectedRelNode.value === b.code;
                    return (
                      <div
                        key={b.code}
                        onClick={() => setSelectedRelNode({ type: 'budgetCode', value: b.code })}
                        className={`cursor-pointer p-2.5 rounded border transition-all ${
                          isSelected
                            ? 'bg-[#e8f0fe] border-[#004ac6] ring-1 ring-[#004ac6] shadow-xs'
                            : 'bg-white hover:bg-[#f8fafc] border-[#cbd5e1]'
                        }`}
                      >
                        <div className="font-mono font-bold text-[#161c22] text-[13px] truncate">
                          {b.code}
                        </div>
                        <div className="text-[11px] text-[#5c647a] mt-1 line-clamp-2">{b.desc}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[12px] text-[#737686] italic py-4 text-center">
                    No Budget Code associated
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center text-[#737686]">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Column 2: PRs */}
            <div className="flex-1 bg-white border border-[#004ac6] rounded p-3 shadow-2xs flex flex-col">
              <div className="sticky top-0 bg-white z-10 pb-2 mb-2 border-b border-[#dde3eb] flex justify-between items-center shrink-0">
                <span className="text-[11px] font-bold text-[#004ac6] uppercase tracking-wider">
                  PURCHASE REQUISITION ({visiblePrItems.length})
                </span>
                <FileText className="w-4 h-4 text-[#004ac6]" />
              </div>

              <div
                className={`flex-1 flex flex-col space-y-2 max-h-[320px] overflow-y-auto pr-1 ${
                  visiblePrItems.length <= 3 ? 'justify-center' : 'justify-start'
                }`}
              >
                {visiblePrItems.length > 0 ? (
                  visiblePrItems.map((prItem) => {
                    const isSelected =
                      selectedRelNode?.type === 'pr' && selectedRelNode.value === prItem.prNumber;
                    return (
                      <div
                        key={prItem.prNumber}
                        onClick={() =>
                          setSelectedRelNode({ type: 'pr', value: prItem.prNumber })
                        }
                        className={`cursor-pointer p-2.5 rounded border transition-all ${
                          isSelected
                            ? 'bg-[#dbe1ff] border-[#004ac6] ring-1 ring-[#004ac6] shadow-xs'
                            : 'bg-[#f6f9ff] hover:bg-[#eef4fc] border-[#b4c5ff]'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-mono font-bold text-[#00174b] text-[13px] truncate">
                            {prItem.prNumber}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] bg-[#004ac6] text-white px-1.5 py-0.2 rounded font-bold">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-[#003ea8] mt-1.5">
                          <span>{formatDate(prItem.prDate)}</span>
                          <span
                            className="font-mono font-bold"
                            title={formatRupiahFull(prItem.totalValue)}
                          >
                            {formatRupiahCompactId(prItem.totalValue)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[12px] text-[#737686] italic py-4 text-center">
                    No PR associated
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center text-[#737686]">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Column 3: POs */}
            <div className="flex-1 bg-white border border-[#606e83] rounded p-3 shadow-2xs flex flex-col">
              <div className="sticky top-0 bg-white z-10 pb-2 mb-2 border-b border-[#dde3eb] flex justify-between items-center shrink-0">
                <span className="text-[11px] font-bold text-[#48566a] uppercase tracking-wider">
                  PURCHASE ORDER ({visiblePoItems.length})
                </span>
                <Receipt className="w-4 h-4 text-[#48566a]" />
              </div>

              {(() => {
                const poCount =
                  visiblePoItems.length === 0
                    ? 1
                    : visiblePoItems.length +
                      (!selectedRelNode && flowPrsWithoutPo.length > 0 ? 1 : 0);
                return (
                  <div
                    className={`flex-1 flex flex-col space-y-2 max-h-[320px] overflow-y-auto pr-1 ${
                      poCount <= 3 ? 'justify-center' : 'justify-start'
                    }`}
                  >
                    {visiblePoItems.length > 0 ? (
                      visiblePoItems.map((poItem) => {
                        const isSelected =
                          selectedRelNode?.type === 'po' &&
                          selectedRelNode.value === poItem.poNumber;
                        return (
                          <div
                            key={poItem.poNumber}
                            onClick={() =>
                              setSelectedRelNode({ type: 'po', value: poItem.poNumber })
                            }
                            className={`cursor-pointer p-2.5 rounded border transition-all ${
                              isSelected
                                ? 'bg-[#e8f0fe] border-[#004ac6] ring-1 ring-[#004ac6] shadow-xs'
                                : 'bg-[#f6f9ff] hover:bg-[#eef4fc] border-[#dde3eb]'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-mono text-[#161c22] font-bold text-[13px] truncate">
                                {poItem.poNumber}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] bg-[#004ac6] text-white px-1.5 py-0.2 rounded font-bold">
                                  Selected
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-[#5c647a] mt-1.5">
                              <span>{formatDate(poItem.poDate)}</span>
                              <span
                                className="font-mono text-[#161c22] font-bold"
                                title={formatRupiahFull(poItem.totalValue)}
                              >
                                {formatRupiahCompactId(poItem.totalValue)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 border border-dashed border-[#feefc3] bg-[#fef7e0] rounded text-center">
                        <span className="text-[12px] font-bold text-[#b06000] block">
                          PR Without PO
                        </span>
                        <p className="text-[11px] text-[#8c4d00] mt-0.5">
                          PR has not been converted to PO
                        </p>
                      </div>
                    )}

                    {!selectedRelNode && flowPrsWithoutPo.length > 0 && visiblePoItems.length > 0 && (
                      <div className="p-2 bg-[#fef7e0] border border-[#feefc3] rounded text-[11px] text-[#b06000] font-semibold flex items-center justify-between mt-2">
                        <span>{flowPrsWithoutPo.length} PR Without PO</span>
                        <span className="text-[10px] bg-[#feefc3] px-1.5 py-0.5 rounded text-[#8c4d00]">
                          Unconverted
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 7. SECTION: Procurement Detail Table */}
      {((viewMode === 'project' && selectedProjectKey !== null) ||
        (viewMode === 'pr' && selectedPrNumber !== null) ||
        (viewMode === 'po' && selectedPoNumber !== null)) && (
        <div className="bg-white border border-[#c3c6d7] rounded-lg shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-[#c3c6d7] bg-[#f8fafc] flex justify-between items-center">
            <h4 className="text-[13px] font-bold text-[#161c22]">Procurement Detail Table</h4>
            <span className="text-[12px] text-[#5c647a]">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalDetailLines)} of{' '}
              {totalDetailLines.toLocaleString('id-ID')} procurement lines
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead className="bg-[#f1f5f9] text-[#565e74] font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">Project Code</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">RKAP Budget Code</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7]">PR/PO Budget Code</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] max-w-[220px]">
                    Description
                  </th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] w-[170px] min-w-[170px]">PR Number</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-center">PR Date</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-right font-mono">
                    PR Line Value
                  </th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] w-[170px] min-w-[170px]">PO Number</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-center">PO Date</th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-right font-mono">
                    PO Line Value
                  </th>
                  <th className="py-2.5 px-3 border-b border-[#c3c6d7] text-center">
                    Relationship Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde3eb]">
                {paginatedDetailLines.map((pd, idx) => {
                  const prVal = getVisiblePrLineValue(pd);
                  const poVal = getVisiblePoLineValue(pd);
                  const prValFormatted = prVal !== null ? formatRupiahCompactId(prVal) : '—';
                  const poValFormatted = poVal !== null ? formatRupiahCompactId(poVal) : '—';
                  const visPr = getVisiblePrNumber(pd);
                  const visPo = getVisiblePoNumber(pd);
                  const visRkap = getVisibleRkapCode(pd);
                  const visPrPo = getVisiblePrPoCode(pd);
                  const visDesc = getVisibleDescription(pd);
                  const visRel = getVisibleRelationshipType(pd);
                  const prDateStr = getVisiblePrDate(pd);
                  const poDateStr = getVisiblePoDate(pd);

                  return (
                    <tr
                      key={pd.procurementLineKey || idx}
                      className="hover:bg-[#f6f9ff] transition-colors h-[38px]"
                    >
                      <td className="py-2 px-3 font-mono font-medium text-[#161c22]">
                        <button
                          onClick={() => handleSelectProjectContext(pd.projectKey)}
                          className="hover:underline text-left"
                        >
                          {pd.projectCode || 'No Project Code'}
                        </button>
                      </td>
                      <td className="py-2 px-3 font-mono text-[#161c22]">
                        {visRkap || '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-[#161c22]">
                        {visPrPo || '—'}
                      </td>
                      <td className="py-2 px-3 text-[#161c22] max-w-[220px]">
                        <span className="line-clamp-2" title={visDesc || pd.program || ''}>
                          {visDesc || pd.program || '—'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-[#004ac6] w-[170px] min-w-[170px]">
                        {visPr && visPr !== '—' ? (
                          <button
                            onClick={() => {
                              setSelectedPrNumber(visPr);
                              setViewMode('pr');
                            }}
                            className="hover:underline"
                          >
                            {visPr}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 px-3 text-center text-[#5c647a]">
                        {formatDate(prDateStr)}
                      </td>
                      <td
                        className="py-2 px-3 text-right font-mono text-[#161c22] font-semibold"
                        title={formatRupiahFull(prVal)}
                      >
                        {prValFormatted}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-[#004ac6] w-[170px] min-w-[170px]">
                        {visPo && visPo !== '—' ? (
                          <button
                            onClick={() => {
                              setSelectedPoNumber(visPo);
                              setViewMode('po');
                            }}
                            className="hover:underline"
                          >
                            {visPo}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 px-3 text-center text-[#5c647a]">
                        {formatDate(poDateStr)}
                      </td>
                      <td
                        className="py-2 px-3 text-right font-mono text-[#161c22] font-semibold"
                        title={formatRupiahFull(poVal)}
                      >
                        {poValFormatted}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] inline-block">
                          {visRel || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {paginatedDetailLines.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-[#737686] text-[13px]">
                      {viewMode === 'project' && selectedProjectKey && (projectProcMap.get(selectedProjectKey) || []).length === 0
                        ? 'No procurement records are available for this Project Key.'
                        : 'No procurement lines found matching your search and filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-3 border-t border-[#c3c6d7] bg-[#f8fafc] flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] text-[#5c647a]">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalDetailLines)} of{' '}
              {totalDetailLines.toLocaleString('id-ID')} procurement lines
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border border-[#c3c6d7] bg-white text-[#161c22] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f1f5f9]"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded border border-[#c3c6d7] bg-white text-[#161c22] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f1f5f9] flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>

              <span className="px-3 py-1 font-semibold text-[#161c22]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded border border-[#c3c6d7] bg-white text-[#161c22] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f1f5f9] flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded border border-[#c3c6d7] bg-white text-[#161c22] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f1f5f9]"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
