
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { SummaryView } from './SummaryView';
import { DetailTabs } from './DetailTabs';
import { ApplicationsTab } from './tabs/ApplicationsTab';
import { SaveToKBButton } from './analyzer/SaveToKBButton';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
  onSaveToKB: () => void;
  isSavingToKB: boolean;
  saveToKBSuccess: boolean;
  saveToKBError: string | null;
}

type MainTab = 'summary' | 'applications';

export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result, onSaveToKB, isSavingToKB, saveToKBSuccess, saveToKBError }) => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('summary');

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveMainTab('summary')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-lg transition-colors ${
              activeMainTab === 'summary'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Analysis Summary
          </button>
          <button
            onClick={() => setActiveMainTab('applications')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-lg transition-colors ${
              activeMainTab === 'applications'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Applications &amp; Processes
          </button>
        </nav>
      </div>

      {activeMainTab === 'summary' && (
        <div className="space-y-8 animate-fade-in">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-indigo-600">
                Overall Health Summary
                <span className="text-sm font-normal text-gray-500">
                  (Local Analysis)
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
            <h2 className="text-2xl font-bold text-indigo-600 mb-4">Detailed System Metrics</h2>
            <DetailTabs result={result} />
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
