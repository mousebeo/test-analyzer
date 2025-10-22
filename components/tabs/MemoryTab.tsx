
import React from 'react';
import { MemoryAnalysis, MemoryUsage } from '../../types';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MemoryTabProps {
  data: MemoryAnalysis;
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-2 rounded-md shadow-lg">
          <p className="label text-indigo-600">{`${label}`}</p>
          {payload.map((pld: any) => (
             <p key={pld.dataKey} style={{ color: pld.fill }}>{`${pld.name}: ${formatBytes(pld.value)}`}</p>
          ))}
        </div>
      );
    }
    return null;
};

export const MemoryTab: React.FC<MemoryTabProps> = ({ data }) => {
    const heapData = data?.heap || { used: 0, committed: 0, max: 0, init: 0 };
    const nonHeapData = data?.nonHeap || { used: 0, committed: 0, max: 0, init: 0 };

    const chartData = [
        {
            name: 'Heap',
            used: heapData.used,
            committed: heapData.committed,
            max: heapData.max,
        },
        {
            name: 'Non-Heap',
            used: nonHeapData.used,
            committed: nonHeapData.committed,
            max: nonHeapData.max,
        }
    ];

  return (
    <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
            <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280"/>
                <YAxis stroke="#6b7280" tickFormatter={formatBytes} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="used" fill="#10B981" name="Used"/>
                <Bar dataKey="committed" fill="#3B82F6" name="Committed" />
                <Bar dataKey="max" fill="#818CF8" name="Max"/>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};
