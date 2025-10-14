import React from 'react';
import { KeyMetric } from '../types';

interface SummaryViewProps {
  summary: string;
  keyMetrics: KeyMetric[];
}

const MetricCard: React.FC<{ metric: KeyMetric }> = ({ metric }) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col justify-between hover:bg-gray-700/50 transition-colors">
    <p className="text-sm text-gray-400">{metric.label}</p>
    <p className="text-2xl font-bold text-cyan-400">{metric.value}</p>
  </div>
);

export const SummaryView: React.FC<SummaryViewProps> = ({ summary, keyMetrics }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <p className="text-gray-300 leading-relaxed">{summary}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(keyMetrics || []).map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
    </div>
  );
};