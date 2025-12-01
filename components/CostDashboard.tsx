import React, { useEffect, useState } from 'react';
import { useSecrets } from '../contexts/SecretsContext';
import { generateCostReport, ProjectScale } from '../services/geminiService';
import { CostReport } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { DollarSign, TrendingUp, PieChart as PieIcon, Lightbulb, Loader2, Settings, Target } from 'lucide-react';

const CostDashboard: React.FC = () => {
  const { projectId } = useSecrets();
  const [data, setData] = useState<CostReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState<ProjectScale>('hobby');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const report = await generateCostReport(projectId || "demo-project", scale);
        setData(report);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [projectId, scale]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Configuration Bar */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Cost Overview</h2>
            <span className="text-slate-500 text-sm px-2 border-l border-slate-600">{projectId || 'No Project Selected'}</span>
         </div>
         
         <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Environment Scale:
            </span>
            <select 
              value={scale}
              onChange={(e) => setScale(e.target.value as ProjectScale)}
              className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
            >
              <option value="hobby">Developer / Hobby (Low Cost)</option>
              <option value="startup">Startup / Production (Medium)</option>
              <option value="enterprise">Enterprise (High Volume)</option>
            </select>
         </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400 bg-slate-800/50 rounded-xl border border-slate-800">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
          <p>Analyzing billing profile for {scale} scale...</p>
        </div>
      ) : data ? (
        <>
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Total Cost */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
              <div className="text-slate-400 text-sm font-medium mb-1">Total Cost (MTD)</div>
              <div className="text-4xl font-bold text-white tracking-tight">
                {data.dailyTrend[0]?.currency === 'EUR' ? '€' : '$'}
                {data.totalMonthToDate.toFixed(2)}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-700 pt-3">
                 <span>Forecasted</span>
                 <span className="font-mono font-medium text-slate-300">
                    {data.dailyTrend[0]?.currency === 'EUR' ? '€' : '$'}
                    {data.projectedEndOfMonth.toFixed(2)}
                 </span>
              </div>
            </div>

            {/* FinOps Score - Mimicking the Screenshot */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Target className="w-24 h-24 text-blue-500" />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text font-bold text-sm uppercase tracking-wider">
                      FinOps Hub
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mb-1">
                     <span className="text-5xl font-bold text-white">{data.finOpsScore?.toFixed(1) || "4.0"}</span>
                     <span className="text-xl text-slate-500 mb-1">/ 5.0</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                     <div 
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-600" 
                        style={{ width: `${((data.finOpsScore || 4) / 5) * 100}%` }}
                     ></div>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">FinOps maturity: <span className="text-emerald-400 font-medium">High</span></div>
               </div>
            </div>

            {/* Trends / Savings */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex flex-col justify-center">
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Potential Savings</div>
                    <div className="text-2xl font-bold text-emerald-400">
                       {data.dailyTrend[0]?.currency === 'EUR' ? '€' : '$'}0.00
                    </div>
                  </div>
               </div>
               <p className="text-xs text-slate-500 mt-3 ml-14">
                 Your environment is highly optimized.
               </p>
            </div>

          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Daily Trend */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm col-span-1 lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-6">Daily Cost Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyTrend}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 10}} tickFormatter={(val) => val.slice(5)} />
                    <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                    <Tooltip 
                      formatter={(value: number) => [`${data.dailyTrend[0]?.currency === 'EUR' ? '€' : '$'}${value.toFixed(2)}`, 'Cost']}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    />
                    <Area type="step" dataKey="cost" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm col-span-1">
              <h3 className="text-lg font-semibold text-white mb-6">Services</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.serviceBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" tick={{fontSize: 10}} hide />
                    <YAxis dataKey="service" type="category" stroke="#94a3b8" width={100} tick={{fontSize: 10}} />
                    <Tooltip 
                      formatter={(value: number) => [`${data.dailyTrend[0]?.currency === 'EUR' ? '€' : '$'}${value.toFixed(2)}`, 'Cost']}
                      cursor={{fill: '#334155', opacity: 0.2}}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    />
                    <Bar dataKey="cost" fill="#6366f1" radius={[0, 4, 4, 0]}>
                      {data.serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white">Cost Analysis</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {data.aiAnalysis}
              </p>
            </div>

            <div className="bg-blue-900/10 rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-blue-100">Optimization Tips</h3>
              </div>
              <ul className="space-y-3">
                {data.optimizationTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-blue-200/80">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default CostDashboard;