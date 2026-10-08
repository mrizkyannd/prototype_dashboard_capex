import React from 'react';
import { ProjectItem, RouteId } from '../types';
import { ChevronLeft, Download, FileText } from 'lucide-react';
import { FinancialPositionChart, formatRupiahCompactId } from '../components/detail/FinancialPositionChart';
import { VowdByYearChart } from '../components/detail/VowdByYearChart';
import { BudgetCodeMappingFlow } from '../components/detail/BudgetCodeMappingFlow';
import { useData } from '../context/DataContext';

interface ProjectDetailProps {
  project: ProjectItem;
  onNavigate: (route: RouteId) => void;
}

const hasRealVal = (v?: string | null): v is string =>
  v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '—';

const getVisibleRkapCode = (r: { kodeBudgetRkapDisplay?: string | null; kodeBudgetRkap?: string | null }) => {
  if (hasRealVal(r.kodeBudgetRkapDisplay)) return r.kodeBudgetRkapDisplay;
  if (hasRealVal(r.kodeBudgetRkap)) return r.kodeBudgetRkap;
  return null;
};

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onNavigate }) => {
  const {
    financialByProjectKeyMap,
    procurementByProjectKeyMap,
    vowdByProjectKeyMap,
    loading: isDataLoading,
  } = useData();

  const pKey = project.projectKey;
  const financialRow = financialByProjectKeyMap.get(pKey) || null;
  const procurementData = procurementByProjectKeyMap.get(pKey) || [];
  const vowdData = vowdByProjectKeyMap.get(pKey) || [];
  const isLoading = isDataLoading && !financialRow && procurementData.length === 0;


  const kpiItems = [
    { label: 'CAPEX Base', val: project.capexBase },
    { label: 'CAPEX Inflated', val: project.capexInflated },
    { label: 'RAB', val: project.rab },
    { label: 'RKAP', val: project.rkap },
    { label: 'OB', val: project.ob },
    { label: 'PR', val: project.pr },
    { label: 'PO', val: project.po },
    { label: 'VOWD', val: project.vowd },
    { label: 'RNA', val: project.rna },
  ];

  const displayTableRows = procurementData.length > 0
    ? procurementData.map((r, idx) => ({
        id: r.procurementLineKey || `proc-row-${idx}`,
        rkapBudgetCode: getVisibleRkapCode(r) || '—',
        prPoBudgetCode: r.kodeBudgetPrPo || '—',
        description: r.description || '—',
        prNumber: r.prNumber || '—',
        prDate: r.prDate || '—',
        prValue: r.prLineValue ? formatRupiahCompactId(r.prLineValue) : '—',
        poNumber: r.poNumber || '—',
        poDate: r.poDate || '—',
        poValue: r.poLineValue ? formatRupiahCompactId(r.poLineValue) : '—',
      }))
    : project.procurementRows || [
        {
          id: 'default-row-1',
          rkapBudgetCode: 'BC-2024-A01',
          prPoBudgetCode: 'PR-BC-2024-01',
          description: 'Pengadaan Pipa Utama & Accessories Area 1',
          prNumber: 'PR-445892',
          prDate: '12 Jan 2024',
          prValue: 'Rp 12,5 M',
          poNumber: 'PO-992011',
          poDate: '25 Jan 2024',
          poValue: 'Rp 12,0 M',
        },
      ];

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto w-full">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-[#dde3eb]">
        <div className="flex items-center gap-2 text-[13px]">
          <button
            onClick={() => onNavigate('project-portfolio')}
            className="text-[#5c647a] hover:text-[#004ac6] flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Project Portfolio
          </button>
          <span className="text-[#c3c6d7]">/</span>
          <span className="text-[#004ac6] font-bold">Project Detail</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#c3c6d7] rounded text-[13px] font-semibold text-[#004ac6] hover:bg-[#eef4fc] transition-colors">
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004ac6] text-white rounded text-[13px] font-semibold hover:bg-[#2563eb] transition-colors">
            <FileText className="w-3.5 h-3.5" /> View Contract
          </button>
        </div>
      </div>

      {/* Main Title Banner */}
      <div>
        <h2 className="text-xl font-bold text-[#161c22]">
          {project.subProject} {project.projectBundling}
        </h2>
        {project.projectCode ? (
          <p className="text-[13px] font-mono text-[#737686] italic mt-0.5">
            {project.projectCode}
          </p>
        ) : (
          <p className="text-[13px] text-[#737686] italic mt-0.5">
            No Project Code
          </p>
        )}
      </div>

      {/* Financial Positions KPI Strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {kpiItems.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white border border-[#c3c6d7] rounded-lg p-2.5 shadow-2xs overflow-hidden"
          >
            <div className="text-[10px] font-bold text-[#565e74] uppercase tracking-wider truncate" title={kpi.label}>
              {kpi.label}
            </div>
            <div className="text-[14px] font-bold text-[#004ac6] font-mono mt-1 truncate" title={kpi.val}>
              {kpi.val}
            </div>
          </div>
        ))}
      </div>

      {/* Project Identity & Procurement Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Project Identity */}
        <div className="lg:col-span-8 bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs">
          <h3 className="text-[14px] font-bold text-[#161c22] mb-3 pb-2 border-b border-[#dde3eb]">
            Project Identity
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block mb-0.5">
                Project Code
              </span>
              <span className="font-mono font-semibold text-[#161c22]">
                {project.projectCode || <span className="text-[#737686] italic font-normal">No Project Code</span>}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block mb-0.5">
                Type
              </span>
              <span className="font-semibold text-[#161c22]">{project.projectType}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block mb-0.5">
                Bundling
              </span>
              <span className="font-semibold text-[#161c22]">{project.projectBundling}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block mb-0.5">
                Schedule
              </span>
              <span className="font-semibold text-[#161c22]">{project.schedule}</span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block mb-0.5">
                TOK
              </span>
              <span className="font-semibold text-[#161c22]">{project.tok}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block mb-0.5">
                Sub Project
              </span>
              <span className="font-semibold text-[#161c22]">{project.subProject}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block mb-0.5">
                Program
              </span>
              <span className="font-semibold text-[#161c22]">{project.program}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block mb-0.5">
                Tahun Program
              </span>
              <span className="font-semibold text-[#161c22]">{project.tahunProgram || '2023'}</span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block mb-0.5">
                Volume
              </span>
              <span className="font-mono font-semibold text-[#161c22]">{project.volume || '15,500'}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#565e74] uppercase block mb-0.5">
                Unit
              </span>
              <span className="font-semibold text-[#161c22]">{project.unit || 'Meter'}</span>
            </div>
          </div>
        </div>

        {/* Procurement Summary */}
        <div className="lg:col-span-4 bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-[#161c22] mb-3 pb-2 border-b border-[#dde3eb]">
              Procurement Summary
            </h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#5c647a]">Budget Codes</span>
                <span className="font-mono font-bold text-[#161c22]">{project.numBudgetCodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c647a]">Unique PRs</span>
                <span className="font-mono font-bold text-[#161c22]">{project.numPr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c647a]">Unique POs</span>
                <span className="font-mono font-bold text-[#161c22]">{project.numPo}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#dde3eb] space-y-1.5 text-[12px]">
            <div className="flex justify-between">
              <span className="font-bold text-[#565e74] uppercase">Total PR Value</span>
              <span className="font-mono font-bold text-[#004ac6]">{project.prValue}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-[#565e74] uppercase">Total PO Value</span>
              <span className="font-mono font-bold text-[#004ac6]">{project.poValue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visual 1: Financial Position Comparison */}
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs">
          <h3 className="text-[14px] font-bold text-[#161c22] mb-3">
            Financial Position Comparison
          </h3>
          <FinancialPositionChart
            financialRow={financialRow}
            procurementRows={procurementData}
            vowdRows={vowdData}
            project={project}
          />
        </div>

        {/* Visual 2: VOWD by Year */}
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs">
          <h3 className="text-[14px] font-bold text-[#161c22] mb-3">VOWD by Year</h3>
          <VowdByYearChart vowdRows={vowdData} projectKey={project.projectKey} />
        </div>
      </div>

      {/* Visual 3: Flow Diagram */}
      <div className="bg-white border border-[#c3c6d7] rounded-lg p-4 shadow-2xs">
        <h3 className="text-[14px] font-bold text-[#161c22] mb-3">
          Budget Code to PR/PO Mapping Flow
        </h3>
        <BudgetCodeMappingFlow
          procurementRows={procurementData}
          projectKey={project.projectKey}
        />
      </div>

      {/* Procurement Details Table */}
      <div className="bg-white border border-[#c3c6d7] rounded-lg shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-[#c3c6d7] bg-[#f8fafc] flex justify-between items-center">
          <h3 className="text-[14px] font-bold text-[#161c22]">Procurement Details</h3>
          <span className="text-[12px] font-mono text-[#5c647a]">
            {displayTableRows.length} Line Items
          </span>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#f1f5f9] text-[#565e74] font-bold text-[11px] uppercase tracking-wider border-b border-[#c3c6d7] sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 w-[150px] min-w-[150px]">RKAP Budget Code</th>
                <th className="py-2.5 px-3 w-[150px] min-w-[150px]">PR/PO Budget Code</th>
                <th className="py-2.5 px-3 min-w-[220px]">Description</th>
                <th className="py-2.5 px-3 w-[170px] min-w-[170px]">PR No</th>
                <th className="py-2.5 px-3 text-center w-[110px] min-w-[110px]">PR Date</th>
                <th className="py-2.5 px-3 text-right font-mono w-[130px] min-w-[130px]">PR Value</th>
                <th className="py-2.5 px-3 w-[170px] min-w-[170px]">PO No</th>
                <th className="py-2.5 px-3 text-center w-[110px] min-w-[110px]">PO Date</th>
                <th className="py-2.5 px-3 text-right font-mono w-[130px] min-w-[130px]">PO Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dde3eb]">
              {displayTableRows.map((row) => (
                <tr key={row.id} className="hover:bg-[#f6f9ff] transition-colors h-[38px]">
                  <td className="py-2 px-3 font-mono font-medium text-[#161c22] w-[150px] min-w-[150px] truncate">{row.rkapBudgetCode}</td>
                  <td className="py-2 px-3 font-mono text-[#434655] w-[150px] min-w-[150px] truncate">{row.prPoBudgetCode}</td>
                  <td className="py-2 px-3 text-[#161c22] min-w-[220px] max-w-[300px] truncate" title={row.description}>{row.description}</td>
                  <td className="py-2 px-3 font-mono font-semibold text-[#004ac6] w-[170px] min-w-[170px] truncate">{row.prNumber}</td>
                  <td className="py-2 px-3 text-center text-[#5c647a] w-[110px] min-w-[110px]">{row.prDate}</td>
                  <td className="py-2 px-3 text-right font-mono text-[#161c22] w-[130px] min-w-[130px]">{row.prValue}</td>
                  <td className="py-2 px-3 font-mono font-semibold text-[#004ac6] w-[170px] min-w-[170px] truncate">{row.poNumber}</td>
                  <td className="py-2 px-3 text-center text-[#5c647a] w-[110px] min-w-[110px]">{row.poDate}</td>
                  <td className="py-2 px-3 text-right font-mono text-[#161c22] w-[130px] min-w-[130px]">{row.poValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

