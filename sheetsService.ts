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

const SPREADSHEET_ID = '1uQPLJU2a3Zx8QKiGFoj14yN3DyeAoUV7Gw93GqpzAd4';

// Simple in-memory cache to reuse parsed results and avoid calling Sheets separately for every query
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let controlCache: CacheEntry<ControlRow[]> | null = null;
let projectCache: CacheEntry<ProjectRow[]> | null = null;
let financialCache: CacheEntry<FinancialRow[]> | null = null;
let procurementCache: CacheEntry<ProcurementRow[]> | null = null;
let vowdCache: CacheEntry<VowdRow[]> | null = null;

let financialGroupCache: CacheEntry<FinancialGroupRow[]> | null = null;
let financialProjectGroupCache: CacheEntry<FinancialProjectGroupRow[]> | null = null;
let procurementValueGroupCache: CacheEntry<ProcurementValueGroupRow[]> | null = null;
let procurementLineGroupCache: CacheEntry<ProcurementLineGroupRow[]> | null = null;
let vowdGroupCache: CacheEntry<VowdGroupRow[]> | null = null;
let vowdProjectGroupCache: CacheEntry<VowdProjectGroupRow[]> | null = null;

let projectByKeyMapCache: CacheEntry<Map<string, ProjectRow>> | null = null;
let financialByProjectKeyMapCache: CacheEntry<Map<string, FinancialRow>> | null = null;
let procurementByProjectKeyMapCache: CacheEntry<Map<string, ProcurementRow[]>> | null = null;
let vowdByProjectKeyMapCache: CacheEntry<Map<string, VowdRow[]>> | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * State-machine CSV parser supporting multiline quoted string fields
 */
function parseCSV(text: string): { headers: string[]; rows: Record<string, string | null>[] } {
  const rows: string[][] = [];
  let curRow: string[] = [];
  let curVal = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        curVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      curRow.push(curVal);
      curVal = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && text[i + 1] === '\n') {
        i++;
      }
      curRow.push(curVal);
      curVal = '';
      if (curRow.length > 0 && !(curRow.length === 1 && curRow[0] === '')) {
        rows.push(curRow);
      }
      curRow = [];
    } else {
      curVal += c;
    }
  }
  if (curVal !== '' || curRow.length > 0) {
    curRow.push(curVal);
    rows.push(curRow);
  }

  if (rows.length === 0) return { headers: [], rows: [] };

  const rawHeaders = rows[0].map(h => h.trim());
  const dataRows: Record<string, string | null>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const rowArray = rows[r];
    if (rowArray.length === 1 && !rowArray[0].trim()) continue;
    const rowObj: Record<string, string | null> = {};
    rawHeaders.forEach((h, idx) => {
      const rawVal = rowArray[idx];
      rowObj[h] = (rawVal !== undefined && rawVal !== null && rawVal.trim() !== '') ? rawVal.trim() : null;
    });
    dataRows.push(rowObj);
  }

  return { headers: rawHeaders, rows: dataRows };
}

// Helper to safely parse numbers, preserving null/blank values (never converting missing to 0 automatically)
function parseNum(val: string | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  const clean = String(val).replace(/,/g, '').trim();
  if (clean === '') return null;
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

/**
 * Fetch and parse DASH_CONTROL dataset from Google Sheets.
 */
export async function getControl(forceRefresh = false): Promise<ControlRow[]> {
  const now = Date.now();
  if (!forceRefresh && controlCache && (now - controlCache.timestamp < CACHE_TTL_MS)) {
    return controlCache.data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DASH_CONTROL`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch DASH_CONTROL: ${response.statusText}`);
  }
  const csvText = await response.text();
  const { rows } = parseCSV(csvText);

  const parsedControlRows: ControlRow[] = rows.map((r) => ({
    projectBundling: r['Project Bundling'] || '',
    summaryBase: parseNum(r['Summary Base']),
    detailBase: parseNum(r['Detail Base']),
    deltaBase: parseNum(r['Delta Base']),
    summaryInflated: parseNum(r['Summary Inflated']),
    detailInflated: parseNum(r['Detail Inflated']),
    deltaInflated: parseNum(r['Delta Inflated']),
    summaryRAB: parseNum(r['Summary RAB']),
    detailRAB: parseNum(r['Detail RAB']),
    deltaRAB: parseNum(r['Delta RAB']),
    summaryRKAP: parseNum(r['Summary RKAP']),
    detailRKAP: parseNum(r['Detail RKAP']),
    deltaRKAP: parseNum(r['Delta RKAP']),
    summaryOB: parseNum(r['Summary OB']),
    detailOB: parseNum(r['Detail OB']),
    obControlAdjustment: parseNum(r['OB Control Adjustment']),
    adjustedDetailOB: parseNum(r['Adjusted Detail OB']),
    deltaOB: parseNum(r['Delta OB']),
    summaryPR: parseNum(r['Summary PR']),
    detailPR: parseNum(r['Detail PR']),
    deltaPR: parseNum(r['Delta PR']),
    summaryPO: parseNum(r['Summary PO']),
    detailPO: parseNum(r['Detail PO']),
    deltaPO: parseNum(r['Delta PO']),
    summaryVOWD: parseNum(r['Summary VOWD']),
    detailVOWD: parseNum(r['Detail VOWD']),
    deltaVOWD: parseNum(r['Delta VOWD']),
    summaryRNA: parseNum(r['Summary RNA']),
    detailRNA: parseNum(r['Detail RNA']),
    deltaRNA: parseNum(r['Delta RNA']),
    controlStatus: (r['Control Status'] || 'REVIEW') as ControlRow['controlStatus'],
    controlNote: r['Control Note'] || '',
  }));

  controlCache = { data: parsedControlRows, timestamp: now };
  return parsedControlRows;
}

