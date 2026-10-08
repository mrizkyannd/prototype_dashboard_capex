export type RouteId = 
  | 'executive-overview'
  | 'project-portfolio'
  | 'procurement-explorer'
  | 'vowd-rna'
  | 'project-detail'
  | 'data-connection-test';

export interface ControlRow {
  projectBundling: string;
  summaryBase: number | null;
  detailBase: number | null;
  deltaBase: number | null;
  summaryInflated: number | null;
  detailInflated: number | null;
  deltaInflated: number | null;
  summaryRAB: number | null;
  detailRAB: number | null;
  deltaRAB: number | null;
  summaryRKAP: number | null;
  detailRKAP: number | null;
  deltaRKAP: number | null;
  summaryOB: number | null;
  detailOB: number | null;
  obControlAdjustment: number | null;
  adjustedDetailOB: number | null;
  deltaOB: number | null;
  summaryPR: number | null;
  detailPR: number | null;
  deltaPR: number | null;
  summaryPO: number | null;
  detailPO: number | null;
  deltaPO: number | null;
  summaryVOWD: number | null;
  detailVOWD: number | null;
  deltaVOWD: number | null;
  summaryRNA: number | null;
  detailRNA: number | null;
  deltaRNA: number | null;
  controlStatus: 'PASS' | 'PASS WITH KNOWN EXCEPTION' | 'REVIEW';
  controlNote: string;
}

export interface ProjectRow {
  projectKey: string;
  projectKeyBasis: string | null;
  sourceSheet: string | null;
  sourceItemKey: string | null;
  sourceHeaderRow: number | null;
  sourceNo: string | null;
  sectionNo: string | null;
  sectionContext: string | null;
  projectType: string | null;
  projectBundling: string | null;
  projectCode: string | null;
  schedule: string | null;
  tok: string | null;
  subProject: string | null;
  program: string | null;
  tahunProgram: string | null;
  kategori: string | null;
  lokasi: string | null;
  volume: number | null;
  unit: string | null;
  sourceLineCount: number | null;
  sourceItemCount: number | null;
  attributeConflict: string | null;
  conflictFields: string | null;
}

export interface FinancialRow {
  projectKey: string;
  projectType: string | null;
  projectBundling: string | null;
  projectCode: string | null;
  capexBase: number | null;
  capexInflated: number | null;
  rab: number | null;
  rkapYears: string | null;
  rkap: number | null;
  obYears: string | null;
  ob: number | null;
  rna: number | null;
  financialSourceLineCount: number | null;
  hasFinancialData: string | null;
  // Merged-aware display fields
  capexBaseDisplay?: number | null;
  capexInflatedDisplay?: number | null;
  rabDisplay?: number | null;
  rkapDisplay?: number | null;
  obDisplay?: number | null;
  rnaDisplay?: number | null;
  // Metadata fields
  capexBaseFinancialGroup?: string | null;
  capexInflatedFinancialGroup?: string | null;
  rabFinancialGroup?: string | null;
  rkapFinancialGroupCount?: number | null;
  obFinancialGroupCount?: number | null;
  rnaFinancialGroupCount?: number | null;
  sharedMonetaryGroupCount?: number | null;
  mergedAwareFinancial?: string | null;
}

export interface FinancialGroupRow {
  financialGroupKey: string;
  field: string | null;
  aggregationRule: string | null;
  groupType: string | null;
  sourceSheet: string | null;
  sourceReference: string | null;
  groupRawValue: number | null;
  projectCountInGroup: number | null;
  crossesMultipleProjectKeys: string | null;
  projectKeysSample: string | null;
}

export interface FinancialProjectGroupRow {
  projectKey: string;
  field: string | null;
  aggregationRule: string | null;
  financialGroupKey: string;
  groupType: string | null;
  sourceSheet: string | null;
  sourceReference: string | null;
  groupRawValue: number | null;
  firstMappedSourceRow: number | null;
  includedForProject: string | null;
  inclusionReason: string | null;
  projectCountInGroup: number | null;
  crossesMultipleProjectKeys: string | null;
}

