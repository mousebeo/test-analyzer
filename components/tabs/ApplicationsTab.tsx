import React from 'react';
import { Application, DetailedApplicationReport, Process, Activity } from '../../types';

interface ApplicationsTabProps {
  data: Application[];
  detailedReports?: DetailedApplicationReport[];
}

const ActivityTable: React.FC<{ activities: Activity[] }> = ({ activities }) => {
    if (activities.length === 0) {
        return <p className="text-sm text-gray-500 px-3 py-2">No activities recorded for this process.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
                <thead className="bg-gray-700/50">
                    <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-400">Activity Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-400">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-400">Executed</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-400">Faulted</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-400">Elapsed (Recent/Min/Max) ms</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {activities.map((activity, i) => (
                        <tr key={i} className="hover:bg-gray-700/30">
                            <td className="px-3 py-2 whitespace-nowrap text-gray-300 font-medium">{activity.name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-400">{activity.status}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-400 font-mono">{activity.executed.toLocaleString()}</td>
                            <td className={`px-3 py-2 whitespace-nowrap font-mono ${activity.faulted > 0 ? 'text-red-400' : 'text-gray-400'}`}>{activity.faulted.toLocaleString()}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-400 font-mono">
                                {activity.recentElapsedTime} / {activity.minElapsedTime} / {activity.maxElapsedTime}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ProcessDetails: React.FC<{ processes: Process[] }> = ({ processes }) => {
    if (processes.length === 0) {
        return <p className="text-sm text-gray-500 px-4 py-2">No processes recorded for this application.</p>;
    }
    return (
        <div className="space-y-2">
            {processes.map(process => (
                <details key={process.name} className="bg-gray-800 rounded-md overflow-hidden">
                    <summary className="px-4 py-3 cursor-pointer hover:bg-gray-700/50 flex justify-between items-center">
                        <span className="font-semibold text-gray-200">{process.name}</span>
                        <div className="text-xs text-gray-400 space-x-4">
                            <span>Created: <span className="font-mono">{process.created.toLocaleString()}</span></span>
                            <span>Completed: <span className="font-mono">{process.completed.toLocaleString()}</span></span>
                            <span className={process.faulted > 0 ? 'text-red-400' : ''}>Faulted: <span className="font-mono">{process.faulted.toLocaleString()}</span></span>
                        </div>
                    </summary>
                    <div className="border-t border-gray-700 bg-gray-900/50">
                        <ActivityTable activities={process.activities} />
                    </div>
                </details>
            ))}
        </div>
    );
};


export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ data, detailedReports }) => {
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {(data || []).map((app, index) => {
         return (
            <details key={index} className="bg-gray-900/50 rounded-lg overflow-hidden" open={data.length === 1}>
                <summary className="p-4 cursor-pointer hover:bg-gray-700/20 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-cyan-400">{app.name}</h3>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    (app.state.toLowerCase() === 'running' || app.state.toLowerCase() === 'idle') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                    {app.state}
                    </span>
                </summary>
                <div className="p-4 border-t border-gray-700">
                   <ProcessDetails processes={app.processes} />
                </div>
            </details>
         )
      })}
    </div>
  );
};