import React from 'react';
import { LogEntry, AnalysisSummary, Severity } from '../types';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';
import { AlertTriangle, CheckCircle, Activity, Server, FileText } from 'lucide-react';

interface DashboardProps {
  logs: LogEntry[];
  report: AnalysisSummary | null;
  onReset: () => void;
}

const COLORS = {
  [Severity.INFO]: '#3b82f6', // blue-500
  [Severity.WARNING]: '#eab308', // yellow-500
  [Severity.ERROR]: '#ef4444', // red-500
  [Severity.CRITICAL]: '#7f1d1d', // red-900
};

const Dashboard: React.FC<DashboardProps> = ({ logs, report, onReset }) => {
  
  // 1. Process Data for Charts
  const severityData = Object.values(Severity).map(sev => ({
    name: sev,
    value: logs.filter(l => l.severity === sev).length
  })).filter(d => d.value > 0);

  const serviceDataRaw: Record<string, number> = {};
  logs.forEach(l => {
    serviceDataRaw[l.service] = (serviceDataRaw[l.service] || 0) + 1;
  });
  const serviceData = Object.keys(serviceDataRaw).map(key => ({
    name: key,
    count: serviceDataRaw[key]
  })).sort((a, b) => b.count - a.count);

  // Simple time bucketing (just by index for demo smoothness, ideally by minute)
  const timeData = logs.map((l, i) => ({
    time: i, 
    severityVal: l.severity === Severity.ERROR || l.severity === Severity.CRITICAL ? 10 : 1
  }));

  const totalErrors = logs.filter(l => [Severity.ERROR, Severity.CRITICAL, Severity.ALERT].includes(l.severity)).length;
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold">Total Logs</p>
              <h3 className="text-2xl font-bold text-white">{logs.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${totalErrors > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold">Errors Detected</p>
              <h3 className={`text-2xl font-bold ${totalErrors > 0 ? 'text-red-400' : 'text-green-400'}`}>{totalErrors}</h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold">Services Active</p>
              <h3 className="text-2xl font-bold text-white">{serviceData.length}</h3>
            </div>
          </div>
        </div>

        <button 
          onClick={onReset}
          className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 shadow-sm transition-colors flex flex-col justify-center items-center group cursor-pointer"
        >
          <span className="text-slate-400 group-hover:text-white font-medium">Upload New Logs</span>
        </button>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Severity Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm col-span-1">
          <h3 className="text-lg font-semibold text-white mb-6">Severity Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as Severity] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {severityData.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[s.name as Severity] || '#94a3b8' }}></span>
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>

        {/* Service Load */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-6">Events by Service</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                <Tooltip 
                   cursor={{fill: '#334155', opacity: 0.2}}
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Report Section */}
      {report && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="bg-indigo-600/10 p-4 border-b border-indigo-500/20 flex items-center gap-2">
            <FileText className="text-indigo-400 w-5 h-5" />
            <h3 className="text-lg font-bold text-indigo-100">AI Analysis Report</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">System Overview</h4>
              <p className="text-slate-200 leading-relaxed">{report.overview}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Critical Issues
                </h4>
                <ul className="space-y-2">
                  {report.criticalIssues.map((issue, idx) => (
                    <li key={idx} className="text-red-200 text-sm flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                      {issue}
                    </li>
                  ))}
                  {report.criticalIssues.length === 0 && <li className="text-slate-500 text-sm">No critical issues detected.</li>}
                </ul>
              </div>

              <div className="bg-emerald-900/10 border border-emerald-900/30 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Recommendations
                </h4>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-emerald-100 text-sm flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                   {report.recommendations.length === 0 && <li className="text-slate-500 text-sm">System appears healthy.</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw Log Viewer (Simplified) */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Recent Logs</h3>
        </div>
        <div className="max-h-96 overflow-y-auto p-0">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900/50 sticky top-0 text-slate-200 font-medium">
              <tr>
                <th className="p-3 w-32">Timestamp</th>
                <th className="p-3 w-24">Severity</th>
                <th className="p-3 w-32">Service</th>
                <th className="p-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-3 whitespace-nowrap font-mono text-xs">{log.timestamp.split('T')[1].split('.')[0]}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      log.severity === Severity.ERROR || log.severity === Severity.CRITICAL ? 'bg-red-500/20 text-red-400' :
                      log.severity === Severity.WARNING ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-300">{log.service}</td>
                  <td className="p-3 text-slate-200">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