export interface ProcurementRow {
  procurementLineKey: string;
  projectKey: string;
  projectCode: string | null;
  projectType: string | null;
  projectBundling: string | null;
  schedule: string | null;
  tok: string | null;
  subProject: string | null;
  program: string | null;
  tahunProgram: string | null;
  kodeBudgetRkap: string | null;
  kodeBudgetPrPo: string | null;
  description: string | null;
  prNumber: string | null;
  prDate: string | null;
  prLineValue: number | null;
  poNumber: string | null;
  poDate: string | null;
  poLineValue: number | null;
  relationshipType: string | null;
  sourceSheet: string | null;
  sourceRow: number | null;
  sectionNo: string | null;
  sectionContext: string | null;
  itemNo: string | null;
  itemKey: string | null;
  // Merged-aware display fields
  kodeBudgetRkapDisplay?: string | null;
  kodeBudgetPrPoDisplay?: string | null;
  descriptionDisplay?: string | null;
  prNumberDisplay?: string | null;
  prDateDisplay?: string | null;
  prLineValueDisplay?: number | null;
  prValueGroupKey?: string | null;
  poNumberDisplay?: string | null;
  poDateDisplay?: string | null;
  poLineValueDisplay?: number | null;
  poValueGroupKey?: string | null;
  relationshipTypeDisplay?: string | null;
  mergedAwareProcurement?: string | null;
}

export interface ProcurementValueGroupRow {
  procurementValueGroupKey: string;
  field: string | null;
  groupType: string | null;
  sourceSheet: string | null;
  sourceReference: string | null;
  groupRawValue: number | null;
  procurementLineCount: number | null;
  projectCount: number | null;
  crossesMultipleProjectKeys: string | null;
  procurementLinesSample: string | null;
  projectKeysSample: string | null;
}

export interface ProcurementLineGroupRow {
  procurementLineKey: string;
  projectKey: string;
  field: string | null;
  procurementValueGroupKey: string;
  groupType: string | null;
  sourceSheet: string | null;
  sourceReference: string | null;
  groupRawValue: number | null;
  sourceRow: number | null;
  projectCountInGroup: number | null;
  crossesMultipleProjectKeys: string | null;
}

export interface VowdRow {
  projectKey: string;
  projectCode: string | null;
  projectType: string | null;
  projectBundling: string | null;
  schedule: string | null;
  tok: string | null;
  subProject: string | null;
  program: string | null;
  tahunProgram: string | null;
  year: number | string;
  periodStatus: string | null;
  vowd: number | null;
  sourceLineCount: number | null;
  sourceSheetCount: number | null;
  // Merged-aware fields
  vowdDisplay?: number | null;
  vowdGroupCount?: number | null;
  sharedVowdGroupCount?: number | null;
  vowdGroupKeys?: string | null;
  mergedAwareVowd?: string | null;
  displayOnlySharedRow?: string | null;
}

export interface VowdGroupRow {
  vowdGroupKey: string;
  year: number | string;
  groupType: string | null;
  sourceSheet: string | null;
  sourceReference: string | null;
  groupRawValue: number | null;
  projectCount: number | null;
  crossesMultipleProjectKeys: string | null;
  projectKeysSample: string | null;
}

export interface VowdProjectGroupRow {
  projectKey: string;
  year: number | string;
  vowdGroupKey: string;
  groupType: string | null;
  sourceSheet: string | null;
  sourceReference: string | null;
  groupRawValue: number | null;
  firstMappedSourceRow: number | null;
  projectCountInGroup: number | null;
  crossesMultipleProjectKeys: string | null;
}