function extractProjectCode(rawCode: string | null | undefined, projectKey: string): string | null {
  if (rawCode && rawCode.trim() && rawCode.trim() !== '—') {
    return rawCode.trim();
  }
  if (projectKey && projectKey.includes('CODE:')) {
    const parts = projectKey.split('|');
    const codePart = parts.find((pt) => pt.trim().startsWith('CODE:'));
    if (codePart) {
      const extracted = codePart.trim().substring(5).trim();
      if (extracted && extracted !== '—') return extracted;
    }
  }
  return null;
}

/**
 * Fetch and parse DASH_PROJECT dataset from Google Sheets.
 */
export async function getProjects(forceRefresh = false): Promise<ProjectRow[]> {
  const now = Date.now();
  if (!forceRefresh && projectCache && (now - projectCache.timestamp < CACHE_TTL_MS)) {
    return projectCache.data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DASH_PROJECT`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch DASH_PROJECT: ${response.statusText}`);
  }
  const csvText = await response.text();
  const { rows } = parseCSV(csvText);

  const parsedProjectRows: ProjectRow[] = rows.map((r) => ({
    projectKey: r['Project Key'] || '',
    projectKeyBasis: r['Project Key Basis'] || null,
    sourceSheet: r['Source Sheet'] || null,
    sourceItemKey: r['Source Item Key'] || null,
    sourceHeaderRow: parseNum(r['Source Header Row']),
    sourceNo: r['Source No'] || null,
    sectionNo: r['Section No'] || null,
    sectionContext: r['Section Context'] || null,
    projectType: r['Project Type'] || null,
    projectBundling: r['Project Bundling'] || null,
    projectCode: extractProjectCode(r['Project Code'], r['Project Key'] || ''),
    schedule: r['Schedule'] || null,
    tok: r['TOK'] || null,
    subProject: r['Sub Project'] || null,
    program: r['Program'] || null,
    tahunProgram: r['Tahun Program'] || null,
    kategori: r['Kategori'] || null,
    lokasi: r['Lokasi'] || null,
    volume: parseNum(r['Volume']),
    unit: r['Unit'] || null,
    sourceLineCount: parseNum(r['Source Line Count']),
    sourceItemCount: parseNum(r['Source Item Count']),
    attributeConflict: r['Attribute Conflict?'] || null,
    conflictFields: r['Conflict Fields'] || null,
  }));

  projectCache = { data: parsedProjectRows, timestamp: now };
  return parsedProjectRows;
}

/**
 * Fetch and parse DASH_FINANCIAL dataset from Google Sheets.
 */
export async function getFinancials(forceRefresh = false): Promise<FinancialRow[]> {
  const now = Date.now();
  if (!forceRefresh && financialCache && (now - financialCache.timestamp < CACHE_TTL_MS)) {
    return financialCache.data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DASH_FINANCIAL`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch DASH_FINANCIAL: ${response.statusText}`);
  }
  const csvText = await response.text();
  const { rows } = parseCSV(csvText);

  const parsedFinancialRows: FinancialRow[] = rows.map((r) => ({
    projectKey: r['Project Key'] || '',
    projectType: r['Project Type'] || null,
    projectBundling: r['Project Bundling'] || null,
    projectCode: r['Project Code'] || null,
    capexBase: parseNum(r['CAPEX Base']),
    capexInflated: parseNum(r['CAPEX Inflated']),
    rab: parseNum(r['RAB']),
    rkapYears: r['RKAP Year(s)'] || null,
    rkap: parseNum(r['RKAP']),
    obYears: r['OB Year(s)'] || null,
    ob: parseNum(r['OB']),
    rna: parseNum(r['RNA']),
    financialSourceLineCount: parseNum(r['Financial Source Line Count']),
    hasFinancialData: r['Has Financial Data?'] || null,
    // Merged-aware display fields
    capexBaseDisplay: parseNum(r['CAPEX Base Display']),
    capexInflatedDisplay: parseNum(r['CAPEX Inflated Display']),
    rabDisplay: parseNum(r['RAB Display']),
    rkapDisplay: parseNum(r['RKAP Display']),
    obDisplay: parseNum(r['OB Display']),
    rnaDisplay: parseNum(r['RNA Display']),
    // Metadata fields
    capexBaseFinancialGroup: r['CAPEX Base Financial Group'] || null,
    capexInflatedFinancialGroup: r['CAPEX Inflated Financial Group'] || null,
    rabFinancialGroup: r['RAB Financial Group'] || null,
    rkapFinancialGroupCount: parseNum(r['RKAP Financial Group Count']),
    obFinancialGroupCount: parseNum(r['OB Financial Group Count']),
    rnaFinancialGroupCount: parseNum(r['RNA Financial Group Count']),
    sharedMonetaryGroupCount: parseNum(r['Shared Monetary Group Count']),
    mergedAwareFinancial: r['Merged-Aware Financial?'] || null,
  }));

  financialCache = { data: parsedFinancialRows, timestamp: now };
  return parsedFinancialRows;
}

