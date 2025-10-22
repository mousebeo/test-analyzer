import { AnalysisResult } from '../types';

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (isNaN(bytes) || bytes < 0) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function formatResultIntoChunks(result: AnalysisResult): string[] {
    const chunks: string[] = [];
    // Reduced chunk size to be safer for embedding models with smaller context windows (e.g., 512 tokens)
    const MAX_CHUNK_CHAR_LENGTH = 1800; 

    // --- Chunk 1: High-level Summary & Metrics ---
    let summaryChunk = `## 🤖 AI Summary & Key Metrics (${result.role || 'General'})\n\n`;
    summaryChunk += `**Summary:** ${result.summary}\n\n`;

    if (result.aiSummary) {
        summaryChunk += `### ✅ Health Highlights\n`;
        result.aiSummary.healthHighlights.forEach(h => {
            summaryChunk += `- ${h}\n`;
        });
        summaryChunk += `\n### ⚠️ Areas of Concern\n`;
        if (result.aiSummary.areasOfConcern.length > 0) {
            result.aiSummary.areasOfConcern.forEach(c => {
                summaryChunk += `- **[${c.severity}]** ${c.description}\n`;
            });
        } else {
            summaryChunk += `None identified.\n`;
        }
        summaryChunk += `\n`;
    }

    summaryChunk += `### 📊 Key Metrics\n`;
    result.keyMetrics.forEach(m => {
        summaryChunk += `- **${m.label}:** ${m.value}\n`;
    });
    chunks.push(summaryChunk);

    // --- Chunk 2: System & Resource Info ---
    let systemChunk = `## 💻 System & Resource Information\n\n`;
    systemChunk += `### System\n`;
    systemChunk += `- **OS:** ${result.systemInfo.osName} ${result.systemInfo.osVersion}\n`;
    systemChunk += `- **Architecture:** ${result.systemInfo.architecture}\n`;
    systemChunk += `- **CPU Load:** ${result.systemInfo.cpuLoad}\n`;
    systemChunk += `- **Memory:** ${result.systemInfo.freePhysicalMemory} free of ${result.systemInfo.totalPhysicalMemory}\n\n`;
    
    systemChunk += `### 🧠 Memory Analysis\n`;
    systemChunk += `- **Heap Used:** ${formatBytes(result.memoryAnalysis.heap.used)} / ${formatBytes(result.memoryAnalysis.heap.max)}\n`;
    systemChunk += `- **Non-Heap Used:** ${formatBytes(result.memoryAnalysis.nonHeap.used)} / ${formatBytes(result.memoryAnalysis.nonHeap.max)}\n\n`;

    systemChunk += `### 🧵 Thread Analysis\n`;
    systemChunk += `- **Total Threads:** ${result.threadAnalysis.totalThreads}\n`;
    systemChunk += `- **Peak Threads:** ${result.threadAnalysis.peakThreads}\n`;
    systemChunk += `- **Deadlocked Threads:** ${result.threadAnalysis.deadlockedThreads.length > 0 ? result.threadAnalysis.deadlockedThreads.join(', ') : 'None'}\n`;
    if (result.detailedThreadReport?.problematicThreads && result.detailedThreadReport.problematicThreads.length > 0) {
        systemChunk += `\n**Problematic Threads Identified:**\n`;
        result.detailedThreadReport.problematicThreads.slice(0, 3).forEach(t => { // just top 3 for summary
            systemChunk += `- ${t.threadName} (State: ${t.state})\n`;
        });
    }
    chunks.push(systemChunk);

    // --- Chunk 3: Applications & Processes Overview ---
    let appsOverviewChunk = `## 🚀 Applications Overview\n\n`;
    appsOverviewChunk += `**Total Jobs Created:** ${result.processStats.totalJobsCreated}\n`;
    appsOverviewChunk += `**Total Jobs Faulted:** ${result.processStats.totalJobsFaulted}\n\n`;
    
    const meaningfulProcesses: { app: AnalysisResult['applications'][0], proc: AnalysisResult['applications'][0]['processes'][0] }[] = [];
    result.applications.forEach(app => {
        app.processes.forEach(proc => {
            const isMeaningful = proc.created > 0 || proc.completed > 0 || proc.faulted > 0 || (proc.activities && proc.activities.length > 0);
            if (isMeaningful) {
                meaningfulProcesses.push({ app, proc });
                appsOverviewChunk += `- **${app.name} / ${proc.name}**: ${proc.created} created, ${proc.faulted} faulted.\n`
            }
        });
    });
    chunks.push(appsOverviewChunk);

    // --- Chunk 4+: One chunk per meaningful process, with intelligent sub-chunking ---
    meaningfulProcesses.forEach(({ app, proc }) => {
        const baseHeader = `## 📄 Process Details: ${proc.name}\n\n` +
                         `**Application:** ${app.name} (State: ${app.state})\n` +
                         `**Process:** ${proc.name}\n\n` +
                         `### Statistics\n` +
                         `- **Created:** ${proc.created}\n` +
                         `- **Completed:** ${proc.completed}\n` +
                         `- **Faulted:** ${proc.faulted}\n\n`;

        if (!proc.activities || proc.activities.length === 0) {
            chunks.push(baseHeader);
            return;
        }

        const continuedHeader = `## 📄 Process Details: ${proc.name} (continued)\n\n` +
                               `**Application:** ${app.name}\n` +
                               `**Process:** ${proc.name}\n\n` +
                               `### Activities (continued)\n`;
        
        let currentChunk = baseHeader + `### Activities\n`;

        proc.activities.forEach(act => {
            const activityText = `  - **${act.name}**\n` +
                               `    - Status: ${act.status}\n` +
                               `    - Executed: ${act.executed}\n` +
                               `    - Faulted: ${act.faulted}\n` +
                               `    - Max Time: ${act.maxElapsedTime}ms\n`;

            // If adding the next activity would exceed the limit...
            if (currentChunk.length + activityText.length > MAX_CHUNK_CHAR_LENGTH) {
                // ...push the current chunk...
                chunks.push(currentChunk);
                // ...and start a new one with the continued header and the current activity.
                currentChunk = continuedHeader + activityText;
            } else {
                // ...otherwise, just append to the current chunk.
                currentChunk += activityText;
            }
        });

        // Push the last remaining chunk for this process
        chunks.push(currentChunk);
    });

    return chunks.filter(c => c.trim().length > 0);
}