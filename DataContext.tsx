import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  ControlRow,
  ProjectRow,
  FinancialRow,
  FinancialGroupRow,
  FinancialProjectGroupRow,
  ProcurementRow,
  ProcurementValueGroupRow,
  ProcurementLineGroupRow,
  VowdRow,
  VowdGroupRow,
  VowdProjectGroupRow,
  ValidationResult,
} from '../types';

interface DataContextType {
  controlRows: ControlRow[];
  projects: ProjectRow[];
  financials: FinancialRow[];
  procurement: ProcurementRow[];
  vowd: VowdRow[];
  financialGroups: FinancialGroupRow[];
  financialProjectGroups: FinancialProjectGroupRow[];
  procurementValueGroups: ProcurementValueGroupRow[];
  procurementLineGroups: ProcurementLineGroupRow[];
  vowdGroups: VowdGroupRow[];
  vowdProjectGroups: VowdProjectGroupRow[];
  validationData: ValidationResult | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastRefreshed: string | null;
  isLoaded: boolean;
  refreshData: (force?: boolean) => Promise<void>;

  // Pre-computed lookup Maps for O(1) page access
  projectByKeyMap: Map<string, ProjectRow>;
  financialByProjectKeyMap: Map<string, FinancialRow>;
  procurementByProjectKeyMap: Map<string, ProcurementRow[]>;
  vowdByProjectKeyMap: Map<string, VowdRow[]>;
  financialGroupByKeyMap: Map<string, FinancialGroupRow>;
  procurementValueGroupByKeyMap: Map<string, ProcurementValueGroupRow>;
  vowdGroupByKeyMap: Map<string, VowdGroupRow>;

