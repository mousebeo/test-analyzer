import React, { useState } from 'react';
import { AnalysisResult } from '../../types';
import { SummaryView } from './SummaryView';
import { DetailTabs } from './DetailTabs';
import { ApplicationsTab } from './tabs/ApplicationsTab';

interface AnalysisResultDisplayProps {
  isLoading: boolean;
  error: string | null;
  result: AnalysisResult | null;
  onAnalyzeThreads: () => void;
  isAnalyzingThreads: boolean;
  threadError: string | null;
}

type MainTab = 'summary' | 'applications';

const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-800/50 rounded-lg p-8">
    <svg className="animate-spin h-12 w-12 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="mt-4 text-lg font-semibold text-gray-300">Analyzing your reports...</p>
    <p className="text-gray-400">This may take a moment.</p>
  </div>
);

const WelcomeState: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-800 rounded-lg p-8 text-center">
        <span className="text-6xl mb-4">🖥️</span>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to the System Analyzer</h2>
        <p className="text-gray-400 max-w-md">
            Upload your system report files (.txt, .log) and choose your analysis mode. Get an instant local breakdown or enable AI for a deeper, more intelligent analysis.
        </p>
    </div>
);


const ErrorState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full bg-red-900/20 border border-red-500 rounded-lg p-8 text-center">
         <span className="text-5xl mb-4">⚠️</span>
        <h3 className="text-xl font-bold text-red-400 mb-2">Analysis Failed</h3>
        <p className="text-red-300">{message}</p>
    </div>
);


export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ isLoading, error, result, onAnalyzeThreads, isAnalyzingThreads, threadError }) => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('summary');

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }
  
  if (!result) {
      return <WelcomeState />;
  }

  return (
    <div className="space-y-6">
        <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-6">
                <button
                    onClick={() => setActiveMainTab('summary')}
                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-lg transition-colors ${
                        activeMainTab === 'summary'
                        ? 'border-cyan-500 text-cyan-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Analysis Summary
                </button>
                <button
                    onClick={() => setActiveMainTab('applications')}
                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-lg transition-colors ${
                        activeMainTab === 'applications'
                        ? 'border-cyan-500 text-cyan-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Applications & Processes
                </button>
            </nav>
        </div>

        {activeMainTab === 'summary' && (
            <div className="space-y-8 animate-fade-in">
                <div>
                    <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                        Overall Health Summary
                        <span className="text-sm font-normal text-gray-500">
                            ({result.analysisType}{result.role ? ` - ${result.role} View` : ''})
                        </span>
                    </h2>
                    <SummaryView summary={result.summary} keyMetrics={result.keyMetrics} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-cyan-400 mb-4">Detailed System Metrics</h2>
                    <DetailTabs 
                        result={result}
                        analysisType={result.analysisType}
                        onAnalyzeThreads={onAnalyzeThreads}
                        isAnalyzingThreads={isAnalyzingThreads}
                        threadError={threadError}
                    />
                </div>
            </div>
        )}
        
        {activeMainTab === 'applications' && (
             <div className="animate-fade-in">
                <ApplicationsTab 
                    applications={result.applications}
                    processStats={result.processStats}
                    detailedReports={result.detailedApplicationReports}
                />
            </div>
        )}
    </div>
  );
};