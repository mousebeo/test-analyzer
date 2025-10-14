import React from 'react';
import { ThreadAnalysis, DetailedThreadReport, ApplicationWarning, ProblematicThread } from '../../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ThreadsTabProps {
  data: ThreadAnalysis;
  detailedReport?: DetailedThreadReport;
  analysisType: 'AI' | 'Local';
  onAnalyzeThreads: () => void;
  isAnalyzingThreads: boolean;
  threadError: string | null;
}

const COLORS = {
    'RUNNABLE': '#2DD4BF',
    'WAITING': '#FBBF24',
    'TIMED_WAITING': '#F87171',
    'BLOCKED': '#F472B6',
    'TERMINATED': '#9CA3AF',
    'NEW': '#A78BFA'
};

const priorityColors: Record<ProblematicThread['priority'], string> = {
    High: 'bg-red-500 text-white',
    Medium: 'bg-yellow-500 text-gray-900',
    Low: 'bg-sky-500 text-white',
};

const ThreadStat: React.FC<{ label: string; value: string | number }> = ({label, value}) => (
    <div className="bg-gray-900/50 p-3 rounded-md text-center">
        <p className="text-2xl font-bold text-cyan-400">{value}</p>
        <p className="text-xs text-gray-400 uppercase">{label}</p>
    </div>
);

const Warning: React.FC<{ warning: ApplicationWarning }> = ({ warning }) => {
    const severityClasses = {
      High: 'bg-red-900/50 border-red-700 text-red-300',
      Medium: 'bg-yellow-900/50 border-yellow-700 text-yellow-300',
      Low: 'bg-sky-900/50 border-sky-700 text-sky-300',
    };
    return (
      <div className={`border-l-4 p-3 rounded-r-md ${severityClasses[warning.severity] || 'bg-gray-700'}`}>
        <p className="font-bold text-sm">{warning.severity} Severity</p>
        <p className="text-sm">{warning.description}</p>
      </div>
    );
};

const DetailedThreadReportView: React.FC<{ report: DetailedThreadReport, analysisType: 'AI' | 'Local' }> = ({ report, analysisType }) => (
    <div className="space-y-6">
        <div>
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">
                Detailed Thread Analysis <span className="text-sm font-normal text-gray-500">({analysisType} Mode)</span>
            </h3>
            <p className="text-sm text-gray-400 italic">{report.summary}</p>
        </div>

        {report.warnings && report.warnings.length > 0 && (
            <div>
                <h4 className="font-semibold text-gray-300 mb-2 text-sm uppercase tracking-wider">Warnings</h4>
                <div className="space-y-2">
                    {report.warnings.map((w, i) => <Warning key={i} warning={w} />)}
                </div>
            </div>
        )}

        {report.problematicThreads && report.problematicThreads.length > 0 && (
            <div>
                <h4 className="font-semibold text-gray-300 mb-2 text-sm uppercase tracking-wider">Problematic Threads</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {report.problematicThreads.map((thread, i) => (
                        <div key={i} className="bg-gray-900/70 p-4 rounded-lg">
                            <p className="font-bold text-gray-200 font-mono flex items-center">
                                {thread.threadName}
                                {thread.priority && (
                                    <span className={`ml-3 px-2 py-0.5 text-xs font-semibold rounded-full ${priorityColors[thread.priority]}`}>
                                        {thread.priority}
                                    </span>
                                )}
                            </p>
                            <p className="text-sm text-gray-400"><span className="font-semibold">State:</span> {thread.state}</p>
                            <p className="text-sm text-gray-400"><span className="font-semibold">Details:</span> {thread.details}</p>
                            {thread.stackTraceSnippet && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-sm text-cyan-500 hover:text-cyan-400">Show Stack Trace Snippet</summary>
                                    <pre className="mt-2 bg-black/50 p-3 rounded text-xs text-gray-300 overflow-x-auto">
                                        <code>{thread.stackTraceSnippet}</code>
                                    </pre>
                                </details>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);


export const ThreadsTab: React.FC<ThreadsTabProps> = ({ data, detailedReport, analysisType, onAnalyzeThreads, isAnalyzingThreads, threadError }) => {
    const threadData = data || { totalThreads: 0, peakThreads: 0, daemonThreads: 0, deadlockedThreads: [], threadStates: [] };
    const chartData = (threadData.threadStates || []).map(ts => ({name: ts.state, value: ts.count}));

  return (
    <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <ThreadStat label="Total Threads" value={threadData.totalThreads}/>
                    <ThreadStat label="Peak Threads" value={threadData.peakThreads}/>
                    <ThreadStat label="Daemon Threads" value={threadData.daemonThreads}/>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-md">
                    <h4 className="font-semibold text-red-400">Deadlocked Threads</h4>
                    {(threadData.deadlockedThreads || []).length > 0 ? (
                        <ul className="list-disc list-inside mt-2 text-red-300">
                            {threadData.deadlockedThreads.map((thread, i) => <li key={i} className="text-sm font-mono">{thread}</li>)}
                        </ul>
                    ) : (
                        <p className="text-green-400 mt-1">None detected.</p>
                    )}
                </div>
            </div>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1F2937',
                                borderColor: '#4B5563'
                            }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
        
        <div className="mt-8 border-t border-gray-700 pt-6">
            {detailedReport && <DetailedThreadReportView report={detailedReport} analysisType={analysisType} />}

            {analysisType === 'AI' && (
                <>
                    {!detailedReport && !isAnalyzingThreads && !threadError && (
                        <div className="text-center bg-gray-900/50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-300">Deeper Thread Analysis Available</h3>
                            <p className="text-sm text-gray-400 my-3 max-w-xl mx-auto">Click the button to perform a detailed analysis of thread dumps, identifying problematic threads and potential bottlenecks.</p>
                            <button
                                onClick={onAnalyzeThreads}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-sky-500/50"
                            >
                                Deep Analyze Threads
                            </button>
                        </div>
                    )}
                    {isAnalyzingThreads && (
                        <div className="flex flex-col items-center justify-center p-4">
                            <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-2 text-gray-300">Performing deep thread analysis...</p>
                        </div>
                    )}
                    {threadError && (
                        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
                            <h4 className="text-red-400 font-bold">Analysis Failed</h4>
                            <p className="text-red-300 text-sm mt-1">{threadError}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
};