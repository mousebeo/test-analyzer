import React from 'react';
import { AnalysisResult } from '../types';
import { SummaryView } from './SummaryView';
import { DetailTabs } from './DetailTabs';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
}

export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">
            Analysis Summary
            <span className="text-sm font-normal text-gray-500">
                (Local Analysis)
            </span>
        </h2>
        <SummaryView summary={result.summary} keyMetrics={result.keyMetrics} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Detailed Breakdown</h2>
        <DetailTabs result={result} />
      </div>
    </div>
  );
};