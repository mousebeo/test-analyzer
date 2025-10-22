
import React from 'react';
import { AnalysisResult, ApplicationWarning } from '../../types';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SaveToKBButton } from './SaveToKBButton';

interface AIAnalysisSummaryViewProps {
    result: AnalysisResult;
    onDeeperAnalysis: () => void;
    isAnalyzingDeeper: boolean;
    deeperAnalysisError: string | null;
    onSaveToKB: () => void;
    isSavingToKB: boolean;
    saveToKBSuccess: boolean;
    saveToKBError: string | null;
}

const HealthHighlight: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-700">{text}</p>
    </div>
);

const AreaOfConcern: React.FC<{ concern: ApplicationWarning }> = ({ concern }) => {
    const severityClasses = {
      High: { iconColor: 'text-red-500', textColor: 'text-red-700', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
      Medium: { iconColor: 'text-yellow-500', textColor: 'text-yellow-700', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
      Low: { iconColor: 'text-sky-500', textColor: 'text-sky-700', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    };
    const config = severityClasses[concern.severity] || severityClasses.Low;
    return (
        <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${config.iconColor} mr-2 flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">{config.icon}</svg>
            <p className={config.textColor}>{concern.description}</p>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-2 rounded-md shadow-lg">
          <p className="label text-indigo-600 font-semibold">{`${label}`}</p>
          <p style={{ color: payload[0].fill }} className="text-sm">{`${payload[0].name}: ${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
};

export const AIAnalysisSummaryView: React.FC<AIAnalysisSummaryViewProps> = ({ result, onDeeperAnalysis, isAnalyzingDeeper, deeperAnalysisError, onSaveToKB, isSavingToKB, saveToKBSuccess, saveToKBError }) => {
    const aiSummary = result.aiSummary;

    if (!aiSummary) {
        return <div className="text-center text-gray-500">AI Summary is not available.</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-indigo-600">
                        AI Analysis Summary <span className="text-sm font-normal text-gray-500">({result.role} View)</span>
                    </h2>
                    <SaveToKBButton
                        onSave={onSaveToKB}
                        isSaving={isSavingToKB}
                        saveSuccess={saveToKBSuccess}
                        saveError={saveToKBError}
                    />
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{aiSummary.summary}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Highlights</h3>
                    <div className="space-y-3">
                        {aiSummary.healthHighlights.map((text, i) => <HealthHighlight key={i} text={text} />)}
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas of Concern</h3>
                    <div className="space-y-3">
                        {aiSummary.areasOfConcern.length > 0 ? (
                           aiSummary.areasOfConcern.map((concern, i) => <AreaOfConcern key={i} concern={concern} />)
                        ) : (
                            <p className="text-gray-500 italic">No major concerns identified by AI.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4 text-center">Top 5 Active Processes (by Jobs Created)</h3>
                    {(result.topProcessesByJobs && result.topProcessesByJobs.length > 0) ? (
                        <div style={{height: 300}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={result.topProcessesByJobs} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                                    <YAxis type="category" dataKey="name" stroke="#6b7280" width={150} fontSize={10} interval={0} />
                                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f3f4f6'}} />
                                    <Bar dataKey="created" fill="#4f46e5" name="Jobs Created"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-12">No process data to display.</p>
                    )}
                </div>
                 <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4 text-center">Top 5 Longest Activities (by Max Time)</h3>
                    {(result.topActivitiesByTime && result.topActivitiesByTime.length > 0) ? (
                        <div style={{height: 300}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={result.topActivitiesByTime} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis type="number" stroke="#6b7280" fontSize={12} label={{ value: 'ms', position: 'insideBottomRight', offset: -5, fill: '#6b7280' }}/>
                                    <YAxis type="category" dataKey="name" stroke="#6b7280" width={150} fontSize={10} interval={0} />
                                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f3f4f6'}}/>
                                    <Bar dataKey="maxTime" fill="#ef4444" name="Max Elapsed Time (ms)"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                     ) : (
                        <p className="text-center text-gray-500 py-12">No activity data to display.</p>
                    )}
                </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
                <div className="text-center bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Ready for a Deeper Look?</h3>
                    <p className="text-sm text-gray-500 my-3 max-w-xl mx-auto">
                        Trigger a more comprehensive AI analysis for a detailed narrative, root cause identification, and actionable recommendations.
                    </p>
                    <button
                        onClick={onDeeperAnalysis}
                        disabled={isAnalyzingDeeper}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-2 px-5 rounded-lg transition-colors shadow-md hover:shadow-indigo-500/50 flex items-center justify-center mx-auto"
                    >
                         {isAnalyzingDeeper ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Analyzing...
                            </>
                        ) : 'Get Deeper AI Analysis'}
                    </button>
                    {deeperAnalysisError && (
                        <p className="text-red-600 text-sm mt-3">{deeperAnalysisError}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
