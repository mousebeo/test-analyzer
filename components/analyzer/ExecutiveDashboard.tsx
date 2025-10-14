import React from 'react';
import { AnalysisResult, ApplicationWarning } from '../../types';
import { SummaryView } from './SummaryView';

type Status = 'Good' | 'Warning' | 'Critical';

const HealthStatusCard: React.FC<{ title: string; value: string; status: Status; description: string }> = ({ title, value, status, description }) => {
    const statusConfig: { [key in Status]: { color: string; ringColor: string; icon: React.ReactElement } } = {
        Good: { color: 'text-green-400', ringColor: 'ring-green-500/30', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
        Warning: { color: 'text-yellow-400', ringColor: 'ring-yellow-500/30', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /> },
        Critical: { color: 'text-red-400', ringColor: 'ring-red-500/30', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /> },
    };

    const config = statusConfig[status];

    return (
        <div className={`bg-gray-800 p-4 rounded-lg shadow-md flex flex-col justify-between ring-1 ring-inset ring-gray-700 hover:ring-2 ${config.ringColor} transition-all`}>
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 font-medium">{title}</p>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${config.color}`}>
                    {config.icon}
                </svg>
            </div>
            <p className={`text-2xl font-bold ${config.color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
    );
};


const AlertCard: React.FC<{ alert: ApplicationWarning }> = ({ alert }) => (
    <div className="bg-red-900/40 border-l-4 border-red-500 p-4 rounded-r-md">
      <div className="flex">
        <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-300">{alert.description}</p>
        </div>
      </div>
    </div>
);


export const ExecutiveDashboard: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    // --- Logic to determine statuses and alerts ---

    // CPU Status
    const cpuLoad = parseFloat(result.systemInfo.cpuLoad);
    const cpuStatus: Status = !isNaN(cpuLoad) && cpuLoad > 85 ? 'Critical' : !isNaN(cpuLoad) && cpuLoad > 60 ? 'Warning' : 'Good';
    
    // Memory Status
    const totalMem = parseFloat(result.systemInfo.totalPhysicalMemory);
    const freeMem = parseFloat(result.systemInfo.freePhysicalMemory);
    const usedMemPercentage = (totalMem > 0 && !isNaN(totalMem) && !isNaN(freeMem)) ? ((totalMem - freeMem) / totalMem) * 100 : -1;
    const memoryStatus: Status = usedMemPercentage > 90 ? 'Critical' : usedMemPercentage > 75 ? 'Warning' : 'Good';
    const memoryValue = usedMemPercentage !== -1 ? `${usedMemPercentage.toFixed(0)}% Used` : 'N/A';
    
    // Application Status
    const totalApps = result.applications?.length || 0;
    const nonRunningApps = (result.applications || []).filter(app => app.state.toLowerCase() !== 'running' && app.state.toLowerCase() !== 'started').length;
    const appStatus: Status = totalApps > 0 && nonRunningApps > 0 ? 'Warning' : 'Good';
    const appValue = `${totalApps - nonRunningApps}/${totalApps} Running`;

    // Critical Alerts
    const criticalAlerts: ApplicationWarning[] = [];
    if (result.threadAnalysis.deadlockedThreads.length > 0) {
        criticalAlerts.push({
            severity: 'High',
            description: `System has detected ${result.threadAnalysis.deadlockedThreads.length} deadlocked thread(s), which can cause service freezes.`
        });
    }
    result.detailedApplicationReports?.forEach(report => {
        report.warnings?.forEach(warning => {
            if (warning.severity === 'High') {
                criticalAlerts.push({
                    severity: 'High',
                    description: `High severity warning for application "${report.applicationName}": ${warning.description}`
                });
            }
        });
    });

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                    Analysis Summary <span className="text-sm font-normal text-gray-500">(Executive View)</span>
                </h2>
                <SummaryView summary={result.summary} keyMetrics={result.keyMetrics} />
            </div>

            {criticalAlerts.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Critical Alerts</h2>
                    <div className="space-y-3">
                        {criticalAlerts.map((alert, index) => <AlertCard key={index} alert={alert} />)}
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">At-a-Glance System Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <HealthStatusCard 
                        title="CPU Load" 
                        value={result.systemInfo.cpuLoad} 
                        status={cpuStatus} 
                        description="Overall system processor utilization."
                    />
                    <HealthStatusCard 
                        title="Memory Usage" 
                        value={memoryValue}
                        status={memoryStatus} 
                        description="Total physical memory in use."
                    />
                    <HealthStatusCard 
                        title="Application Status" 
                        value={appValue}
                        status={appStatus}
                        description="Number of applications in a running state."
                    />
                </div>
            </div>
        </div>
    );
};