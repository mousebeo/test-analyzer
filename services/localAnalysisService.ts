import { AnalysisResult, ThreadState, Application, EnvironmentVariable, SystemInfo, MemoryAnalysis, ThreadAnalysis, KeyMetric, ProcessStats, DetailedThreadReport, ProblematicThread, ApplicationWarning, Process, Activity, ChartDataPoint } from '../types';

async function fileToText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}

const parseMemoryString = (memString: string): number => {
    if (!memString || typeof memString !== 'string') return 0;
    const parts = memString.trim().split(/\s+/);
    if (parts.length === 0) return 0;
    
    const value = parseFloat(parts[0]);
    if (isNaN(value)) return 0;
    if (parts.length < 2) return value;

    const unit = parts[1].toUpperCase();

    switch (unit) {
        case 'TB': return value * 1024 * 1024 * 1024 * 1024;
        case 'GB': return value * 1024 * 1024 * 1024;
        case 'MB': return value * 1024 * 1024;
        case 'KB': return value * 1024;
        case 'BYTES':
        case 'B':
        default: return value;
    }
};

const formatBytes = (bytes: number | string): string => {
    const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    if (isNaN(num) || num <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const findTableAfterHeader = (doc: Document, headerTag: string, headerTextContains: string): HTMLTableElement | null => {
    const headers = Array.from(doc.querySelectorAll(headerTag));
    const header = headers.find(h => h.textContent?.trim().includes(headerTextContains));
    if (!header) {
        return null;
    };
    
    let nextElement = header.nextElementSibling;
    while(nextElement) {
        if (nextElement.tagName === 'TABLE') {
            return nextElement as HTMLTableElement;
        }
        const table = nextElement.querySelector('table');
        if (table) {
            return table;
        }
        nextElement = nextElement.nextElementSibling;
    }
    
    let parent: HTMLElement | null = header.parentElement;
    while(parent) {
        let sibling = parent.nextElementSibling;
        while(sibling) {
            if (sibling.tagName === 'TABLE') return sibling as HTMLTableElement;
            const table = sibling.querySelector('table');
            if(table) return table;
            sibling = sibling.nextElementSibling
        }
        parent = parent.parentElement;
    }


    return null;
};

const findNextTable = (element: Element): HTMLTableElement | null => {
    let sibling = element.nextElementSibling;
    while (sibling) {
        if (sibling.tagName === 'TABLE') return sibling as HTMLTableElement;
        const table = sibling.querySelector('table');
        if (table) return table;
        sibling = sibling.nextElementSibling;
    }
    return null;
}

const parseKeyValueTable = (table: HTMLTableElement): Map<string, string> => {
    const data = new Map<string, string>();
    table.querySelectorAll('tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            const key = cells[0].textContent?.trim();
            const value = cells[1].textContent?.trim();
            if (key) {
                data.set(key, value || cells[1].innerHTML); // innerHTML for multiline
            }
        }
    });
    return data;
};

const parseChartData = (scriptContent: string) => {
    const headers: string[] = [];
    const headersMatch = scriptContent.match(/data\.addColumn\('([^']*)', '([^']*)'\);/g);
    if (headersMatch) {
        headersMatch.forEach(match => {
            const headerName = match.match(/data\.addColumn\('[^']*', '([^']*)'\);/)?.[1];
            if (headerName) {
                headers.push(headerName);
            }
        });
    }

    const points: ChartDataPoint[] = [];
    // More robust regex to capture everything between data.addRows(...) and the closing );
    const rowsMatch = scriptContent.match(/data\.addRows\(([\s\S]*?)\);/);
    
    if (rowsMatch && rowsMatch[1]) {
        const dataStr = rowsMatch[1];
        
        if (dataStr.trim() === '[]') {
            return { headers, points };
        }

        try {
            // Replace `new Date(...)` with a string of its arguments for JSON parsing
            // Also, remove potential trailing commas inside arrays e.g., `[1,2,]` becomes `[1,2]`
            const jsonFriendlyStr = dataStr
                .replace(/new Date\(([^)]*)\)/g, `"$1"`)
                .replace(/,\s*(\])/g, '$1') // for arrays
                .replace(/,\s*(\})/g, '$1'); // for objects (just in case)

            const rowsArray = JSON.parse(jsonFriendlyStr);
            
            if (!Array.isArray(rowsArray)) {
                 return { headers, points: [] };
            }

            rowsArray.forEach((row: any[]) => {
                if (!row || !Array.isArray(row) || row.length === 0 || typeof row[0] !== 'string') {
                    return;
                }
                const dateParts = row[0].split(',').map((p: string) => parseInt(p.trim(), 10));
                if (dateParts.length < 6 || dateParts.some(isNaN)) {
                    return;
                }
                const date = new Date(dateParts[0], dateParts[1], dateParts[2], dateParts[3], dateParts[4], dateParts[5]).getTime();

                const point: ChartDataPoint = { date };
                for (let i = 1; i < headers.length; i++) {
                    const key = headers[i].toLowerCase().replace(/\s+/g, '_');
                    if (row[i] !== undefined) {
                        point[key] = row[i];
                    }
                }
                points.push(point);
            });
        } catch (e) {
            if (e instanceof Error) {
                console.error("Failed to parse chart data:", e.message);
            } else {
                 console.error("Failed to parse chart data with unknown error");
            }
        }
    }
    return { headers, points };
};


