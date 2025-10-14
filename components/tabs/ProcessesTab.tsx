import React from 'react';
import { ProcessStats } from '../../types';

interface ProcessesTabProps {
  data: ProcessStats;
}

const StatCard: React.FC<{ label: string; value: number; colorClass: string }> = ({ label, value, colorClass }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg text-center">
        <p className="text-4xl font-bold">{value.toLocaleString()}</p>
        <p className={`text-sm font-medium uppercase mt-1 ${colorClass}`}>{label}</p>
    </div>
);


export const ProcessesTab: React.FC<ProcessesTabProps> = ({ data }) => {
  const stats = data || { totalJobsCreated: 0, totalActiveJobs: 0, totalJobsFaulted: 0 };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Jobs Created" value={stats.totalJobsCreated} colorClass="text-cyan-400" />
        <StatCard label="Active Jobs" value={stats.totalActiveJobs} colorClass="text-yellow-400" />
        <StatCard label="Jobs Faulted" value={stats.totalJobsFaulted} colorClass="text-red-400" />
    </div>
  );
};