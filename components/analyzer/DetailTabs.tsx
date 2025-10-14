import React, { useState } from 'react';
import { AnalysisResult } from '../../types';
import { SystemInfoTab } from './tabs/SystemInfoTab';
import { EnvironmentTab } from './tabs/EnvironmentTab';
import { ApplicationsTab } from './tabs/ApplicationsTab';
import { ProcessesTab } from './tabs/ProcessesTab';
import { MemoryTab } from './tabs/MemoryTab';
import { ThreadsTab } from './tabs/ThreadsTab';

interface DetailTabsProps {
  result: AnalysisResult;
  analysisType: 'AI' | 'Local';
  onAnalyzeThreads: () => void;
  isAnalyzingThreads: boolean;
  threadError: string | null;
}

const tabs = [
  'System', 'Memory', 'Threads', 'Environment'
];

export const DetailTabs: React.FC<DetailTabsProps> = ({ result, analysisType, onAnalyzeThreads, isAnalyzingThreads, threadError }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const renderContent = () => {
    switch(activeTab) {
      case 'System':
        return <SystemInfoTab data={result.systemInfo} />;
      case 'Environment':
        return <EnvironmentTab data={result.importantEnvVars} />;
      case 'Memory':
          return <MemoryTab data={result.memoryAnalysis} />;
      case 'Threads':
          return <ThreadsTab 
                    data={result.threadAnalysis} 
                    detailedReport={result.detailedThreadReport}
                    analysisType={analysisType}
                    onAnalyzeThreads={onAnalyzeThreads}
                    isAnalyzingThreads={isAnalyzingThreads}
                    threadError={threadError}
                 />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg">
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-1 sm:space-x-4 px-4 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              } whitespace-nowrap py-4 px-1 sm:px-2 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};