import React from 'react';
import { SystemInfo } from '../../types';

interface SystemInfoTabProps {
  data: SystemInfo;
}

const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-700">
        <dt className="text-sm font-medium text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-200 sm:mt-0 sm:col-span-2 font-mono">{value}</dd>
    </div>
);

export const SystemInfoTab: React.FC<SystemInfoTabProps> = ({ data }) => {
  const info = data || { osName: 'N/A', osVersion: '', architecture: 'N/A', totalPhysicalMemory: 'N/A', freePhysicalMemory: 'N/A', cpuLoad: 'N/A', availableProcessors: 0 };
  return (
    <dl>
      <InfoRow label="Operating System" value={`${info.osName} ${info.osVersion}`} />
      <InfoRow label="Architecture" value={info.architecture} />
      <InfoRow label="Available Processors" value={info.availableProcessors} />
      <InfoRow label="Process CPU Load" value={info.cpuLoad} />
      <InfoRow label="Total Physical Memory" value={info.totalPhysicalMemory} />
      <InfoRow label="Free Physical Memory" value={info.freePhysicalMemory} />
    </dl>
  );
};