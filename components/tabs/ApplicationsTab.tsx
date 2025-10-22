
import React, { useState } from 'react';
import { Application, DetailedApplicationReport, Process, Activity, ApplicationWarning, ProcessStats, ChartDataPoint } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';


interface ApplicationsTabProps {
  applications: Application[];
  processStats: ProcessStats;
  detailedReports?: DetailedApplicationReport[];
}

const StatCard: React.FC<{ label: string; value: number; colorClass: string }> = ({ label, value, colorClass }) => (
    <div className="bg-white border border-gray-200 p-4 rounded-lg text-center shadow-md">
        <p className={`text-4xl font-bold ${colorClass}`}>{value.toLocaleString()}</p>
        <p className="text-sm font-medium uppercase mt-1 text-gray-500">{label}</p>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-2 rounded-md shadow-lg">
          <p className="label text-indigo-600 font-semibold">{`${label}`}</p>
          {payload.map((pld: any) => (
             <p key={pld.dataKey} style={{ color: pld.color || pld.fill }} className="text-sm">{`${pld.name}: ${pld.value.toLocaleString()}`}</p>
          ))}
        </div>
      );
    }
    return null;
};

const OnDemandChart: React.FC<{ chartData: { headers: string[]; points: ChartDataPoint[] } }> = ({ chartData }) => {
    const colors = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
    const headers = chartData.headers.slice(1); // Exclude date

    return (
        <div className="bg-gray-50/50 p-4" style={{height: 250}}>
            <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData.points} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                        dataKey="date" 
                        stroke="#6b7280" 
                        tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()}
                        fontSize={12}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {headers.map((header, index) => (
                         <Line 
                            key={header}
                            type="monotone" 
                            dataKey={header.toLowerCase().replace(/\s/g, '_')} 
                            name={header}
                            stroke={colors[index % colors.length]} 
                            strokeWidth={2}
                            dot={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
};


const ActivityTable: React.FC<{ activities: Activity[] }> = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return <p className="text-sm text-gray-500 px-3 py-2 italic">No activities recorded for this process.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Activity Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Executed</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Faulted</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Elapsed (Recent/Min/Max) ms</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {activities.map((activity, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-gray-800 font-medium">{activity.name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-600">{activity.status}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 font-mono text-right">{activity.executed.toLocaleString()}</td>
                            <td className={`px-3 py-2 whitespace-nowrap font-mono text-right ${activity.faulted > 0 ? 'text-red-600' : 'text-gray-600'}`}>{activity.faulted.toLocaleString()}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 font-mono text-right">
                                {activity.recentElapsedTime} / {activity.minElapsedTime} / {activity.maxElapsedTime}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ProcessDetails: React.FC<{ processes: Process[] }> = ({ processes }) => {
    if (!processes || processes.length === 0) {
        return <p className="text-sm text-gray-500 px-4 py-2 italic">No processes recorded for this application.</p>;
    }
    return (
        <div className="space-y-2">
            <h4 className="font-semibold text-gray-600 mb-2 text-sm uppercase tracking-wider">Processes</h4>
            {processes.map(process => (
                <details key={process.name} className="bg-gray-100 rounded-md overflow-hidden">
                    <summary className="px-4 py-3 cursor-pointer hover:bg-gray-200 flex justify-between items-center">
                        <div className="flex items-center">
                            <span className="font-semibold text-gray-800">{process.name}</span>
                             {process.chartData && (
                                <details className="relative ml-4">
                                    <summary className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md cursor-pointer hover:bg-indigo-200">Show Chart</summary>
                                    <div className="absolute z-10 mt-2 w-96 md:w-[600px] bg-white border border-gray-200 rounded-lg shadow-xl p-2 left-0">
                                         <OnDemandChart chartData={process.chartData} />
                                    </div>
                                </details>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 space-x-4 flex-shrink-0">
                            <span>Created: <span className="font-mono">{process.created.toLocaleString()}</span></span>
                            <span>Completed: <span className="font-mono">{process.completed.toLocaleString()}</span></span>
                            <span className={process.faulted > 0 ? 'text-red-600' : ''}>Faulted: <span className="font-mono">{process.faulted.toLocaleString()}</span></span>
                        </div>
                    </summary>
                    <div className="border-t border-gray-200 bg-white">
                        <ActivityTable activities={process.activities} />
                    </div>
                </details>
            ))}
        </div>
    );
};


const Warning: React.FC<{ warning: ApplicationWarning }> = ({ warning }) => {
  const severityClasses = {
    High: 'bg-red-50 border-red-300 text-red-700',
    Medium: 'bg-yellow-50 border-yellow-300 text-yellow-700',
    Low: 'bg-sky-50 border-sky-300 text-sky-700',
  };
  return (
    <div className={`border-l-4 p-3 rounded-r-md ${severityClasses[warning.severity] || 'bg-gray-100'}`}>
      <p className="font-bold text-sm">{warning.severity} Severity</p>
      <p className="text-sm">{warning.description}</p>
    </div>
  );
};

const DetailedAppReportView: React.FC<{ report: DetailedApplicationReport }> = ({ report }) => (
    <div className="mt-6 border-t border-gray-200 pt-4 space-y-4">
        <h4 className="font-semibold text-gray-600 mb-2 text-sm uppercase tracking-wider">AI-Powered Analysis</h4>
        <div>
            <h5 className="font-semibold text-gray-500 mb-2">Performance Summary</h5>
            <p className="text-sm text-gray-600 italic">{report.performanceSummary}</p>
        </div>

        {report.warnings && report.warnings.length > 0 && (
            <div>
                <h5 className="font-semibold text-gray-500 mb-2">Warnings & Risks</h5>
                <div className="space-y-2">
                    {report.warnings.map((w, i) => <Warning key={i} warning={w} />)}
                </div>
            </div>
        )}

        {report.serviceCalls && report.serviceCalls.length > 0 && (
            <div>
                <h5 className="font-semibold text-gray-500 mb-2">Service Call Metrics</h5>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Calls</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Latency</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error Rate</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {report.serviceCalls.map((sc, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{sc.serviceName}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-mono text-center">{sc.callCount}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-mono">{sc.averageLatency}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-mono">{sc.errorRate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
);


export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ applications, processStats, detailedReports }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'details'>('dashboard');
  const stats = processStats || { totalJobsCreated: 0, totalActiveJobs: 0, totalJobsFaulted: 0 };
  const mainAppChartData = (applications || []).find(app => app.chartData)?.chartData;
  const topProcesses = (applications || []).flatMap(app => app.processes)
      .sort((a, b) => b.created - a.created).slice(0, 5)
      .map(p => ({ name: p.name, created: p.created }));
  const topActivities = (applications || []).flatMap(app => app.processes.flatMap(p => p.activities.map(a => ({...a, processName: p.name}))))
      .sort((a, b) => b.maxElapsedTime - a.maxElapsedTime).slice(0, 5)
      .map(a => ({ name: a.name, process: a.processName, maxTime: a.maxElapsedTime }));
  
  return (
    <div className="space-y-6">
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-base transition-colors ${
                        activeTab === 'dashboard'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Overview Dashboard
                </button>
                <button
                    onClick={() => setActiveTab('details')}
                    className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-base transition-colors ${
                        activeTab === 'details'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Detailed Breakdown
                </button>
            </nav>
        </div>
        
        {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Overall Job Statistics</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard label="Total Jobs Created" value={stats.totalJobsCreated} colorClass="text-indigo-600" />
                        <StatCard label="Total Active Jobs" value={stats.totalActiveJobs} colorClass="text-yellow-500" />
                        <StatCard label="Total Jobs Faulted" value={stats.totalJobsFaulted} colorClass="text-red-600" />
                    </div>
                </div>
                {mainAppChartData && (
                     <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-gray-900 mb-4">Application Job Status Over Time</h3>
                        <OnDemandChart chartData={mainAppChartData} />
                    </div>
                )}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-gray-900 mb-4">Top 5 Most Active Processes (by Jobs Created)</h3>
                         <div style={{height: 300}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProcesses} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                                    <YAxis type="category" dataKey="name" stroke="#6b7280" width={150} fontSize={10} interval={0} />
                                    <Tooltip content={<CustomTooltip />}/>
                                    <Bar dataKey="created" fill="#4f46e5" name="Jobs Created"/>
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-gray-900 mb-4">Top 5 Longest Running Activities (by Max Time)</h3>
                         <div style={{height: 300}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topActivities} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis type="number" stroke="#6b7280" fontSize={12} domain={[0, 'dataMax + 100']} label={{ value: 'ms', position: 'insideBottomRight', offset: -5, fill: '#6b7280' }}/>
                                    <YAxis type="category" dataKey="name" stroke="#6b7280" width={150} fontSize={10} interval={0} />
                                    <Tooltip content={<CustomTooltip />}/>
                                    <Bar dataKey="maxTime" fill="#ef4444" name="Max Elapsed Time (ms)"/>
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                 </div>
            </div>
        )}

        {activeTab === 'details' && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Application & Process Details</h2>
            {(applications || []).map((app, index) => {
                const matchingReport = detailedReports?.find(report => report.applicationName === app.name);
                const state = (app.state || "Unknown").toLowerCase();
                const isHealthy = state === 'running' || state === 'idle' || state === 'completed' || state === 'unknown';
                return (
                    <details key={index} className="bg-gray-50 rounded-lg overflow-hidden" open={applications.length < 3}>
                        <summary className="p-4 cursor-pointer hover:bg-gray-100 flex justify-between items-center">
                            <div className="flex items-center">
                                <h3 className="text-lg font-semibold text-indigo-600">{app.name}</h3>
                                {app.chartData && (
                                    <details className="relative ml-4">
                                        <summary className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md cursor-pointer hover:bg-indigo-200">Show Chart</summary>
                                        <div className="absolute z-10 mt-2 w-96 md:w-[600px] bg-white border border-gray-200 rounded-lg shadow-xl p-2 left-0">
                                            <OnDemandChart chartData={app.chartData} />
                                        </div>
                                    </details>
                                )}
                            </div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {app.state}
                            </span>
                        </summary>
                        <div className="p-4 border-t border-gray-200 space-y-4">
                        <ProcessDetails processes={app.processes} />
                        {matchingReport && <DetailedAppReportView report={matchingReport} />}
                        </div>
                    </details>
                )
            })}
            {(!applications || applications.length === 0) && (
                    <p className="text-center text-gray-500 py-4">No application data found in the report.</p>
            )}
            </div>
        )}
    </div>
  );
};