/**
 * Fetch and parse DASH_FINANCIAL_GROUP dataset from Google Sheets.
 */
export async function getFinancialGroups(forceRefresh = false): Promise<FinancialGroupRow[]> {
  const now = Date.now();
  if (!forceRefresh && financialGroupCache && (now - financialGroupCache.timestamp < CACHE_TTL_MS)) {
    return financialGroupCache.data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DASH_FINANCIAL_GROUP`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch DASH_FINANCIAL_GROUP: ${response.statusText}`);
  }
  const csvText = await response.text();
  const { rows } = parseCSV(csvText);

  const parsedRows: FinancialGroupRow[] = rows.map((r) => ({
    financialGroupKey: r['Financial Group Key'] || '',
    field: r['Field'] || null,
    aggregationRule: r['Aggregation Rule'] || null,
    groupType: r['Group Type'] || null,
    sourceSheet: r['Source Sheet'] || null,
    sourceReference: r['Source Reference'] || null,
    groupRawValue: parseNum(r['Group Raw Value']),
    projectCountInGroup: parseNum(r['Project Count in Group']),
    crossesMultipleProjectKeys: r['Crosses Multiple Project Keys?'] || null,
    projectKeysSample: r['Project Keys Sample'] || null,
  }));

  financialGroupCache = { data: parsedRows, timestamp: now };
  return parsedRows;
}

/**
 * Fetch and parse DASH_FINANCIAL_PROJECT_GROUP dataset from Google Sheets.
 */
export async function getFinancialProjectGroups(forceRefresh = false): Promise<FinancialProjectGroupRow[]> {
  const now = Date.now();
  if (!forceRefresh && financialProjectGroupCache && (now - financialProjectGroupCache.timestamp < CACHE_TTL_MS)) {
    return financialProjectGroupCache.data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DASH_FINANCIAL_PROJECT_GROUP`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch DASH_FINANCIAL_PROJECT_GROUP: ${response.statusText}`);
  }
  const csvText = await response.text();
  const { rows } = parseCSV(csvText);

  const parsedRows: FinancialProjectGroupRow[] = rows.map((r) => ({
    projectKey: r['Project Key'] || '',
    field: r['Field'] || null,
    aggregationRule: r['Aggregation Rule'] || null,
    financialGroupKey: r['Financial Group Key'] || '',
    groupType: r['Group Type'] || null,
    sourceSheet: r['Source Sheet'] || null,
    sourceReference: r['Source Reference'] || null,
    groupRawValue: parseNum(r['Group Raw Value']),
    firstMappedSourceRow: parseNum(r['First Mapped Source Row']),
    includedForProject: r['Included for Project?'] || null,
    inclusionReason: r['Inclusion Reason'] || null,
    projectCountInGroup: parseNum(r['Project Count in Group']),
    crossesMultipleProjectKeys: r['Crosses Multiple Project Keys?'] || null,
  }));

  financialProjectGroupCache = { data: parsedRows, timestamp: now };
  return parsedRows;
}

/**
 * Fetch and parse DASH_PROCUREMENT dataset from Google Sheets.
 */
