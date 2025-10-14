export type Role = 'Executive' | 'Administrator' | 'Developer';

export type User = {
  id: number;
  name: string;
  role: Role;
  password?: string;
};

export interface KeyMetric {
  value: string;
  label: string;
  icon?: string;
}

export interface SystemInfo {
  osName: string;
  osVersion: string;
  architecture: string;
  totalPhysicalMemory: string;
  freePhysicalMemory: string;
  cpuLoad: string;
  availableProcessors: number;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
}

export interface EndpointProperty {
  key: string;
  value: string;
}

export interface Endpoint {
  type: string;
  url: string;
  properties: EndpointProperty[];
}

export interface Activity {
    name: string;
    status: string;
    executed: number;
    faulted: number;
    recentElapsedTime: number;
    minElapsedTime: number;
    maxElapsedTime: number;
    totalElapsedTime: number;
}

export interface ChartDataPoint {
    date: number; // Storing as timestamp for easier charting
    [key: string]: number | undefined;
}

export interface Process {
    name: string;
    created: number;
    completed: number;
    faulted: number;
    suspended: number;
    activities: Activity[];
    chartData?: {
        headers: string[];
        points: ChartDataPoint[];
    };
}

export interface Application {
  name: string;
  state: string;
  endpoints: Endpoint[];
  processes: Process[];
  chartData?: {
      headers: string[];
      points: ChartDataPoint[];
  };
}

export interface ProcessStats {
  totalJobsCreated: number;
  totalActiveJobs: number;
  totalJobsFaulted: number;
}

export interface MemoryUsage {
  init: number;
  used: number;
  committed: number;
  max: number;
}

export interface MemoryAnalysis {
  heap: MemoryUsage;
  nonHeap: MemoryUsage;
}

export interface ThreadState {
  state: 'RUNNABLE' | 'WAITING' | 'TIMED_WAITING' | 'BLOCKED' | 'TERMINATED' | 'NEW';
  count: number;
}

export interface ThreadAnalysis {
  totalThreads: number;
  peakThreads: number;
  daemonThreads: number;
  deadlockedThreads: string[];
  threadStates: ThreadState[];
}

export interface ApplicationWarning {
  severity: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface ServiceCall {
  serviceName: string;
  callCount: number;
  averageLatency: string;
  errorRate: string;
}

export interface DetailedApplicationReport {
  applicationName: string;
  performanceSummary: string;
  serviceCalls: ServiceCall[];
  warnings: ApplicationWarning[];
}

export interface ProblematicThread {
  threadName: string;
  state: string;
  priority: 'High' | 'Medium' | 'Low';
  details: string;
  stackTraceSnippet: string;
}

export interface DetailedThreadReport {
  summary: string;
  warnings: ApplicationWarning[];
  problematicThreads: ProblematicThread[];
}

export interface AnalysisResult {
  analysisType: 'AI' | 'Local';
  role?: Role;
  summary: string;
  keyMetrics: KeyMetric[];
  systemInfo: SystemInfo;
  importantEnvVars: EnvironmentVariable[];
  applications: Application[];
  processStats: ProcessStats;
  memoryAnalysis: MemoryAnalysis;
  threadAnalysis: ThreadAnalysis;
  detailedApplicationReports?: DetailedApplicationReport[];
  detailedThreadReport?: DetailedThreadReport;
  topProcessesByJobs?: { name: string; created: number }[];
  topActivitiesByTime?: { name: string; process: string; maxTime: number }[];
}

export interface Session {
  id: string;
  name: string;
  timestamp: number;
  result: AnalysisResult;
}

export interface KubeConnection {
    id: string;
    name: string;
    namespace: string;
    workloadType: 'Deployment' | 'StatefulSet';
    workload: string;
    pod: string;
    container: string;
}
