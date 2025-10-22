
import React, { useState } from 'react';
import { AnalysisResult } from '../../types';
import { SummaryView } from './SummaryView';
import { DetailTabs } from './DetailTabs';
import { ApplicationsTab } from './tabs/ApplicationsTab';
// FIX: Import SaveToKBButton to use in the component.
import { SaveToKBButton } from './SaveToKBButton';

// FIX: Updated props to match usage. Removed redundant state handling and added save to KB functionality.
interface AnalysisResultDisplayProps {
  result: AnalysisResult;
  onAnalyzeThreads: () => void;
  isAnalyzingThreads: boolean;
  threadError: string | null;
  onSaveToKB: () => void;
  isSavingToKB: boolean;
  saveToKBSuccess: boolean;
  saveToKBError: string | null;
}

type MainTab = 'summary' | 'applications';

const WelcomeState: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-800 rounded-lg p-8 text-center">
        <span className="text-6xl mb-4">🖥️</span>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to the System Analyzer</h2>
        <p className="text-gray-400 max-w-md">
            Upload your system report files (.txt, .log) and choose your analysis mode. Get an instant local breakdown or enable AI for a deeper, more intelligent analysis.
        </p>
    </div>
);


export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result, onAnalyzeThreads, isAnalyzingThreads, threadError, onSaveToKB, isSavingToKB, saveToKBSuccess, saveToKBError }) => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('summary');

  // FIX: Removed redundant loading, error, and welcome states as they are handled by the parent component.
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
                    {/* FIX: Added wrapper and SaveToKBButton to align with AI view and fix prop error. */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-cyan-400">
                            Overall Health Summary
                            <span className="text-sm font-normal text-gray-500">
                                ({result.analysisType}{result.role ? ` - ${result.role} View` : ''})
                            </span>
                        </h2>
                        <SaveToKBButton
                          onSave={onSaveToKB}
                          isSaving={isSavingToKB}
                          saveSuccess={saveToKBSuccess}
                          saveError={saveToKBError}
                        />
                    </div>
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