export async function analyzeSystemReportsLocally(files: File[]): Promise<AnalysisResult> {
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    if (!htmlFile) {
        throw new Error("Local analysis currently supports TIBCO HTML report files only.");
    }
    const content = await fileToText(htmlFile);

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    let result: AnalysisResult = {
        analysisType: 'Local',
        summary: 'This is a local analysis of the provided TIBCO BusinessWorks HTML report. Key metrics and data points have been extracted directly from the file.',
        keyMetrics: [],
        systemInfo: { osName: 'N/A', osVersion: '', architecture: 'N/A', totalPhysicalMemory: 'N/A', freePhysicalMemory: 'N/A', cpuLoad: 'N/A', availableProcessors: 0 },
        memoryAnalysis: { heap: { init: 0, used: 0, committed: 0, max: 0 }, nonHeap: { init: 0, used: 0, committed: 0, max: 0 } },
        threadAnalysis: { totalThreads: 0, peakThreads: 0, daemonThreads: 0, deadlockedThreads: [], threadStates: [] },
        applications: [],
        importantEnvVars: [],
        processStats: { totalJobsCreated: 0, totalActiveJobs: 0, totalJobsFaulted: 0 },
        topProcessesByJobs: [],
        topActivitiesByTime: [],
    };

    const osTable = findTableAfterHeader(doc, 'h3', 'Operating System Information');
    if (osTable) {
        const osData = parseKeyValueTable(osTable);
        result.systemInfo = {
            osName: osData.get('OS Name') || 'N/A',
            osVersion: osData.get('OS Version') || '',
            architecture: osData.get('OS Architecture') || 'N/A',
            totalPhysicalMemory: osData.get('Total Physical Memory') || 'N/A',
            freePhysicalMemory: osData.get('Free Physical Memory') || 'N/A',
            cpuLoad: osData.get('JVM CPU Load') ? `${(parseFloat(osData.get('JVM CPU Load')!) * 100).toFixed(2)}%` : 'N/A',
            availableProcessors: parseInt(osData.get('Available Processors') || '0', 10),
        };
    }

    const memTable = findTableAfterHeader(doc, 'h3', 'Memory Information');
    if (memTable) {
        const memData = parseKeyValueTable(memTable);
        result.memoryAnalysis = {
            heap: {
                init: parseMemoryString(memData.get('Init Heap Size') || '0'),
                used: parseMemoryString(memData.get('Used Heap Size') || '0'),
                committed: parseMemoryString(memData.get('Committed Heap Size') || '0'),
                max: parseMemoryString(memData.get('Max Heap Size') || '0'),
            },
            nonHeap: {
                init: parseMemoryString(memData.get('Init Non-Heap Size') || '0'),
                used: parseMemoryString(memData.get('Used Non-Heap Size') || '0'),
                committed: parseMemoryString(memData.get('Committed Non-Heap Size') || '0'),
                max: parseMemoryString(memData.get('Max Non-Heap Size') || '0'),
            }
        };
    }

    const threadInfoTable = findTableAfterHeader(doc, 'h3', 'Thread Information');
    if(threadInfoTable) {
        const threadData = parseKeyValueTable(threadInfoTable);
        result.threadAnalysis.totalThreads = parseInt(threadData.get('Thread Count') || '0', 10);
        result.threadAnalysis.peakThreads = parseInt(threadData.get('Peak Thread Count') || '0', 10);
        result.threadAnalysis.daemonThreads = parseInt(threadData.get('Daemon Thread Count') || '0', 10);
    }
    
    const threadStateHeader = Array.from(doc.querySelectorAll('h6')).find(h => h.textContent?.trim() === 'Threads State Count');
    if (threadStateHeader) {
        const threadStateTable = findNextTable(threadStateHeader);
        if (threadStateTable) {
            const stateData = parseKeyValueTable(threadStateTable);
            const threadStates: ThreadState[] = [];
            stateData.forEach((count, state) => {
                threadStates.push({ state: state.toUpperCase() as ThreadState['state'], count: parseInt(count, 10) });
            });
            result.threadAnalysis.threadStates = threadStates;
        }
    }
    
    const topThreadsTable = findTableAfterHeader(doc, 'h6', 'Top Threads');
    const threadCpuMap = new Map<string, { cpu: number }>();
    if (topThreadsTable) {
        topThreadsTable.querySelectorAll('tr:not(:first-child)').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 3) {
                const tid = cells[0].textContent?.trim();
                const cpu = parseFloat(cells[3].textContent || '0');
                if (tid) threadCpuMap.set(tid, { cpu });
            }
        });
    }

    const threadDumpTable = findTableAfterHeader(doc, 'h3', 'Thread Dump');
    if (threadDumpTable) {
        const problematicThreads: ProblematicThread[] = [];
        const warnings: ApplicationWarning[] = [];
        
        threadDumpTable.querySelectorAll('tr:not(:first-child)').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) return;
            
            const tid = cells[0].textContent?.trim();
            const content = cells[1].innerHTML;
            const nameMatch = content.match(/Thread Name=([^<]+)/);
            const stateMatch = content.match(/Thread State=([^<]+)/);
            const stackMatch = content.match(/Stack Trace=\[(.+)\]/s);

            if (nameMatch && stateMatch && tid) {
                const threadName = nameMatch[1].trim();
                const state = stateMatch[1].trim();
                const stack = stackMatch ? stackMatch[1].trim().replace(/<br>/g, '\n') : '';
                
                let details = '';
                let isProblematic = false;
                let priority: ProblematicThread['priority'] = 'Low';

                const cpuInfo = threadCpuMap.get(tid);
                if (cpuInfo && cpuInfo.cpu > 5.0) {
                    isProblematic = true;
                    details += `High CPU Usage (${cpuInfo.cpu.toFixed(2)}%). `;
                    priority = 'High';
                }

                if (state === 'BLOCKED') {
                    isProblematic = true;
                    priority = 'High';
                    const blockedOnMatch = stack.match(/- waiting to lock <([0-9a-fx]+)> \(a (.+)\)/);
                    if (blockedOnMatch) {
                        details += `BLOCKED: Waiting for lock on a ${blockedOnMatch[2]}.`;
                    } else {
                        details += 'BLOCKED: Waiting on a monitor lock.';
                    }
                } else if (state === 'RUNNABLE' && stack.includes('java.net.SocketInputStream.socketRead')) {
                    isProblematic = true;
                    priority = 'Medium';
                    details += 'I/O WAIT: May be stuck reading from a network socket, which can be a performance bottleneck.';
                } else if (state === 'WAITING' || state === 'TIMED_WAITING') {
                    if (stack.includes('.take') && (stack.includes('BlockingQueue') || stack.includes('WorkQueue'))) {
                        isProblematic = true;
                        details = 'IDLE WORKER: Thread is waiting to take a task from a queue. This is generally normal for worker threads.';
                        priority = 'Low';
                    } else if (stack.includes('java.lang.Object.wait')) {
                        isProblematic = true;
                        details = 'WAITING: Thread is in Object.wait(), waiting for a notification from another thread.';
                        priority = 'Low';
                    }
                }

                if (isProblematic) {
                    problematicThreads.push({
                        threadName,
                        state,
                        priority,
                        details: details.trim(),
                        stackTraceSnippet: stack.split('\n').slice(0, 8).join('\n')
                    });

                    if (priority === 'High' && !warnings.some(w => w.description.includes('BLOCKED'))) {
                        warnings.push({ severity: 'High', description: `Detected BLOCKED or high-CPU threads. These can cause application freezes or significant performance degradation.` });
                    }
                    if (priority === 'Medium' && !warnings.some(w => w.description.includes('I/O'))) {
                        warnings.push({ severity: 'Medium', description: `Detected threads waiting on network I/O. This could indicate slow downstream services.` });
                    }
                }
            }
        });

        let summary;
        if (problematicThreads.length > 0) {
            summary = `Local analysis flagged ${problematicThreads.length} threads for review. This includes threads that are BLOCKED, have high CPU usage, or are potentially stuck in I/O operations.`;
        } else {
            summary = "Local analysis did not find any critically BLOCKED or high-CPU threads. For a more nuanced analysis of WAITING threads, AI Analysis is recommended.";
        }

        result.detailedThreadReport = { summary, warnings, problematicThreads };
    }

    const applicationsMap = new Map<string, Application>();
    const allHeaders = doc.querySelectorAll('h4, h6');

    allHeaders.forEach(header => {
        const text = header.textContent?.trim() || '';
        const parentElement = header.parentElement;
        if (!parentElement) return;

        const table = findNextTable(parentElement);
        if (!table) return;

        if (header.tagName === 'H4' && text.includes('BW Applications Information')) {
            table.querySelectorAll('tr:not(:first-child)').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    const fullName = cells[0].textContent?.trim() || '';
                    const appName = fullName.split(' - ')[0]; 
                    if (appName && !applicationsMap.has(appName)) {
                        applicationsMap.set(appName, { name: fullName, state: 'Running', endpoints: [], processes: [] });
                    }
                }
            });
        }

        const processMatch = text.match(/Application \[(.+)\] - Processes/);
        if (header.tagName === 'H6' && processMatch) {
            const appName = processMatch[1];
            
            let app = Array.from(applicationsMap.values()).find(a => a.name.startsWith(appName.split(' - ')[0]));
            if (!app) {
                app = { name: appName, state: 'Unknown', endpoints: [], processes: [] };
                applicationsMap.set(appName, app);
            }

            table.querySelectorAll('tr:not(:first-child)').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    const process: Process = {
                        name: cells[0].textContent?.trim() || 'N/A',
                        created: parseInt(cells[1].textContent?.trim().replace(/,/g, '') || '0'),
                        completed: parseInt(cells[2].textContent?.trim().replace(/,/g, '') || '0'),
                        faulted: parseInt(cells[3].textContent?.trim().replace(/,/g, '') || '0'),
                        suspended: parseInt(cells[4].textContent?.trim().replace(/,/g, '') || '0'),
                        activities: []
                    };
                    app!.processes.push(process);
                }
            });
        }
        
        const activityMatch = text.match(/Application \[(.+)\] - Process \[(.+)\] - Activities/);
        if (header.tagName === 'H6' && activityMatch) {
            const appName = activityMatch[1];
            const processName = activityMatch[2];

            const app = Array.from(applicationsMap.values()).find(a => a.name.startsWith(appName.split(' - ')[0]));

            if (app) {
                const process = app.processes.find(p => p.name === processName);
                if (process) {
                     table.querySelectorAll('tr:not(:first-child)').forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 8) {
                            process.activities.push({
                                name: cells[0].textContent?.trim() || 'N/A',
                                status: cells[1].textContent?.trim() || 'N/A',
                                executed: parseInt(cells[2].textContent?.trim().replace(/,/g, '') || '0'),
                                faulted: parseInt(cells[3].textContent?.trim().replace(/,/g, '') || '0'),
                                recentElapsedTime: parseInt(cells[4].textContent?.trim().replace(/,/g, '') || '0'),
                                minElapsedTime: parseInt(cells[5].textContent?.trim().replace(/,/g, '') || '0'),
                                maxElapsedTime: parseInt(cells[6].textContent?.trim().replace(/,/g, '') || '0'),
                                totalElapsedTime: parseInt(cells[7].textContent?.trim().replace(/,/g, '') || '0'),
                            });
                        }
                    });
                }
            }
        }
    });

    // Parse and associate chart data
    const scripts = doc.querySelectorAll('script');
    const chartDataMap = new Map<string, any>();
    scripts.forEach(script => {
        const scriptContent = script.innerHTML;
        const chartIdMatch = scriptContent.match(/document\.getElementById\('([^']*)'\)/);
        if(chartIdMatch) {
            const chartId = chartIdMatch[1];
            const data = parseChartData(scriptContent);
            if (data.points.length > 0) {
                chartDataMap.set(chartId, data);
            }
        }
    });

    applicationsMap.forEach((app, key) => {
        // Find corresponding chart data
        const appChartMatch = Array.from(chartDataMap.keys()).find(k => k.startsWith('appChart'));
        if(appChartMatch) {
            app.chartData = chartDataMap.get(appChartMatch);
        }

        app.processes.forEach((proc, index) => {
            const processTitle = `Process [${proc.name}]`;
            // Find chart div for this process
            const charts = Array.from(doc.querySelectorAll('script')).filter(s => s.innerHTML.includes(processTitle));
            if(charts.length > 0) {
                const chartIdMatch = charts[0].innerHTML.match(/document\.getElementById\('([^']*)'\)/);
                if(chartIdMatch && chartDataMap.has(chartIdMatch[1])) {
                    proc.chartData = chartDataMap.get(chartIdMatch[1]);
                }
            }
        });
    });

    result.applications = Array.from(applicationsMap.values());
    
    // Get overall system-wide process stats
    const summaryAppTable = findTableAfterHeader(doc, 'h4', 'BW Applications Information');
    if (summaryAppTable) {
        let totalCreated = 0, totalActive = 0, totalFaulted = 0;
        summaryAppTable.querySelectorAll('tr:not(:first-child)').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
                totalCreated += parseInt(cells[1].textContent?.trim().replace(/,/g, '') || '0');
                totalActive += parseInt(cells[2].textContent?.trim().replace(/,/g, '') || '0');
                totalFaulted += parseInt(cells[4].textContent?.trim().replace(/,/g, '') || '0');
            }
        });
        result.processStats = { totalJobsCreated: totalCreated, totalActiveJobs: totalActive, totalJobsFaulted: totalFaulted };
    }
    
    const runtimeTable = findTableAfterHeader(doc, 'h3', 'Runtime Information');
    if(runtimeTable){
        const rows = runtimeTable.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2 && cells[0].textContent?.trim() === 'System Properties') {
                const propsText = cells[1].innerHTML;
                const props = propsText.split('<br>').map(p => p.trim()).filter(p => p);
                const importantKeys = ['java.version', 'java.home', 'os.name', 'os.version', 'user.name', 'BW_HOME'];
                props.forEach(prop => {
                    const [key, ...valueParts] = prop.split('=');
                    const value = valueParts.join('=');
                    if (importantKeys.includes(key.trim())) {
                        result.importantEnvVars.push({ key: key.trim(), value: value.trim() });
                    }
                });
            }
        });
    }

    // Aggregate data for overview charts
    const allProcesses: {name: string, created: number}[] = [];
    const allActivities: {name: string, process: string, maxTime: number}[] = [];
    result.applications.forEach(app => {
        app.processes.forEach(proc => {
            allProcesses.push({ name: proc.name, created: proc.created });
            proc.activities.forEach(act => {
                allActivities.push({ name: act.name, process: proc.name, maxTime: act.maxElapsedTime });
            });
        });
    });

    result.topProcessesByJobs = allProcesses.sort((a,b) => b.created - a.created).slice(0, 5);
    result.topActivitiesByTime = allActivities.sort((a,b) => b.maxTime - a.maxTime).slice(0, 5);


    const { memoryAnalysis, threadAnalysis, applications, processStats } = result;
    const keyMetrics: KeyMetric[] = [];
    if(applications.length > 0) keyMetrics.push({ label: 'Applications', value: applications.length.toString() });
    if(threadAnalysis.totalThreads > 0) keyMetrics.push({ label: 'Total Threads', value: threadAnalysis.totalThreads.toString() });
    if(memoryAnalysis.heap.used > 0) keyMetrics.push({ label: 'Heap Used', value: formatBytes(memoryAnalysis.heap.used) });
    if (processStats.totalJobsFaulted > 0) keyMetrics.push({ label: 'Jobs Faulted', value: processStats.totalJobsFaulted.toLocaleString()});
    
    const problematicCount = result.detailedThreadReport?.problematicThreads.length || 0;
    if (problematicCount > 0) {
        keyMetrics.push({ label: 'Problematic Threads', value: problematicCount.toString()});
    }
     if (threadAnalysis.deadlockedThreads.length > 0) keyMetrics.push({ label: 'Deadlocks', value: 'Detected' });
    
    result.keyMetrics = keyMetrics.slice(0, 6);

    return result;
}