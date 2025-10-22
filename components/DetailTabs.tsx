
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { SystemInfoTab } from './tabs/SystemInfoTab';
import { EnvironmentTab } from './tabs/EnvironmentTab';
import { MemoryTab } from './tabs/MemoryTab';
import { ThreadsTab } from './tabs/ThreadsTab';

interface DetailTabsProps {
  result: AnalysisResult;
}

const tabs = [
  'System', 'Memory', 'Threads', 'Environment'
];

export const DetailTabs: React.FC<DetailTabsProps> = ({ result }) => {
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
                 />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-1 sm:space-x-4 px-4 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
