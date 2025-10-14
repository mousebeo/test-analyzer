import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './analyzer/FileUpload';
import { AnalysisResultDisplay } from './AnalysisResultDisplay';
import { getAIAnalysisSummary, getAIDeeperAnalysis } from '../services/geminiService';
import { analyzeSystemReportsLocally } from '../services/localAnalysisService';
import * as k8sService from '../services/kubernetesService';
import * as sessionService from '../services/sessionService';
import * as kubeConnectionService from '../services/kubeConnectionService';
import { AnalysisResult, Role, KubeConnection, ReportType, AIDeeperAnalysis } from '../types';
import { AIAnalysisSummaryView } from './analyzer/AIAnalysisSummaryView';
import { AIDeeperAnalysisView } from './analyzer/AIDeeperAnalysisView';

interface AnalyzerViewProps {
    initialResult: AnalysisResult | null;
    onClearInitialResult: () => void;
    onAnalysisComplete: (result: AnalysisResult | null) => void;
}

const WelcomeState: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-800 rounded-lg p-8 text-center">
        <span className="text-6xl mb-4">🖥️</span>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to the System Analyzer</h2>
        <p className="text-gray-400 max-w-md">
            Select a data source, configure your analysis, and get instant insights into your system's performance.
        </p>
    </div>
);


