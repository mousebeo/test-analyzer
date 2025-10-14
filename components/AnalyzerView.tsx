import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './analyzer/FileUpload';
import { AnalysisResultDisplay } from './analyzer/AnalysisResultDisplay';
import { analyzeSystemReports, getDetailedThreadAnalysis } from '../services/geminiService';
import { analyzeSystemReportsLocally } from '../services/localAnalysisService';
import * as k8sService from '../services/kubernetesService';
import * as sessionService from '../services/sessionService';
import * as kubeConnectionService from '../services/kubeConnectionService';
import { AnalysisResult, Role, KubeConnection } from '../types';
import { ExecutiveDashboard } from './analyzer/ExecutiveDashboard';

interface AnalyzerViewProps {
    initialResult: AnalysisResult | null;
    onClearInitialResult: () => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({ initialResult, onClearInitialResult }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzingThreads, setIsAnalyzingThreads] = useState<boolean>(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [isAIEnabled, setIsAIEnabled] = useState<boolean>(false);
  const [role, setRole] = useState<Role>('Administrator');

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
          setFiles([]); // Clear file selection when viewing a saved session
          onClearInitialResult(); // Signal to parent that the initial result has been consumed
      }
      setSavedConnections(kubeConnectionService.getConnections());
  }, [initialResult, onClearInitialResult]);

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
    setAnalysisResult(null);
    setError(null);
    setThreadError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (files.length === 0) {
      setError("Please upload at least one report file or fetch logs from Kubernetes.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setThreadError(null);
    setAnalysisResult(null);

    try {
      const result = isAIEnabled
        ? await analyzeSystemReports(files, role)
        : await analyzeSystemReportsLocally(files);
      setAnalysisResult(result);
      sessionService.saveSession(result, files);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err instanceof Error ? `An error occurred during analysis: ${err.message}` : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [files, isAIEnabled, role]);
  
  const handleAnalyzeThreads = useCallback(async () => {
    if (files.length === 0) {
      setThreadError("Files are not available for thread analysis.");
      return;
    }

    setIsAnalyzingThreads(true);
    setThreadError(null);

    try {
      const threadReport = await getDetailedThreadAnalysis(files);
      setAnalysisResult(prevResult => {
        if (!prevResult) return null;
        const updatedResult = {
          ...prevResult,
          detailedThreadReport: threadReport,
        };
        return updatedResult;
      });
    } catch (err) {
      console.error("Thread analysis failed:", err);
      setThreadError(err instanceof Error ? err.message : "An unknown error occurred during thread analysis.");
    } finally {
      setIsAnalyzingThreads(false);
    }
  }, [files]);

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
        // This will trigger the cascade of useEffects to populate dropdowns
        setWorkloadType(conn.workloadType);
        setSelectedNamespace(conn.namespace);
        // We set these values directly. The useEffects will re-fetch the lists,
        // and these selections will be valid once the lists are populated.
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
                k8sProps={k8sProps}
            />
            </div>
            <div className="lg:col-span-8 xl:col-span-9">
            { analysisResult && analysisResult.analysisType === 'AI' && analysisResult.role === 'Executive' ? (
                <ExecutiveDashboard result={analysisResult} />
            ) : (
                <AnalysisResultDisplay
                    isLoading={isLoading}
                    error={error}
                    result={analysisResult}
                    onAnalyzeThreads={handleAnalyzeThreads}
                    isAnalyzingThreads={isAnalyzingThreads}
                    threadError={threadError}
                />
            )}
            </div>
        </div>
    </div>
  );
};