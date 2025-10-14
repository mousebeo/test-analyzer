
import React from 'react';
import { EnvironmentVariable } from '../../../types';

interface EnvironmentTabProps {
  data: EnvironmentVariable[];
}

export const EnvironmentTab: React.FC<EnvironmentTabProps> = ({ data }) => {
  return (
    <div className="max-h-96 overflow-y-auto pr-2">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800 sticky top-0">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Variable
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
          {(data || []).map((env, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-400">{env.key}</td>
              <td className="px-6 py-4 whitespace-normal text-sm text-gray-300 font-mono break-all">{env.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