export async function getProcurement(forceRefresh = false): Promise<ProcurementRow[]> {
  const now = Date.now();
  if (!forceRefresh && procurementCache && (now - procurementCache.timestamp < CACHE_TTL_MS)) {
    return procurementCache.data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DASH_PROCUREMENT`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch DASH_PROCUREMENT: ${response.statusText}`);
  }
  const csvText = await response.text();
  const { rows } = parseCSV(csvText);

  const parsedProcurementRows: ProcurementRow[] = rows.map((r) => ({
    procurementLineKey: r['Procurement Line Key'] || '',
    projectKey: r['Project Key'] || '',
    projectCode: r['Project Code'] || null,
    projectType: r['Project Type'] || null,
    projectBundling: r['Project Bundling'] || null,
    schedule: r['Schedule'] || null,
    tok: r['TOK'] || null,
    subProject: r['Sub Project'] || null,
    program: r['Program'] || null,
    tahunProgram: r['Tahun Program'] || null,
    kodeBudgetRkap: r['Kode Budget RKAP'] || null,
    kodeBudgetPrPo: r['Kode Budget PR / PO'] || r['Kode Budget PR/PO'] || null,
    description: r['Description'] || null,
    prNumber: r['PR Number'] || null,
    prDate: r['PR Date'] || null,
    prLineValue: parseNum(r['PR Line Value']),
    poNumber: r['PO Number'] || null,
    poDate: r['PO Date'] || null,
    poLineValue: parseNum(r['PO Line Value']),
    relationshipType: r['Relationship Type'] || null,
    sourceSheet: r['Source Sheet'] || null,
    sourceRow: parseNum(r['Source Row']),
    sectionNo: r['Section No'] || null,
    sectionContext: r['Section Context'] || null,
    itemNo: r['Item No'] || null,
    itemKey: r['Item Key'] || null,
    // Merged-aware display fields
    kodeBudgetRkapDisplay: r['Kode Budget RKAP Display'] || null,
    kodeBudgetPrPoDisplay: r['Kode Budget PR/PO Display'] || r['Kode Budget PR / PO Display'] || null,
    descriptionDisplay: r['Description Display'] || null,
    prNumberDisplay: r['PR Number Display'] || null,
    prDateDisplay: r['PR Date Display'] || null,
    prLineValueDisplay: parseNum(r['PR Line Value Display']),
    prValueGroupKey: r['PR Value Group Key'] || null,
    poNumberDisplay: r['PO Number Display'] || null,
    poDateDisplay: r['PO Date Display'] || null,
    poLineValueDisplay: parseNum(r['PO Line Value Display']),
    poValueGroupKey: r['PO Value Group Key'] || null,
    relationshipTypeDisplay: r['Relationship Type Display'] || null,
    mergedAwareProcurement: r['Merged-Aware Procurement?'] || null,
  }));

  procurementCache = { data: parsedProcurementRows, timestamp: now };
  return parsedProcurementRows;
}

/**
 * Fetch and parse DASH_PROCUREMENT_VALUE_GROUP dataset from Google Sheets.
 */
export async function getProcurementValueGroups(forceRefresh = false): Promise<ProcurementValueGroupRow[]> {
  const now = Date.now();
  if (!forceRefresh && procurementValueGroupCache && (now - procurementValueGroupCache.timestamp < CACHE_TTL_MS)) {
    return procurementValueGroupCache.data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DASH_PROCUREMENT_VALUE_GROUP`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch DASH_PROCUREMENT_VALUE_GROUP: ${response.statusText}`);
  }
  const csvText = await response.text();
  const { rows } = parseCSV(csvText);

  const parsedRows: ProcurementValueGroupRow[] = rows.map((r) => ({
    procurementValueGroupKey: r['Procurement Value Group Key'] || '',
    field: r['Field'] || null,
    groupType: r['Group Type'] || null,
    sourceSheet: r['Source Sheet'] || null,
    sourceReference: r['Source Reference'] || null,
    groupRawValue: parseNum(r['Group Raw Value']),
    procurementLineCount: parseNum(r['Procurement Line Count']),
    projectCount: parseNum(r['Project Count']),
    crossesMultipleProjectKeys: r['Crosses Multiple Project Keys?'] || null,
    procurementLinesSample: r['Procurement Lines Sample'] || null,
    projectKeysSample: r['Project Keys Sample'] || null,
  }));

  procurementValueGroupCache = { data: parsedRows, timestamp: now };
  return parsedRows;
}

/**
 * Fetch and parse DASH_PROCUREMENT_LINE_GROUP dataset from Google Sheets.
 */
export async function getProcurementLineGroups(forceRefresh = false): Promise<ProcurementLineGroupRow[]> {
  const now = Date.now();
  if (!forceRefresh && procurementLineGroupCache && (now - procurementLineGroupCache.timestamp < CACHE_TTL_MS)) {
    return procurementLineGroupCache.data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DASH_PROCUREMENT_LINE_GROUP`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch DASH_PROCUREMENT_LINE_GROUP: ${response.statusText}`);
  }
  const csvText = await response.text();
  const { rows } = parseCSV(csvText);

  const parsedRows: ProcurementLineGroupRow[] = rows.map((r) => ({
    procurementLineKey: r['Procurement Line Key'] || '',
    projectKey: r['Project Key'] || '',
    field: r['Field'] || null,
    procurementValueGroupKey: r['Procurement Value Group Key'] || '',
    groupType: r['Group Type'] || null,
    sourceSheet: r['Source Sheet'] || null,
    sourceReference: r['Source Reference'] || null,
    groupRawValue: parseNum(r['Group Raw Value']),
    sourceRow: parseNum(r['Source Row']),
    projectCountInGroup: parseNum(r['Project Count in Group']),
    crossesMultipleProjectKeys: r['Crosses Multiple Project Keys?'] || null,
  }));

  procurementLineGroupCache = { data: parsedRows, timestamp: now };
  return parsedRows;
}