export const AnalyzerView: React.FC<AnalyzerViewProps> = ({ initialResult, onClearInitialResult, onAnalysisComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIEnabled, setIsAIEnabled] = useState<boolean>(true);
  const [role, setRole] = useState<Role>('Administrator');
  const [reportType, setReportType] = useState<ReportType>('TIBCO HTML');

  // New state for two-stage AI analysis
  const [deeperAnalysis, setDeeperAnalysis] = useState<AIDeeperAnalysis | null>(null);
  const [isAnalyzingDeeper, setIsAnalyzingDeeper] = useState<boolean>(false);
  const [deeperAnalysisError, setDeeperAnalysisError] = useState<string | null>(null);

  // K8s State
  const [kubeconfig, setKubeconfig] = useState<File | null>(null);
  const [k8sIsLoading, setK8sIsLoading] = useState(false);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [workloadType, setWorkloadType] = useState<'Deployment' | 'StatefulSet'>('Deployment');
  const [workloads, setWorkloads] = useState<string[]>([]);
  const [selectedWorkload, setSelectedWorkload] = useState('');
  const [pods, setPods] = useState<string[]>([]);
  const [selectedPod, setSelectedPod] = useState('');
  const [containers, setContainers] = useState<string[]>([]);
  const [selectedContainer, setSelectedContainer] = useState('');
  const [savedConnections, setSavedConnections] = useState<KubeConnection[]>([]);

  useEffect(() => {
      if (initialResult) {
          setAnalysisResult(initialResult);
          onAnalysisComplete(initialResult);
          setFiles([]);
          setDeeperAnalysis(null);
          onClearInitialResult();
      }
      setSavedConnections(kubeConnectionService.getConnections());
  }, [initialResult, onClearInitialResult, onAnalysisComplete]);

    const resetState = () => {
        setAnalysisResult(null);
        onAnalysisComplete(null);
        setError(null);
        setDeeperAnalysis(null);
        setDeeperAnalysisError(null);
    }

  const resetK8sSelection = (level: 'namespace' | 'workloadType' | 'workload' | 'pod' | 'container' | 'full') => {
    if (level === 'full') {
        setKubeconfig(null);
        setNamespaces([]);
    }
    if (['full', 'namespace'].includes(level)) {
      setSelectedNamespace('');
    }
    if (['full', 'namespace', 'workloadType'].includes(level)) {
      setWorkloads([]);
      setSelectedWorkload('');
    }
    if (['full', 'namespace', 'workloadType', 'workload'].includes(level)) {
      setPods([]);
      setSelectedPod('');
    }
    if (['full', 'namespace', 'workloadType', 'workload', 'pod'].includes(level)) {
      setContainers([]);
      setSelectedContainer('');
    }
  };

  const handleKubeconfigChange = async (file: File | null) => {
    setKubeconfig(file);
    resetK8sSelection('namespace');
    if (file) {
      setK8sIsLoading(true);
      try {
        await k8sService.parseKubeconfig(file);
        const fetchedNamespaces = await k8sService.getNamespaces();
        setNamespaces(fetchedNamespaces);
      } catch (e) {
        setError("Failed to parse kubeconfig or fetch namespaces.");
      } finally {
        setK8sIsLoading(false);
      }
    } else {
        setNamespaces([]);
    }
  };

  useEffect(() => {
    if (selectedNamespace) {
      const fetchWorkloads = async () => {
        setK8sIsLoading(true);
        resetK8sSelection('workload');
        try {
          const fetchedWorkloads = await k8sService.getWorkloads(selectedNamespace, workloadType);
          setWorkloads(fetchedWorkloads);
        } catch (e) {
          setError("Failed to fetch workloads.");
        } finally {
          setK8sIsLoading(false);
        }
      };
      fetchWorkloads();
    } else {
        resetK8sSelection('workload');
    }
  }, [selectedNamespace, workloadType]);

  useEffect(() => {
    if (selectedWorkload) {
      const fetchPods = async () => {
        setK8sIsLoading(true);
        resetK8sSelection('pod');
        try {
          const fetchedPods = await k8sService.getPods(selectedNamespace, selectedWorkload);
          setPods(fetchedPods);
        } catch (e) {
          setError("Failed to fetch pods.");
        } finally {
          setK8sIsLoading(false);
        }
      };
      fetchPods();
    } else {
        resetK8sSelection('pod');
    }
  }, [selectedWorkload]);

  useEffect(() => {
    if (selectedPod) {
      const fetchContainers = async () => {
        setK8sIsLoading(true);
        resetK8sSelection('container');
        try {
          const fetchedContainers = await k8sService.getContainers(selectedNamespace, selectedPod);
          setContainers(fetchedContainers);
        } catch (e) {
          setError("Failed to fetch containers.");
        } finally {
          setK8sIsLoading(false);
        }
      };
      fetchContainers();
    } else {
        resetK8sSelection('container');
    }
  }, [selectedPod]);

  const handleFetchK8sLogs = async () => {
    if (!selectedNamespace || !selectedPod || !selectedContainer) return;
    setIsFetchingLogs(true);
    try {
        const logContent = await k8sService.fetchLogs(selectedNamespace, selectedPod, selectedContainer);
        const logFile = new File([logContent], `${selectedPod}-${selectedContainer}.log`, { type: 'text/plain' });
        handleFilesChange([ ...files, logFile ]);
    } catch (err) {
        setError(err instanceof Error ? `Failed to fetch logs: ${err.message}` : "An unknown error occurred while fetching logs.");
    } finally {
        setIsFetchingLogs(false);
    }
  };

  const handleFilesChange = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    resetState();
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (files.length === 0) {
      setError("Please upload at least one report file or fetch logs from Kubernetes.");
      return;
    }
    
    setIsLoading(true);
    resetState();

    try {
      // Step 1: Always perform local analysis first to get structured data.
      const localResult = await analyzeSystemReportsLocally(files, reportType);

      if (isAIEnabled) {
        // Step 2: If AI is on, get the AI summary based on local data + raw files.
        const aiSummary = await getAIAnalysisSummary(localResult, files, role);
        const finalResult: AnalysisResult = {
          ...localResult,
          analysisType: 'AI',
          role: role,
          aiSummary: aiSummary,
          summary: aiSummary.summary, // Overwrite local summary with AI summary
        };
        setAnalysisResult(finalResult);
        onAnalysisComplete(finalResult);
        sessionService.saveSession(finalResult, files);
      } else {
        // Just use the local result.
        setAnalysisResult(localResult);
        onAnalysisComplete(localResult);
        sessionService.saveSession(localResult, files);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err instanceof Error ? `An error occurred during analysis: ${err.message}` : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [files, isAIEnabled, role, reportType, onAnalysisComplete]);
  
  const handleDeeperAnalysis = useCallback(async () => {
    if (!analysisResult) return;

    setIsAnalyzingDeeper(true);
    setDeeperAnalysisError(null);

    try {
      const deepDive = await getAIDeeperAnalysis(analysisResult, files, role);
      setDeeperAnalysis(deepDive);
    } catch (err) {
      setDeeperAnalysisError(err instanceof Error ? err.message : "An unknown error occurred during the deep analysis.");
    } finally {
      setIsAnalyzingDeeper(false);
    }
  }, [analysisResult, files, role]);

  const handleSaveConnection = () => {
      if (!selectedNamespace || !selectedWorkload || !selectedPod || !selectedContainer) return;
      const newConnection = kubeConnectionService.saveConnection({
          namespace: selectedNamespace,
          workloadType,
          workload: selectedWorkload,
          pod: selectedPod,
          container: selectedContainer,
      });
      if (!savedConnections.some(c => c.id === newConnection.id)) {
        setSavedConnections(prev => [...prev, newConnection].sort((a,b) => a.name.localeCompare(b.name)));
      }
  };

  const handleLoadConnection = (connectionId: string) => {
    if (!connectionId) {
        resetK8sSelection('namespace');
        return;
    }
    const conn = savedConnections.find(c => c.id === connectionId);
    if (conn) {
        setWorkloadType(conn.workloadType);
        setSelectedNamespace(conn.namespace);
        setSelectedWorkload(conn.workload);
        setSelectedPod(conn.pod);
        setSelectedContainer(conn.container);
    }
  };

  const handleDeleteConnection = (connectionId: string) => {
      kubeConnectionService.deleteConnection(connectionId);
      setSavedConnections(prev => prev.filter(c => c.id !== connectionId));
  }
  
  const k8sProps = {
    onKubeconfigChange: handleKubeconfigChange,
    isKubeconfigLoaded: !!kubeconfig,
    k8sIsLoading,
    isFetchingLogs,
    namespaces, selectedNamespace, onNamespaceChange: setSelectedNamespace,
    workloadType, onWorkloadTypeChange: setWorkloadType,
    workloads, selectedWorkload, onWorkloadChange: setSelectedWorkload,
    pods, selectedPod, onPodChange: setSelectedPod,
    containers, selectedContainer, onContainerChange: setSelectedContainer,
    onFetchK8sLogs: handleFetchK8sLogs,
    savedConnections,
    onLoadConnection: handleLoadConnection,
    onSaveConnection: handleSaveConnection,
    onDeleteConnection: handleDeleteConnection,
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-800/50 rounded-lg p-8">
            <svg className="animate-spin h-12 w-12 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-semibold text-gray-300">Performing Analysis...</p>
        </div>
      );
    }

    if(error) {
        return (
             <div className="flex flex-col items-center justify-center h-full bg-red-900/20 border border-red-500 rounded-lg p-8 text-center">
                <span className="text-5xl mb-4">⚠️</span>
                <h3 className="text-xl font-bold text-red-400 mb-2">Analysis Failed</h3>
                <p className="text-red-300">{error}</p>
            </div>
        )
    }

    if (deeperAnalysis) {
        return <AIDeeperAnalysisView analysis={deeperAnalysis} onBack={() => setDeeperAnalysis(null)} />;
    }

    if (analysisResult) {
        if (analysisResult.analysisType === 'AI') {
            return <AIAnalysisSummaryView 
                        result={analysisResult} 
                        onDeeperAnalysis={handleDeeperAnalysis} 
                        isAnalyzingDeeper={isAnalyzingDeeper}
                        deeperAnalysisError={deeperAnalysisError}
                    />;
        } else {
             return <AnalysisResultDisplay result={analysisResult} />;
        }
    }

    return <WelcomeState />;
  }

  return (
    <div className="animate-fade-in">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 xl:col-span-3">
            <FileUpload 
                onFilesChange={handleFilesChange}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
                fileCount={files.length}
                isAIEnabled={isAIEnabled}
                onIsAIEnabledChange={setIsAIEnabled}
                role={role}
                onRoleChange={setRole}
                reportType={reportType}
                onReportTypeChange={setReportType}
                k8sProps={k8sProps}
            />
            </div>
            <div className="lg:col-span-8 xl:col-span-9">
                {renderContent()}
            </div>
        </div>
    </div>
  );
};