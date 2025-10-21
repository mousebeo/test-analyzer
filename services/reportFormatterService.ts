import { AnalysisResult } from '../types';

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function formatResultAsMarkdown(result: AnalysisResult): string {
    let md = `# System Analysis Report - ${new Date(Date.now()).toLocaleString()}\n\n`;

    md += `## 🤖 ${result.analysisType} Summary (${result.role || 'General'})\n`;
    md += `${result.summary}\n\n`;

    if (result.aiSummary) {
        md += `### ✅ Health Highlights\n`;
        result.aiSummary.healthHighlights.forEach(h => {
            md += `- ${h}\n`;
        });
        md += `\n`;

        md += `### ⚠️ Areas of Concern\n`;
        if (result.aiSummary.areasOfConcern.length > 0) {
            result.aiSummary.areasOfConcern.forEach(c => {
                md += `- **[${c.severity}]** ${c.description}\n`;
            });
        } else {
            md += `None identified.\n`;
        }
        md += `\n`;
    }

    md += `## 📊 Key Metrics\n`;
    result.keyMetrics.forEach(m => {
        md += `- **${m.label}:** ${m.value}\n`;
    });
    md += `\n`;

    md += `## 💻 System Information\n`;
    md += `- **OS:** ${result.systemInfo.osName} ${result.systemInfo.osVersion}\n`;
    md += `- **Architecture:** ${result.systemInfo.architecture}\n`;
    md += `- **CPU Load:** ${result.systemInfo.cpuLoad}\n`;
    md += `- **Memory:** ${result.systemInfo.freePhysicalMemory} free of ${result.systemInfo.totalPhysicalMemory}\n\n`;

    md += `## 🧠 Memory Analysis\n`;
    md += `- **Heap Used:** ${formatBytes(result.memoryAnalysis.heap.used)} / ${formatBytes(result.memoryAnalysis.heap.max)}\n`;
    md += `- **Non-Heap Used:** ${formatBytes(result.memoryAnalysis.nonHeap.used)} / ${formatBytes(result.memoryAnalysis.nonHeap.max)}\n\n`;

    md += `## 🧵 Thread Analysis\n`;
    md += `- **Total Threads:** ${result.threadAnalysis.totalThreads}\n`;
    md += `- **Peak Threads:** ${result.threadAnalysis.peakThreads}\n`;
    md += `- **Deadlocked Threads:** ${result.threadAnalysis.deadlockedThreads.length > 0 ? result.threadAnalysis.deadlockedThreads.join(', ') : 'None'}\n`;
    if (result.detailedThreadReport?.problematicThreads && result.detailedThreadReport.problematicThreads.length > 0) {
        md += `\n### Problematic Threads Identified\n`;
        result.detailedThreadReport.problematicThreads.slice(0, 5).forEach(t => {
            md += `- **${t.threadName}** (State: ${t.state}, Priority: ${t.priority}): ${t.details}\n`;
        });
    }
    md += `\n`;

    md += `## 🚀 Applications & Processes\n`;
    md += `**Total Jobs Created:** ${result.processStats.totalJobsCreated}\n`;
    md += `**Total Jobs Faulted:** ${result.processStats.totalJobsFaulted}\n\n`;
    result.applications.forEach(app => {
        md += `### [Application: ${app.name}]\n\n**State:** ${app.state}\n\n`;
        app.processes.forEach(proc => {
            md += `#### [Process: ${proc.name}]\n\n`;
            md += `- **Created:** ${proc.created}\n- **Completed:** ${proc.completed}\n- **Faulted:** ${proc.faulted}\n\n`;
            if(proc.activities && proc.activities.length > 0) {
                md += `**Activities:**\n`
                proc.activities.forEach(act => {
                    md += `  - ${act.name} (Status: ${act.status}, Executed: ${act.executed}, Faulted: ${act.faulted}, Max Time: ${act.maxElapsedTime}ms)\n`
                });
                md += `\n`;
            }
        });
        md += '\n'
    });
    md += `\n`;

    return md;
}