/**
 * Fetch and parse DASH_VOWD dataset from Google Sheets.
 */
export async function getVowd(forceRefresh = false): Promise<VowdRow[]> {
  const now = Date.now();
  if (!forceRefresh && vowdCache && (now - vowdCache.timestamp < CACHE_TTL_MS)) {
    return vowdCache.data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DASH_VOWD`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch DASH_VOWD: ${response.statusText}`);
  }
  const csvText = await response.text();
  const { rows } = parseCSV(csvText);

  const parsedVowdRows: VowdRow[] = rows.map((r) => ({
    projectKey: r['Project Key'] || '',
    projectCode: r['Project Code'] || null,
    projectType: r['Project Type'] || null,
    projectBundling: r['Project Bundling'] || null,
    schedule: r['Schedule'] || null,
    tok: r['TOK'] || null,
    subProject: r['Sub Project'] || null,
    program: r['Program'] || null,
    tahunProgram: r['Tahun Program'] || null,
    year: r['Year'] || '',
    periodStatus: r['Period Status'] || null,
    vowd: parseNum(r['VOWD']),
    sourceLineCount: parseNum(r['Source Line Count']),
    sourceSheetCount: parseNum(r['Source Sheet Count']),
    // Merged-aware fields
    vowdDisplay: parseNum(r['VOWD Display']),
    vowdGroupCount: parseNum(r['VOWD Group Count']),
    sharedVowdGroupCount: parseNum(r['Shared VOWD Group Count']),
    vowdGroupKeys: r['VOWD Group Keys'] || null,
    mergedAwareVowd: r['Merged-Aware VOWD?'] || null,
    displayOnlySharedRow: r['Display-Only Shared Row?'] || null,
  }));

  vowdCache = { data: parsedVowdRows, timestamp: now };
  return parsedVowdRows;
}

/**
 * Fetch and parse DASH_VOWD_GROUP dataset from Google Sheets.
 */
export async function getVowdGroups(forceRefresh = false): Promise<VowdGroupRow[]> {
  const now = Date.now();
  if (!forceRefresh && vowdGroupCache && (now - vowdGroupCache.timestamp < CACHE_TTL_MS)) {
    return vowdGroupCache.data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DASH_VOWD_GROUP`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch DASH_VOWD_GROUP: ${response.statusText}`);
  }
  const csvText = await response.text();
  const { rows } = parseCSV(csvText);

  const parsedRows: VowdGroupRow[] = rows.map((r) => ({
    vowdGroupKey: r['VOWD Group Key'] || '',
    year: r['Year'] || '',
    groupType: r['Group Type'] || null,
    sourceSheet: r['Source Sheet'] || null,
    sourceReference: r['Source Reference'] || null,
    groupRawValue: parseNum(r['Group Raw Value']),
    projectCount: parseNum(r['Project Count']),
    crossesMultipleProjectKeys: r['Crosses Multiple Project Keys?'] || null,
    projectKeysSample: r['Project Keys Sample'] || null,
  }));

  vowdGroupCache = { data: parsedRows, timestamp: now };
  return parsedRows;
}

/**
 * Fetch and parse DASH_VOWD_PROJECT_GROUP dataset from Google Sheets.
 */
export async function getVowdProjectGroups(forceRefresh = false): Promise<VowdProjectGroupRow[]> {
  const now = Date.now();
  if (!forceRefresh && vowdProjectGroupCache && (now - vowdProjectGroupCache.timestamp < CACHE_TTL_MS)) {
    return vowdProjectGroupCache.data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DASH_VOWD_PROJECT_GROUP`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch DASH_VOWD_PROJECT_GROUP: ${response.statusText}`);
  }
  const csvText = await response.text();
  const { rows } = parseCSV(csvText);

  const parsedRows: VowdProjectGroupRow[] = rows.map((r) => ({
    projectKey: r['Project Key'] || '',
    year: r['Year'] || '',
    vowdGroupKey: r['VOWD Group Key'] || '',
    groupType: r['Group Type'] || null,
    sourceSheet: r['Source Sheet'] || null,
    sourceReference: r['Source Reference'] || null,
    groupRawValue: parseNum(r['Group Raw Value']),
    firstMappedSourceRow: parseNum(r['First Mapped Source Row']),
    projectCountInGroup: parseNum(r['Project Count in Group']),
    crossesMultipleProjectKeys: r['Crosses Multiple Project Keys?'] || null,
  }));

  vowdProjectGroupCache = { data: parsedRows, timestamp: now };
  return parsedRows;
}

/**
 * Fast lookup structures for cross-referencing datasets without repeated iterations
 */