  // Distinct group aggregation helper methods
  getFilteredFinancialTotals: (matchingProjectKeys?: Set<string> | null) => {
    capexBase: number;
    capexInflated: number;
    rab: number;
    rkap: number;
    ob: number;
    rna: number;
  };
  getFilteredProcurementTotals: (matchingProjectKeys?: Set<string> | null) => {
    prTotal: number;
    poTotal: number;
  };
  getFilteredVowdTotals: (matchingProjectKeys?: Set<string> | null) => {
    totalVowd: number;
    vowd2023: number;
    vowd2024: number;
    vowd2025: number;
    vowd2026: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [controlRows, setControlRows] = useState<ControlRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [financials, setFinancials] = useState<FinancialRow[]>([]);
  const [procurement, setProcurement] = useState<ProcurementRow[]>([]);
  const [vowd, setVowd] = useState<VowdRow[]>([]);
  const [financialGroups, setFinancialGroups] = useState<FinancialGroupRow[]>([]);
  const [financialProjectGroups, setFinancialProjectGroups] = useState<FinancialProjectGroupRow[]>([]);
  const [procurementValueGroups, setProcurementValueGroups] = useState<ProcurementValueGroupRow[]>([]);
  const [procurementLineGroups, setProcurementLineGroups] = useState<ProcurementLineGroupRow[]>([]);
  const [vowdGroups, setVowdGroups] = useState<VowdGroupRow[]>([]);
  const [vowdProjectGroups, setVowdProjectGroups] = useState<VowdProjectGroupRow[]>([]);
  const [validationData, setValidationData] = useState<ValidationResult | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const fetchData = async (forceRefresh = false) => {
    if (isLoaded && !forceRefresh) {
      return; // Reuse client cache if already loaded and not forcing refresh
    }

    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const refreshParam = forceRefresh ? '?refresh=true' : '';
      const res = await fetch(`/api/sheets/all${refreshParam}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setControlRows(json.data.control || []);
          setProjects(json.data.projects || []);
          setFinancials(json.data.financials || []);
          setProcurement(json.data.procurement || []);
          setVowd(json.data.vowd || []);
          setFinancialGroups(json.data.financialGroups || []);
          setFinancialProjectGroups(json.data.financialProjectGroups || []);
          setProcurementValueGroups(json.data.procurementValueGroups || []);
          setProcurementLineGroups(json.data.procurementLineGroups || []);
          setVowdGroups(json.data.vowdGroups || []);
          setVowdProjectGroups(json.data.vowdProjectGroups || []);
          if (json.data.validationData) {
            setValidationData(json.data.validationData);
          }
          setIsLoaded(true);
          const now = new Date();
          const dayStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          setLastRefreshed(`${dayStr}, ${timeStr}`);
        } else {
          throw new Error(json.error || 'Failed to fetch datasets');
        }
      } else {
        // Fallback parallel requests
        const [ctrlRes, projRes, finRes, procRes, vowdRes] = await Promise.all([
          fetch(`/api/sheets/control${refreshParam}`),
          fetch(`/api/sheets/projects${refreshParam}`),
          fetch(`/api/sheets/financials${refreshParam}`),
          fetch(`/api/sheets/procurement${refreshParam}`),
          fetch(`/api/sheets/vowd${refreshParam}`),
        ]);

        const [ctrlJson, projJson, finJson, procJson, vowdJson] = await Promise.all([
          ctrlRes.json(),
          projRes.json(),
          finRes.json(),
          procRes.json(),
          vowdRes.json(),
        ]);

        if (ctrlJson.success) setControlRows(ctrlJson.data || []);
        if (projJson.success) setProjects(projJson.data || []);
        if (finJson.success) setFinancials(finJson.data || []);
        if (procJson.success) setProcurement(procJson.data || []);
        if (vowdJson.success) setVowd(vowdJson.data || []);

        setIsLoaded(true);
        const now = new Date();
        const dayStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        setLastRefreshed(`${dayStr}, ${timeStr}`);
      }
    } catch (err: any) {
      console.error('Error in DataProvider fetchData:', err);
      setError(err.message || 'Failed to load master datasets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  // Pre-computed lookup maps
  const projectByKeyMap = useMemo(() => {
    const map = new Map<string, ProjectRow>();
    projects.forEach((p) => {
      if (p.projectKey) map.set(p.projectKey, p);
    });
    return map;
  }, [projects]);

  const financialByProjectKeyMap = useMemo(() => {
    const map = new Map<string, FinancialRow>();
    financials.forEach((f) => {
      if (f.projectKey) map.set(f.projectKey, f);
    });
    return map;
  }, [financials]);

  const procurementByProjectKeyMap = useMemo(() => {
    const map = new Map<string, ProcurementRow[]>();
    procurement.forEach((p) => {
      if (p.projectKey) {
        const existing = map.get(p.projectKey) || [];
        existing.push(p);
        map.set(p.projectKey, existing);
      }
    });
    return map;
  }, [procurement]);

  const vowdByProjectKeyMap = useMemo(() => {
    const map = new Map<string, VowdRow[]>();
    vowd.forEach((v) => {
      if (v.projectKey) {
        const existing = map.get(v.projectKey) || [];
        existing.push(v);
        map.set(v.projectKey, existing);
      }
    });
    return map;
  }, [vowd]);

  const financialGroupByKeyMap = useMemo(() => {
    const map = new Map<string, FinancialGroupRow>();
    financialGroups.forEach((fg) => {
      if (fg.financialGroupKey) map.set(fg.financialGroupKey, fg);
    });
    return map;
  }, [financialGroups]);

  const procurementValueGroupByKeyMap = useMemo(() => {
    const map = new Map<string, ProcurementValueGroupRow>();
    procurementValueGroups.forEach((pg) => {
      if (pg.procurementValueGroupKey) map.set(pg.procurementValueGroupKey, pg);
    });
    return map;
  }, [procurementValueGroups]);

  const vowdGroupByKeyMap = useMemo(() => {
    const map = new Map<string, VowdGroupRow>();
    vowdGroups.forEach((vg) => {
      if (vg.vowdGroupKey) map.set(vg.vowdGroupKey, vg);
    });
    return map;
  }, [vowdGroups]);

  // Aggregation helpers using Distinct Group Keys
  const getFilteredFinancialTotals = (matchingProjectKeys?: Set<string> | null) => {
    if (!matchingProjectKeys) {
      // Unfiltered total: check controlRows or sum financialGroups
      const totalControl = controlRows.find((r) => r.projectBundling === 'TOTAL');
      if (totalControl && totalControl.summaryBase != null) {
        return {
          capexBase: totalControl.summaryBase,
          capexInflated: totalControl.summaryInflated || 0,
          rab: totalControl.summaryRAB || 0,
          rkap: totalControl.summaryRKAP || 0,
          ob: totalControl.summaryOB || 0,
          rna: totalControl.summaryRNA || 0,
        };
      }
      // Sum distinct financial groups
      const fieldTotals: Record<string, number> = {
        'CAPEX Base': 0,
        'CAPEX Inflated': 0,
        RAB: 0,
        RKAP: 0,
        OB: 0,
        RNA: 0,
      };
      financialGroups.forEach((g) => {
        const field = g.field ? g.field.trim() : '';
        if (field in fieldTotals) {
          fieldTotals[field] += g.groupRawValue || 0;
        }
      });
      return {
        capexBase: fieldTotals['CAPEX Base'],
        capexInflated: fieldTotals['CAPEX Inflated'],
        rab: fieldTotals['RAB'],
        rkap: fieldTotals['RKAP'],
        ob: fieldTotals['OB'],
        rna: fieldTotals['RNA'],
      };
    }

    // Filtered by project keys: collect related financial group keys
    const groupKeysByField: Record<string, Set<string>> = {
      'CAPEX Base': new Set(),
      'CAPEX Inflated': new Set(),
      RAB: new Set(),
      RKAP: new Set(),
      OB: new Set(),
      RNA: new Set(),
    };

    financialProjectGroups.forEach((pg) => {
      if (matchingProjectKeys.has(pg.projectKey) && pg.includedForProject === 'YES') {
        const field = pg.field ? pg.field.trim() : '';
        if (Object.prototype.hasOwnProperty.call(groupKeysByField, field) && pg.financialGroupKey) {
          groupKeysByField[field]?.add(pg.financialGroupKey);
        }
      }
    });

    const sumField = (field: string) => {
      let sum = 0;
      groupKeysByField[field].forEach((gKey) => {
        const groupObj = financialGroupByKeyMap.get(gKey);
        if (groupObj) {
          sum += groupObj.groupRawValue || 0;
        }
      });
      return sum;
    };

    return {
      capexBase: sumField('CAPEX Base'),
      capexInflated: sumField('CAPEX Inflated'),
      rab: sumField('RAB'),
      rkap: sumField('RKAP'),
      ob: sumField('OB'),
      rna: sumField('RNA'),
    };
  };

  const getFilteredProcurementTotals = (matchingProjectKeys?: Set<string> | null) => {
    if (!matchingProjectKeys) {
      let prTotal = 0;
      let poTotal = 0;
      procurementValueGroups.forEach((g) => {
        const f = g.field ? g.field.trim() : '';
        if (f === 'PR Line Value' || f === 'PR Value') prTotal += g.groupRawValue || 0;
        else if (f === 'PO Line Value' || f === 'PO Value') poTotal += g.groupRawValue || 0;
      });
      return { prTotal, poTotal };
    }

    const prGroupKeys = new Set<string>();
    const poGroupKeys = new Set<string>();

    procurementLineGroups.forEach((lg) => {
      if (matchingProjectKeys.has(lg.projectKey) && lg.procurementValueGroupKey) {
        const f = lg.field ? lg.field.trim() : '';
        if (f === 'PR Line Value' || f === 'PR Value') prGroupKeys.add(lg.procurementValueGroupKey);
        else if (f === 'PO Line Value' || f === 'PO Value') poGroupKeys.add(lg.procurementValueGroupKey);
      }
    });

    let prTotal = 0;
    let poTotal = 0;

    prGroupKeys.forEach((key) => {
      const g = procurementValueGroupByKeyMap.get(key);
      if (g) prTotal += g.groupRawValue || 0;
    });

    poGroupKeys.forEach((key) => {
      const g = procurementValueGroupByKeyMap.get(key);
      if (g) poTotal += g.groupRawValue || 0;
    });

    return { prTotal, poTotal };
  };

  const getFilteredVowdTotals = (matchingProjectKeys?: Set<string> | null) => {
    if (!matchingProjectKeys) {
      let totalVowd = 0;
      let vowd2023 = 0;
      let vowd2024 = 0;
      let vowd2025 = 0;
      let vowd2026 = 0;

      vowdGroups.forEach((g) => {
        const val = g.groupRawValue || 0;
        totalVowd += val;
        const yr = String(g.year).trim();
        if (yr === '2023') vowd2023 += val;
        else if (yr === '2024') vowd2024 += val;
        else if (yr === '2025') vowd2025 += val;
        else if (yr === '2026') vowd2026 += val;
      });

      return { totalVowd, vowd2023, vowd2024, vowd2025, vowd2026 };
    }

    const vowdGroupKeys = new Set<string>();
    vowdProjectGroups.forEach((vpg) => {
      if (matchingProjectKeys.has(vpg.projectKey) && vpg.vowdGroupKey) {
        vowdGroupKeys.add(vpg.vowdGroupKey);
      }
    });

    let totalVowd = 0;
    let vowd2023 = 0;
    let vowd2024 = 0;
    let vowd2025 = 0;
    let vowd2026 = 0;

    vowdGroupKeys.forEach((key) => {
      const g = vowdGroupByKeyMap.get(key);
      if (g) {
        const val = g.groupRawValue || 0;
        totalVowd += val;
        const yr = String(g.year).trim();
        if (yr === '2023') vowd2023 += val;
        else if (yr === '2024') vowd2024 += val;
        else if (yr === '2025') vowd2025 += val;
        else if (yr === '2026') vowd2026 += val;
      }
    });

    return { totalVowd, vowd2023, vowd2024, vowd2025, vowd2026 };
  };

  return (
    <DataContext.Provider
      value={{
        controlRows,
        projects,
        financials,
        procurement,
        vowd,
        financialGroups,
        financialProjectGroups,
        procurementValueGroups,
        procurementLineGroups,
        vowdGroups,
        vowdProjectGroups,
        validationData,
        loading,
        refreshing,
        error,
        lastRefreshed,
        isLoaded,
        refreshData: fetchData,
        projectByKeyMap,
        financialByProjectKeyMap,
        procurementByProjectKeyMap,
        vowdByProjectKeyMap,
        financialGroupByKeyMap,
        procurementValueGroupByKeyMap,
        vowdGroupByKeyMap,
        getFilteredFinancialTotals,
        getFilteredProcurementTotals,
        getFilteredVowdTotals,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
