
import React from 'react';
import { KeyMetric } from '../types';

interface SummaryViewProps {
  summary: string;
  keyMetrics: KeyMetric[];
}

const MetricCard: React.FC<{ metric: KeyMetric }> = ({ metric }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between hover:bg-gray-50 transition-colors border border-gray-200">
    <p className="text-sm text-gray-500">{metric.label}</p>
    <p className="text-2xl font-bold text-indigo-600">{metric.value}</p>
  </div>
);

export const SummaryView: React.FC<SummaryViewProps> = ({ summary, keyMetrics }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <p className="text-gray-700 leading-relaxed">{summary}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(keyMetrics || []).map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
    </div>
  );
};