export async function getProjectByKeyMap(forceRefresh = false): Promise<Map<string, ProjectRow>> {
  const now = Date.now();
  if (!forceRefresh && projectByKeyMapCache && (now - projectByKeyMapCache.timestamp < CACHE_TTL_MS)) {
    return projectByKeyMapCache.data;
  }
  const projects = await getProjects(forceRefresh);
  const map = new Map<string, ProjectRow>();
  projects.forEach((p) => {
    if (p.projectKey) map.set(p.projectKey, p);
  });
  projectByKeyMapCache = { data: map, timestamp: now };
  return map;
}

export async function getFinancialByProjectKeyMap(forceRefresh = false): Promise<Map<string, FinancialRow>> {
  const now = Date.now();
  if (!forceRefresh && financialByProjectKeyMapCache && (now - financialByProjectKeyMapCache.timestamp < CACHE_TTL_MS)) {
    return financialByProjectKeyMapCache.data;
  }
  const financials = await getFinancials(forceRefresh);
  const map = new Map<string, FinancialRow>();
  financials.forEach((f) => {
    if (f.projectKey) map.set(f.projectKey, f);
  });
  financialByProjectKeyMapCache = { data: map, timestamp: now };
  return map;
}

export async function getProcurementByProjectKeyMap(forceRefresh = false): Promise<Map<string, ProcurementRow[]>> {
  const now = Date.now();
  if (!forceRefresh && procurementByProjectKeyMapCache && (now - procurementByProjectKeyMapCache.timestamp < CACHE_TTL_MS)) {
    return procurementByProjectKeyMapCache.data;
  }
  const procurements = await getProcurement(forceRefresh);
  const map = new Map<string, ProcurementRow[]>();
  procurements.forEach((p) => {
    if (p.projectKey) {
      const existing = map.get(p.projectKey) || [];
      existing.push(p);
      map.set(p.projectKey, existing);
    }
  });
  procurementByProjectKeyMapCache = { data: map, timestamp: now };
  return map;
}

export async function getVowdByProjectKeyMap(forceRefresh = false): Promise<Map<string, VowdRow[]>> {
  const now = Date.now();
  if (!forceRefresh && vowdByProjectKeyMapCache && (now - vowdByProjectKeyMapCache.timestamp < CACHE_TTL_MS)) {
    return vowdByProjectKeyMapCache.data;
  }
  const vowds = await getVowd(forceRefresh);
  const map = new Map<string, VowdRow[]>();
  vowds.forEach((v) => {
    if (v.projectKey) {
      const existing = map.get(v.projectKey) || [];
      existing.push(v);
      map.set(v.projectKey, existing);
    }
  });
  vowdByProjectKeyMapCache = { data: map, timestamp: now };
  return map;
}

/**
 * Run comprehensive validation checks against all 5 master datasets:
 * DASH_CONTROL, DASH_PROJECT, DASH_FINANCIAL, DASH_PROCUREMENT, DASH_VOWD
 */