export interface ValidationResult {
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  spreadsheetId: string;
  dashControl: {
    rows: number;
    expectedRows: number;
    status: 'PASS' | 'REVIEW';
    passCount: number;
    passWithExceptionCount: number;
    reviewCount: number;
  };
  dashProject: {
    rows: number;
    expectedRows: number;
    status: 'PASS' | 'REVIEW';
  };
  projectKeyValidation: {
    uniqueProjectKeys: number;
    blankProjectKeys: number;
    duplicateProjectKeys: number;
    status: 'PASS' | 'REVIEW';
  };
  projectTypeValidation: {
    greenfieldCount: number;
    brownfieldCount: number;
    invalidProjectTypeCount: number;
    status: 'PASS' | 'REVIEW';
  };
  controlValidation: {
    passRows: number;
    passWithExceptionRows: number;
    reviewRows: number;
    status: 'PASS' | 'REVIEW';
  };
  dashFinancial: {
    rows: number;
    expectedRows: number;
    uniqueProjectKeys: number;
    orphanProjectKeys: number;
    projectsWithFinancialData: number;
    projectsWithoutFinancialData: number;
    totalCapexBase: number;
    totalCapexInflated: number;
    totalRab: number;
    totalRkap: number;
    totalOb: number;
    totalRna: number;
    status: 'PASS' | 'REVIEW';
  };
  dashProcurement: {
    rows: number;
    expectedRows: number;
    uniqueProjects: number;
    uniquePrNumbers: number;
    uniquePoNumbers: number;
    orphanProjectKeys: number;
    totalPrLineValue: number;
    totalPoLineValue: number;
    status: 'PASS' | 'REVIEW';
  };
  dashVowd: {
    rows: number;
    expectedRows: number;
    uniqueProjects: number;
    orphanProjectKeys: number;
    vowd2023: number;
    vowd2024: number;
    vowd2025: number;
    vowd2026Ytd: number;
    totalVowd: number;
    status: 'PASS' | 'REVIEW';
  };
  dashFinancialGroup: {
    rows: number;
    expectedRows: number;
    status: 'PASS' | 'REVIEW';
  };
  dashFinancialProjectGroup: {
    rows: number;
    expectedRows: number;
    status: 'PASS' | 'REVIEW';
  };
  dashProcurementValueGroup: {
    rows: number;
    expectedRows: number;
    status: 'PASS' | 'REVIEW';
  };
  dashProcurementLineGroup: {
    rows: number;
    expectedRows: number;
    status: 'PASS' | 'REVIEW';
  };
  dashVowdGroup: {
    rows: number;
    expectedRows: number;
    status: 'PASS' | 'REVIEW';
  };
  dashVowdProjectGroup: {
    rows: number;
    expectedRows: number;
    status: 'PASS' | 'REVIEW';
  };
  officialTotalValues: {
    summaryBase: number | null;
    summaryInflated: number | null;
    summaryRAB: number | null;
    summaryRKAP: number | null;
    summaryOB: number | null;
    summaryPR: number | null;
    summaryPO: number | null;
    summaryVOWD: number | null;
    summaryRNA: number | null;
  } | null;
  totalRow?: ControlRow | null;
  lastRefreshed?: string;
  error?: string;
}

export interface ProjectItem {
  id: string; // Internal ID
  projectKey: string; // Technical identifier (e.g. "PROJ-KEY-0001")
  projectCode: string; // e.g. "PRJ-2023-001" or empty for muted "No Project Code"
  projectType: 'Greenfield' | 'Brownfield' | string;
  projectBundling: string;
  schedule: 'Master Schedule' | 'Non-Master Schedule' | string;
  tok: string; // e.g. "Apr 2026", "Okt 2026"
  subProject: string;
  program: string;
  tahunProgram?: string;
  kategori?: string;
  lokasi?: string;
  sectionContext?: string;
  volume?: string;
  unit?: string;
  // Raw numbers for accurate sorting and aggregation
  capexBaseNum?: number | null;
  capexInflatedNum?: number | null;
  rabNum?: number | null;
  rkapNum?: number | null;
  obNum?: number | null;
  prNum?: number | null;
  poNum?: number | null;
  vowdNum?: number | null;
  rnaNum?: number | null;
  // Formatted strings for display
  capexBase: string; // e.g. "Rp 45,20 T" or "—"
  capexInflated: string;
  rab: string;
  rkap: string;
  ob: string;
  pr: string;
  po: string;
  vowd: string;
  rna: string;
  // Procurement summary stats
  numBudgetCodes: number;
  numPr: number;
  prValueNum?: number;
  prValue: string;
  latestPrDate: string;
  numPo: number;
  poValueNum?: number;
  poValue: string;
  latestPoDate: string;
  relationshipStatus?: string;
  procurementRows?: UIProcurementRow[];
}

export interface UIProcurementRow {
  id: string;
  rkapBudgetCode: string;
  prPoBudgetCode: string;
  description: string;
  prNumber: string;
  prDate: string;
  prValue: string;
  poNumber: string;
  poDate: string;
  poValue: string;
}
