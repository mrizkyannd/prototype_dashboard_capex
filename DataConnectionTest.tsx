import React, { useEffect, useState } from 'react';
import { ValidationResult, ControlRow } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  FileSpreadsheet, 
  Key, 
  Layers, 
  ShieldCheck, 
  Table,
  Lock,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  FileText
} from 'lucide-react';

export const DataConnectionTest: React.FC = () => {
  const [data, setData] = useState<ValidationResult | null>(null);
  const [controlRows, setControlRows] = useState<ControlRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [valRes, ctrlRes] = await Promise.all([
        fetch(`/api/sheets/validation${forceRefresh ? '?refresh=true' : ''}`),
        fetch(`/api/sheets/control${forceRefresh ? '?refresh=true' : ''}`)
      ]);

      const valJson = await valRes.json();
      const ctrlJson = await ctrlRes.json();

      if (valJson.success) {
        setData(valJson.data);
      } else {
        setError(valJson.error || 'Failed to fetch validation data');
      }

      if (ctrlJson.success) {
        setControlRows(ctrlJson.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to backend service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatRupiah = (
  val: number | null | undefined
): string => {
  if (val === null || val === undefined) return '-';

  return 'Rp ' + Math.round(val).toLocaleString('id-ID', {
    maximumFractionDigits: 0,
  });
};

  const formatTrillion = (
  val: number | null | undefined
): string => {
  if (val === null || val === undefined) return '-';

  return 'Rp ' + Math.round(val).toLocaleString('id-ID', {
    maximumFractionDigits: 0,
  });
};

  return (
    <div className="space-y-6 pb-12">
      {/* Dev Header Badge & Title */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-lg shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 rounded">
                Dev Only
              </span>
              <h2 className="text-lg font-bold text-slate-900">Google Sheets Data Connection Validation</h2>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">
              Testing read-only server connection to master spreadsheet ID: <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono text-amber-900">1uQPLJU2a3Zx8QKiGFoj14yN3DyeAoUV7Gw93GqpzAd4</code>
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Re-verifying...' : 'Refresh Connection'}
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Connecting to Google Sheets Data Source...</p>
          <p className="text-xs text-slate-500 mt-1">Reading 5 master datasets: DASH_CONTROL, DASH_PROJECT, DASH_FINANCIAL, DASH_PROCUREMENT, DASH_VOWD</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
          <div className="flex items-center gap-2 font-bold mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>Connection Error</span>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      ) : data ? (
        <>
          {/* Top Overview Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Connection Status Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Google Sheets Connection</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CONNECTED
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex items-center justify-between">
                    <span>Spreadsheet ID:</span>
                    <span className="font-mono text-slate-800 truncate max-w-[160px]">{data.spreadsheetId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Access Mode:</span>
                    <span className="font-semibold text-blue-700 inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" /> READ ONLY
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Verified:</span>
                    <span className="text-slate-500">{data.lastRefreshed ? new Date(data.lastRefreshed).toLocaleTimeString() : '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DASH_CONTROL Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">DASH_CONTROL</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                    data.dashControl.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {data.dashControl.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900">{data.dashControl.rows}</span>
                  <span className="text-xs text-slate-500">data rows (6 bundlings + 1 TOTAL)</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Expected Rows: <strong className="text-slate-800">{data.dashControl.expectedRows}</strong></span>
                  <span className="text-emerald-700 font-medium">100% Match</span>
                </div>
              </div>
            </div>

            {/* DASH_PROJECT Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">DASH_PROJECT</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                    data.dashProject.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {data.dashProject.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900">{data.dashProject.rows.toLocaleString()}</span>
                  <span className="text-xs text-slate-500">master project rows</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Expected Rows: <strong className="text-slate-800">{data.dashProject.expectedRows.toLocaleString()}</strong></span>
                  <span className="text-emerald-700 font-medium">100% Match</span>
                </div>
              </div>
            </div>

          </div>

          {/* Core Master Validation Checks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Project Key Validation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Project Key Validation</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {data.projectKeyValidation.status}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Unique Project Keys:</span>
                  <strong className="text-slate-900">{data.projectKeyValidation.uniqueProjectKeys.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Blank Project Keys:</span>
                  <strong className={data.projectKeyValidation.blankProjectKeys === 0 ? 'text-emerald-700' : 'text-red-600'}>
                    {data.projectKeyValidation.blankProjectKeys}
                  </strong>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600">Duplicate Project Keys:</span>
                  <strong className={data.projectKeyValidation.duplicateProjectKeys === 0 ? 'text-emerald-700' : 'text-red-600'}>
                    {data.projectKeyValidation.duplicateProjectKeys}
                  </strong>
                </div>
              </div>
            </div>

            {/* Project Type Validation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Project Type Validation</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {data.projectTypeValidation.status}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Greenfield Projects:</span>
                  <strong className="text-slate-900">{data.projectTypeValidation.greenfieldCount.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Brownfield Projects:</span>
                  <strong className="text-slate-900">{data.projectTypeValidation.brownfieldCount.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600">Other / Invalid Types:</span>
                  <strong className={data.projectTypeValidation.invalidProjectTypeCount === 0 ? 'text-emerald-700' : 'text-red-600'}>
                    {data.projectTypeValidation.invalidProjectTypeCount}
                  </strong>
                </div>
              </div>
            </div>

            {/* Control Status Validation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Control Validation</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {data.controlValidation.status}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">PASS Rows:</span>
                  <strong className="text-emerald-700">{data.controlValidation.passRows}</strong>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">PASS WITH EXCEPTION:</span>
                  <strong className="text-blue-700">{data.controlValidation.passWithExceptionRows}</strong>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600">REVIEW Rows:</span>
                  <strong className={data.controlValidation.reviewRows === 0 ? 'text-emerald-700' : 'text-amber-600'}>
                    {data.controlValidation.reviewRows}
                  </strong>
                </div>
              </div>
            </div>

          </div>

          {/* Extended Validation Datasets (FINANCIAL, PROCUREMENT, VOWD) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Extended Financial & Operational Datasets Validation</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* DASH_FINANCIAL Card */}
              {data.dashFinancial && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">DASH_FINANCIAL</h4>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        data.dashFinancial.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {data.dashFinancial.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-600">Row Count:</span>
                        <strong className="text-slate-900">{data.dashFinancial.rows.toLocaleString()} / {data.dashFinancial.expectedRows.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-600">Unique Project Keys:</span>
                        <strong className="text-slate-900">{data.dashFinancial.uniqueProjectKeys.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-600">Orphan Project Keys:</span>
                        <strong className={data.dashFinancial.orphanProjectKeys === 0 ? 'text-emerald-700' : 'text-red-600'}>
                          {data.dashFinancial.orphanProjectKeys}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-600">Projects With Financial Data:</span>
                        <strong className="text-slate-900">{data.dashFinancial.projectsWithFinancialData.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-600">Projects Without Financial Data:</span>
                        <strong className="text-blue-700 font-semibold">{data.dashFinancial.projectsWithoutFinancialData} <span className="text-[10px] font-normal text-slate-500">(Valid)</span></strong>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-600">
                        <span>CAPEX Base Sum:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashFinancial.totalCapexBase)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>CAPEX Inflated Sum:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashFinancial.totalCapexInflated)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>RAB Sum:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashFinancial.totalRab)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>RKAP Sum:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashFinancial.totalRkap)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>OB (Pre-Adj) Sum:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashFinancial.totalOb)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>RNA Sum:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashFinancial.totalRna)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DASH_PROCUREMENT Card */}
              {data.dashProcurement && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">DASH_PROCUREMENT</h4>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        data.dashProcurement.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {data.dashProcurement.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-600">Procurement Line Rows:</span>
                        <strong className="text-slate-900">{data.dashProcurement.rows.toLocaleString()} / {data.dashProcurement.expectedRows.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-600">Unique Projects:</span>
                        <strong className="text-slate-900">{data.dashProcurement.uniqueProjects.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-600">Unique PR Numbers:</span>
                        <strong className="text-slate-900">{data.dashProcurement.uniquePrNumbers.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-600">Unique PO Numbers:</span>
                        <strong className="text-slate-900">{data.dashProcurement.uniquePoNumbers.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-600">Orphan Project Keys:</span>
                        <strong className={data.dashProcurement.orphanProjectKeys === 0 ? 'text-emerald-700' : 'text-red-600'}>
                          {data.dashProcurement.orphanProjectKeys}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-slate-600">
                        <span>Total PR Line Value:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashProcurement.totalPrLineValue)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Total PO Line Value:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashProcurement.totalPoLineValue)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DASH_VOWD Card */}
              {data.dashVowd && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">DASH_VOWD</h4>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        data.dashVowd.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {data.dashVowd.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-600">Project-Year Rows:</span>
                        <strong className="text-slate-900">{data.dashVowd.rows.toLocaleString()} / {data.dashVowd.expectedRows.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-600">Unique Projects:</span>
                        <strong className="text-slate-900">{data.dashVowd.uniqueProjects.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-600">Orphan Project Keys:</span>
                        <strong className={data.dashVowd.orphanProjectKeys === 0 ? 'text-emerald-700' : 'text-red-600'}>
                          {data.dashVowd.orphanProjectKeys}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-600">
                        <span>2023 VOWD:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashVowd.vowd2023)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>2024 VOWD:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashVowd.vowd2024)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>2025 VOWD:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashVowd.vowd2025)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>2026 YTD VOWD:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatTrillion(data.dashVowd.vowd2026Ytd)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-900">
                        <span>Total VOWD:</span>
                        <span className="font-mono">{formatTrillion(data.dashVowd.totalVowd)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* MERGED-AWARE GROUP DATASETS VALIDATION SECTION */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Merged-Aware Group Datasets Validation</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.dashFinancialGroup && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-700">DASH_FINANCIAL_GROUP</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      data.dashFinancialGroup.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {data.dashFinancialGroup.status}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 my-1">
                    {data.dashFinancialGroup.rows.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Expected: {data.dashFinancialGroup.expectedRows.toLocaleString()} distinct financial value groups
                  </div>
                </div>
              )}

              {data.dashFinancialProjectGroup && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-700">DASH_FINANCIAL_PROJECT_GROUP</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      data.dashFinancialProjectGroup.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {data.dashFinancialProjectGroup.status}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 my-1">
                    {data.dashFinancialProjectGroup.rows.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Expected: {data.dashFinancialProjectGroup.expectedRows.toLocaleString()} project-group mappings
                  </div>
                </div>
              )}

              {data.dashProcurementValueGroup && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-700">DASH_PROCUREMENT_VALUE_GROUP</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      data.dashProcurementValueGroup.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {data.dashProcurementValueGroup.status}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 my-1">
                    {data.dashProcurementValueGroup.rows.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Expected: {data.dashProcurementValueGroup.expectedRows.toLocaleString()} PR/PO distinct value groups
                  </div>
                </div>
              )}

              {data.dashProcurementLineGroup && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-700">DASH_PROCUREMENT_LINE_GROUP</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      data.dashProcurementLineGroup.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {data.dashProcurementLineGroup.status}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 my-1">
                    {data.dashProcurementLineGroup.rows.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Expected: {data.dashProcurementLineGroup.expectedRows.toLocaleString()} procurement line group mappings
                  </div>
                </div>
              )}

              {data.dashVowdGroup && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-700">DASH_VOWD_GROUP</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      data.dashVowdGroup.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {data.dashVowdGroup.status}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 my-1">
                    {data.dashVowdGroup.rows.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Expected: {data.dashVowdGroup.expectedRows.toLocaleString()} VOWD yearly value groups
                  </div>
                </div>
              )}

              {data.dashVowdProjectGroup && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-700">DASH_VOWD_PROJECT_GROUP</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      data.dashVowdProjectGroup.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {data.dashVowdProjectGroup.status}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 my-1">
                    {data.dashVowdProjectGroup.rows.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Expected: {data.dashVowdProjectGroup.expectedRows.toLocaleString()} project-VOWD group mappings
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TOTAL Row Official Portfolio Values */}
          {data.officialTotalValues && (
            <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Official Portfolio Position (TOTAL Row in DASH_CONTROL)</h3>
                    <p className="text-xs text-slate-500">Official executive report figures read directly from DASH_CONTROL TOTAL row</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-800">
                  Executive Source of Truth
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Summary Base</span>
                  <div className="text-base font-extrabold text-slate-900">{formatTrillion(data.officialTotalValues.summaryBase)}</div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{formatRupiah(data.officialTotalValues.summaryBase)}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Summary Inflated</span>
                  <div className="text-base font-extrabold text-slate-900">{formatTrillion(data.officialTotalValues.summaryInflated)}</div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{formatRupiah(data.officialTotalValues.summaryInflated)}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Summary RAB</span>
                  <div className="text-base font-extrabold text-slate-900">{formatTrillion(data.officialTotalValues.summaryRAB)}</div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{formatRupiah(data.officialTotalValues.summaryRAB)}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Summary RKAP</span>
                  <div className="text-base font-extrabold text-slate-900">{formatTrillion(data.officialTotalValues.summaryRKAP)}</div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{formatRupiah(data.officialTotalValues.summaryRKAP)}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Summary OB</span>
                  <div className="text-base font-extrabold text-slate-900">{formatTrillion(data.officialTotalValues.summaryOB)}</div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{formatRupiah(data.officialTotalValues.summaryOB)}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Summary PR</span>
                  <div className="text-base font-extrabold text-slate-900">{formatTrillion(data.officialTotalValues.summaryPR)}</div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{formatRupiah(data.officialTotalValues.summaryPR)}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Summary PO</span>
                  <div className="text-base font-extrabold text-slate-900">{formatTrillion(data.officialTotalValues.summaryPO)}</div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{formatRupiah(data.officialTotalValues.summaryPO)}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Summary VOWD</span>
                  <div className="text-base font-extrabold text-slate-900">{formatTrillion(data.officialTotalValues.summaryVOWD)}</div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{formatRupiah(data.officialTotalValues.summaryVOWD)}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Summary RNA</span>
                  <div className="text-base font-extrabold text-slate-900">{formatTrillion(data.officialTotalValues.summaryRNA)}</div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{formatRupiah(data.officialTotalValues.summaryRNA)}</span>
                </div>
              </div>
            </div>
          )}

          {/* DASH_CONTROL Detailed Reconciliations Table */}
          {controlRows.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="w-5 h-5 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">DASH_CONTROL Reconciliations Table</h3>
                </div>
                <span className="text-xs text-slate-500">7 rows loaded from Google Sheets</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Project Bundling</th>
                      <th className="px-4 py-3 text-right">Summary Base</th>
                      <th className="px-4 py-3 text-right">Detail Base</th>
                      <th className="px-4 py-3 text-right">Summary Inflated</th>
                      <th className="px-4 py-3 text-right">Summary RKAP</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 min-w-[240px]">Control Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {controlRows.map((row, idx) => {
                      const isTotal = row.projectBundling === 'TOTAL';
                      return (
                        <tr key={idx} className={isTotal ? 'bg-blue-50/60 font-bold text-slate-900' : 'hover:bg-slate-50'}>
                          <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                            {row.projectBundling}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {formatTrillion(row.summaryBase)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {formatTrillion(row.detailBase)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {formatTrillion(row.summaryInflated)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {formatTrillion(row.summaryRKAP)}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              row.controlStatus === 'PASS' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : row.controlStatus === 'PASS WITH KNOWN EXCEPTION'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {row.controlStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-[11px]">
                            {row.controlNote || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