export async function getValidationData(forceRefresh = false): Promise<ValidationResult> {
  const [
    controlRows,
    projectRows,
    financialRows,
    procurementRows,
    vowdRows,
    financialGroupRows,
    financialProjectGroupRows,
    procurementValueGroupRows,
    procurementLineGroupRows,
    vowdGroupRows,
    vowdProjectGroupRows,
  ] = await Promise.all([
    getControl(forceRefresh),
    getProjects(forceRefresh),
    getFinancials(forceRefresh),
    getProcurement(forceRefresh),
    getVowd(forceRefresh),
    getFinancialGroups(forceRefresh),
    getFinancialProjectGroups(forceRefresh),
    getProcurementValueGroups(forceRefresh),
    getProcurementLineGroups(forceRefresh),
    getVowdGroups(forceRefresh),
    getVowdProjectGroups(forceRefresh),
  ]);

  // Set of valid project keys for orphan checking
  const projectKeySet = new Set<string>();
  projectRows.forEach((p) => {
    if (p.projectKey && p.projectKey.trim() !== '') {
      projectKeySet.add(p.projectKey);
    }
  });

  // 1. DASH_CONTROL checks
  const controlRowCount = controlRows.length;
  const controlPassCount = controlRows.filter((r) => r.controlStatus === 'PASS').length;
  const controlPassWithExceptionCount = controlRows.filter((r) => r.controlStatus === 'PASS WITH KNOWN EXCEPTION').length;
  const controlReviewCount = controlRows.filter((r) => r.controlStatus === 'REVIEW').length;
  const totalRow = controlRows.find((r) => r.projectBundling === 'TOTAL') || null;

  // 2. DASH_PROJECT checks
  const projectRowCount = projectRows.length;
  const projectKeys = projectRows.map((r) => r.projectKey);
  const blankProjectKeys = projectKeys.filter((k) => !k || k.trim() === '').length;

  const keyCounts: Record<string, number> = {};
  projectKeys.forEach((k) => {
    if (k && k.trim() !== '') {
      keyCounts[k] = (keyCounts[k] || 0) + 1;
    }
  });

  const uniqueProjectKeys = Object.keys(keyCounts).length;
  const duplicateProjectKeys = Object.values(keyCounts).filter((cnt) => cnt > 1).length;

  let greenfieldCount = 0;
  let brownfieldCount = 0;
  let invalidProjectTypeCount = 0;

  projectRows.forEach((r) => {
    const pt = r.projectType ? r.projectType.trim() : '';
    if (pt === 'Greenfield') greenfieldCount++;
    else if (pt === 'Brownfield') brownfieldCount++;
    else invalidProjectTypeCount++;
  });

  // 3. DASH_FINANCIAL checks
  const finRowCount = financialRows.length;
  const finUniqueKeys = new Set(financialRows.map((r) => r.projectKey).filter(Boolean)).size;
  const finOrphans = financialRows.filter((r) => r.projectKey && !projectKeySet.has(r.projectKey)).length;
  const projectsWithoutFinData = financialRows.filter((r) => r.hasFinancialData === 'NO').length;
  const projectsWithFinData = finRowCount - projectsWithoutFinData;

  let totalCapexBase = 0;
  let totalCapexInflated = 0;
  let totalRab = 0;
  let totalRkap = 0;
  let totalOb = 0;
  let totalRna = 0;

  financialRows.forEach((r) => {
    totalCapexBase += r.capexBase || 0;
    totalCapexInflated += r.capexInflated || 0;
    totalRab += r.rab || 0;
    totalRkap += r.rkap || 0;
    totalOb += r.ob || 0;
    totalRna += r.rna || 0;
  });

  const finStatus = (finRowCount === 2913 && finUniqueKeys === 2913 && finOrphans === 0 && projectsWithoutFinData === 58)
    ? 'PASS' : 'REVIEW';

  // 4. DASH_PROCUREMENT checks
  const procRowCount = procurementRows.length;
  const procUniqueProjects = new Set(procurementRows.map((r) => r.projectKey).filter(Boolean)).size;
  const procUniquePRs = new Set(procurementRows.map((r) => r.prNumber).filter(Boolean)).size;
  const procUniquePOs = new Set(procurementRows.map((r) => r.poNumber).filter(Boolean)).size;
  const procOrphans = procurementRows.filter((r) => r.projectKey && !projectKeySet.has(r.projectKey)).length;

  let totalPrLineValue = 0;
  let totalPoLineValue = 0;

  procurementRows.forEach((r) => {
    totalPrLineValue += r.prLineValue || 0;
    totalPoLineValue += r.poLineValue || 0;
  });

  const procStatus = (procRowCount === 2843 && procUniqueProjects === 1770 && procUniquePRs === 2117 && procUniquePOs === 2101 && procOrphans === 0)
    ? 'PASS' : 'REVIEW';

  // 5. DASH_VOWD checks
  const vowdRowCount = vowdRows.length;
  const vowdUniqueProjects = new Set(vowdRows.map((r) => r.projectKey).filter(Boolean)).size;
  const vowdOrphans = vowdRows.filter((r) => r.projectKey && !projectKeySet.has(r.projectKey)).length;

  let vowd2023 = 0;
  let vowd2024 = 0;
  let vowd2025 = 0;
  let vowd2026Ytd = 0;
  let totalVowd = 0;

  vowdRows.forEach((r) => {
    const yr = String(r.year).trim();
    const val = r.vowd || 0;
    totalVowd += val;
    if (yr === '2023') vowd2023 += val;
    else if (yr === '2024') vowd2024 += val;
    else if (yr === '2025') vowd2025 += val;
    else if (yr === '2026') vowd2026Ytd += val;
  });

  const vowdStatus = (vowdRowCount >= 1500 && vowdUniqueProjects >= 1200 && vowdOrphans === 0)
    ? 'PASS' : 'REVIEW';

  // Group sheets checks
  const finGroupCount = financialGroupRows.length;
  const finProjGroupCount = financialProjectGroupRows.length;
  const procValGroupCount = procurementValueGroupRows.length;
  const procLineGroupCount = procurementLineGroupRows.length;
  const vowdGroupCount = vowdGroupRows.length;
  const vowdProjGroupCount = vowdProjectGroupRows.length;

  return {
    connectionStatus: 'CONNECTED',
    spreadsheetId: SPREADSHEET_ID,
    dashControl: {
      rows: controlRowCount,
      expectedRows: 7,
      status: controlRowCount === 7 ? 'PASS' : 'REVIEW',
      passCount: controlPassCount,
      passWithExceptionCount: controlPassWithExceptionCount,
      reviewCount: controlReviewCount,
    },
    dashProject: {
      rows: projectRowCount,
      expectedRows: 2913,
      status: projectRowCount === 2913 ? 'PASS' : 'REVIEW',
    },
    projectKeyValidation: {
      uniqueProjectKeys,
      blankProjectKeys,
      duplicateProjectKeys,
      status: (uniqueProjectKeys === 2913 && blankProjectKeys === 0 && duplicateProjectKeys === 0) ? 'PASS' : 'REVIEW',
    },
    projectTypeValidation: {
      greenfieldCount,
      brownfieldCount,
      invalidProjectTypeCount,
      status: invalidProjectTypeCount === 0 ? 'PASS' : 'REVIEW',
    },
    controlValidation: {
      passRows: controlPassCount,
      passWithExceptionRows: controlPassWithExceptionCount,
      reviewRows: controlReviewCount,
      status: controlReviewCount === 0 ? 'PASS' : 'REVIEW',
    },
    dashFinancial: {
      rows: finRowCount,
      expectedRows: 2913,
      uniqueProjectKeys: finUniqueKeys,
      orphanProjectKeys: finOrphans,
      projectsWithFinancialData: projectsWithFinData,
      projectsWithoutFinancialData: projectsWithoutFinData,
      totalCapexBase,
      totalCapexInflated,
      totalRab,
      totalRkap,
      totalOb,
      totalRna,
      status: finStatus,
    },
    dashProcurement: {
      rows: procRowCount,
      expectedRows: 2843,
      uniqueProjects: procUniqueProjects,
      uniquePrNumbers: procUniquePRs,
      uniquePoNumbers: procUniquePOs,
      orphanProjectKeys: procOrphans,
      totalPrLineValue,
      totalPoLineValue,
      status: procStatus,
    },
    dashVowd: {
      rows: vowdRowCount,
      expectedRows: 1544,
      uniqueProjects: vowdUniqueProjects,
      orphanProjectKeys: vowdOrphans,
      vowd2023,
      vowd2024,
      vowd2025,
      vowd2026Ytd,
      totalVowd,
      status: vowdStatus,
    },
    dashFinancialGroup: {
      rows: finGroupCount,
      expectedRows: 8001,
      status: finGroupCount === 8001 ? 'PASS' : 'REVIEW',
    },
    dashFinancialProjectGroup: {
      rows: finProjGroupCount,
      expectedRows: 11009,
      status: finProjGroupCount === 11009 ? 'PASS' : 'REVIEW',
    },
    dashProcurementValueGroup: {
      rows: procValGroupCount,
      expectedRows: 4756,
      status: procValGroupCount === 4756 ? 'PASS' : 'REVIEW',
    },
    dashProcurementLineGroup: {
      rows: procLineGroupCount,
      expectedRows: 4860,
      status: procLineGroupCount === 4860 ? 'PASS' : 'REVIEW',
    },
    dashVowdGroup: {
      rows: vowdGroupCount,
      expectedRows: 1815,
      status: vowdGroupCount === 1815 ? 'PASS' : 'REVIEW',
    },
    dashVowdProjectGroup: {
      rows: vowdProjGroupCount,
      expectedRows: 1852,
      status: vowdProjGroupCount === 1852 ? 'PASS' : 'REVIEW',
    },
    officialTotalValues: totalRow
      ? {
          summaryBase: totalRow.summaryBase,
          summaryInflated: totalRow.summaryInflated,
          summaryRAB: totalRow.summaryRAB,
          summaryRKAP: totalRow.summaryRKAP,
          summaryOB: totalRow.summaryOB,
          summaryPR: totalRow.summaryPR,
          summaryPO: totalRow.summaryPO,
          summaryVOWD: totalRow.summaryVOWD,
          summaryRNA: totalRow.summaryRNA,
        }
      : null,
    totalRow,
    lastRefreshed: new Date().toISOString(),
  };
}

export function clearAllCaches() {
  controlCache = null;
  projectCache = null;
  financialCache = null;
  procurementCache = null;
  vowdCache = null;
  financialGroupCache = null;
  financialProjectGroupCache = null;
  procurementValueGroupCache = null;
  procurementLineGroupCache = null;
  vowdGroupCache = null;
  vowdProjectGroupCache = null;
  projectByKeyMapCache = null;
  financialByProjectKeyMapCache = null;
  procurementByProjectKeyMapCache = null;
  vowdByProjectKeyMapCache = null;
}

export async function getAllData(forceRefresh = false) {
  if (forceRefresh) {
    clearAllCaches();
  }
  const [
    control,
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
  ] = await Promise.all([
    getControl(forceRefresh),
    getProjects(forceRefresh),
    getFinancials(forceRefresh),
    getProcurement(forceRefresh),
    getVowd(forceRefresh),
    getFinancialGroups(forceRefresh),
    getFinancialProjectGroups(forceRefresh),
    getProcurementValueGroups(forceRefresh),
    getProcurementLineGroups(forceRefresh),
    getVowdGroups(forceRefresh),
    getVowdProjectGroups(forceRefresh),
  ]);
  return {
    control,
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
    validationData: await getValidationData(false),
  };
}
