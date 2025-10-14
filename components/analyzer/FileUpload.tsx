
import React, { useCallback, useRef, useState } from 'react';
import { KubeConnection, Role, ReportType } from '../../types';

interface K8sProps {
  onKubeconfigChange: (file: File | null) => void;
  isKubeconfigLoaded: boolean;
  k8sIsLoading: boolean;
  isFetchingLogs: boolean;
  namespaces: string[];
  selectedNamespace: string;
  onNamespaceChange: (ns: string) => void;
  workloadType: 'Deployment' | 'StatefulSet';
  onWorkloadTypeChange: (type: 'Deployment' | 'StatefulSet') => void;
  workloads: string[];
  selectedWorkload: string;
  onWorkloadChange: (wl: string) => void;
  pods: string[];
  selectedPod: string;
  onPodChange: (pod: string) => void;
  containers: string[];
  selectedContainer: string;
  onContainerChange: (container: string) => void;
  onFetchK8sLogs: () => void;
  savedConnections: KubeConnection[];
  onLoadConnection: (id: string) => void;
  onSaveConnection: () => void;
  onDeleteConnection: (id: string) => void;
}

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  fileCount: number;
  isAIEnabled: boolean;
  onIsAIEnabledChange: (isAI: boolean) => void;
  role: Role;
  onRoleChange: (role: Role) => void;
  reportType: ReportType;
  onReportTypeChange: (type: ReportType) => void;
  k8sProps: K8sProps;
}

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4h-2m-6-4l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

const KubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9zM12 2l4.95 4.95" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22l-4.95-4.95" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12l4.95 4.95" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 12l-4.95-4.95" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
    </svg>
);

const TrashIcon: React.FC<{className: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


const KubernetesLogSource: React.FC<{ k8sProps: K8sProps }> = ({ k8sProps }) => {
    const {
      onKubeconfigChange, isKubeconfigLoaded, k8sIsLoading, isFetchingLogs,
      namespaces, selectedNamespace, onNamespaceChange,
      workloadType, onWorkloadTypeChange,
      workloads, selectedWorkload, onWorkloadChange,
      pods, selectedPod, onPodChange,
      containers, selectedContainer, onContainerChange,
      onFetchK8sLogs,
      savedConnections, onLoadConnection, onSaveConnection, onDeleteConnection
    } = k8sProps;
    
    const kubeconfigRef = useRef<HTMLInputElement>(null);
    const [selectedConnection, setSelectedConnection] = useState('');

    const handleLoadChange = (id: string) => {
        setSelectedConnection(id);
        onLoadConnection(id);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onDeleteConnection(id);
        if (selectedConnection === id) {
            setSelectedConnection('');
        }
    }

    const Selector: React.FC<{ label: string; value: string; onChange: (val: string) => void; options: string[]; placeholder: string; disabled: boolean; }> = 
      ({ label, value, onChange, options, placeholder, disabled }) => (
        <div>
            <label className="text-sm font-medium text-gray-400">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <option value="">{placeholder}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );

    return (
        <div className="space-y-4">
             <div>
                <label className="text-sm font-medium text-gray-400">Load Saved Configuration</label>
                <div className="flex items-center space-x-2">
                    <select
                        value={selectedConnection}
                        onChange={(e) => handleLoadChange(e.target.value)}
                        className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    >
                        <option value="">New Selection...</option>
                        {savedConnections.map(conn => <option key={conn.id} value={conn.id}>{conn.name}</option>)}
                    </select>
                    {selectedConnection && (
                        <button onClick={(e) => handleDelete(e, selectedConnection)} className="mt-1 p-2 text-gray-400 hover:text-red-400 rounded-md">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="border-b border-gray-700/50"></div>

            <div>
                <label className="text-sm font-medium text-gray-400">Kubeconfig File</label>
                {!isKubeconfigLoaded && !selectedConnection && <p className="text-xs text-yellow-400/80 mt-1">Select a config file to begin</p>}
                 {!isKubeconfigLoaded && !!selectedConnection && <p className="text-xs text-yellow-400/80 mt-1">Select a config file to activate loaded selection</p>}
                <div 
                    onClick={() => kubeconfigRef.current?.click()}
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer ${isKubeconfigLoaded ? 'border-green-500' : 'border-gray-600 hover:border-cyan-500'}`}
                >
                    <div className="space-y-1 text-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className={`mx-auto h-8 w-8 ${isKubeconfigLoaded ? 'text-green-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-xs text-gray-400">{isKubeconfigLoaded ? "Config loaded" : "Click to select"}</p>
                    </div>
                </div>
                <input type="file" ref={kubeconfigRef} onChange={e => onKubeconfigChange(e.target.files?.[0] || null)} className="hidden" accept=".yaml,.yml,.kubeconfig,config" />
            </div>

            {k8sIsLoading && !isKubeconfigLoaded && <p className="text-sm text-center text-cyan-400">Loading namespaces...</p>}

            <div className={`space-y-4 transition-opacity ${!isKubeconfigLoaded ? 'opacity-50' : ''}`}>
                <Selector label="Namespace" value={selectedNamespace} onChange={onNamespaceChange} options={namespaces} placeholder="Select Namespace" disabled={!isKubeconfigLoaded} />
                <div>
                  <label className="text-sm font-medium text-gray-400">Workload Type</label>
                  <div className="flex bg-gray-700 rounded-lg p-1 mt-1">
                    {(['Deployment', 'StatefulSet'] as const).map(type => (
                      <button key={type} onClick={() => onWorkloadTypeChange(type)} disabled={!selectedNamespace} className={`w-full text-center px-2 py-1 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none ${workloadType === type ? 'bg-cyan-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600 disabled:opacity-50'}`}>{type}</button>
                    ))}
                  </div>
                </div>
                <Selector label="Workload" value={selectedWorkload} onChange={onWorkloadChange} options={workloads} placeholder="Select Workload" disabled={!selectedNamespace} />
                <Selector label="Pod" value={selectedPod} onChange={onPodChange} options={pods} placeholder="Select Pod" disabled={!selectedWorkload} />
                <Selector label="Container" value={selectedContainer} onChange={onContainerChange} options={containers} placeholder="Select Container" disabled={!selectedPod} />
            </div>

            <div className="flex space-x-2">
                <button
                    onClick={onSaveConnection}
                    disabled={!selectedContainer}
                    className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-colors duration-300 flex items-center justify-center"
                >
                Save Config
                </button>
                <button
                    onClick={onFetchK8sLogs}
                    disabled={!selectedContainer || isFetchingLogs}
                    className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md"
                >
                {isFetchingLogs ? 'Fetching...' : 'Fetch Logs'}
                </button>
            </div>
        </div>
    );
};

const FileDropZone: React.FC<{onFilesChange: (files: File[]) => void, fileCount: number}> = ({ onFilesChange, fileCount }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        onFilesChange(files);
    }, [onFilesChange]);

    return (
        <div 
            className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-500 transition-colors h-full"
            onClick={() => fileInputRef.current?.click()}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4h-2m-6-4l4-4m0 0l4 4m-4-4v12" /></svg>
            <p className="mt-2 text-gray-400">Click to browse or drag files here</p>
            <input
                type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden"
                accept=".txt,.log,.json,.hprof,.phd,.html"
            />
            {fileCount > 0 && (
                <p className="mt-4 text-sm text-green-400">{fileCount} file(s) ready for analysis.</p>
            )}
        </div>
    );
}


const AIToggle: React.FC<{ isEnabled: boolean; onChange: (enabled: boolean) => void }> = ({ isEnabled, onChange }) => (
    <div className="flex items-center justify-center mt-4">
        <label htmlFor="ai-toggle" className="flex items-center cursor-pointer">
            <div className="relative">
                <input id="ai-toggle" type="checkbox" className="sr-only" checked={isEnabled} onChange={(e) => onChange(e.target.checked)} />
                <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isEnabled ? 'translate-x-6 bg-cyan-400' : ''}`}></div>
            </div>
            <div className="ml-3 text-gray-300 font-medium">
                Enable AI Analysis <span className="text-xs text-gray-500">(slower, smarter)</span>
            </div>
        </label>
    </div>
);

const RoleSelector: React.FC<{ selectedRole: Role; onRoleChange: (role: Role) => void; }> = ({ selectedRole, onRoleChange }) => {
  const roles: Role[] = ['Executive', 'Administrator', 'Developer'];
  return (
      <div className="mt-4">
           <div className="text-gray-300 font-medium mb-2 text-center">Select AI Persona</div>
          <div className="flex bg-gray-700 rounded-lg p-1">
              {roles.map((role) => (
                  <button key={role} onClick={() => onRoleChange(role)}
                      className={`w-full text-center px-2 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${selectedRole === role ? 'bg-cyan-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}>
                      {role}
                  </button>
              ))}
          </div>
      </div>
  );
};

const ReportTypeSelector: React.FC<{
    selectedType: ReportType;
    onTypeChange: (type: ReportType) => void;
  }> = ({ selectedType, onTypeChange }) => {
    const types: ReportType[] = ['TIBCO HTML', 'Generic Log'];
    return (
        <div className="mt-4">
             <div className="text-gray-300 font-medium mb-2 text-center">Select Report Type</div>
            <div className="flex bg-gray-700 rounded-lg p-1">
                {types.map((type) => (
                    <button
                        key={type}
                        onClick={() => onTypeChange(type)}
                        className={`w-full text-center px-2 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                            selectedType === type
                                ? 'bg-cyan-600 text-white shadow'
                                : 'text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>
    );
  };


export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, onAnalyze, isLoading, fileCount, isAIEnabled, onIsAIEnabledChange, role, onRoleChange, reportType, onReportTypeChange, k8sProps }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'k8s'>('file');

  const TabButton: React.FC<{ label: string; icon: React.ReactNode; tabName: 'file' | 'k8s'; }> = ({ label, icon, tabName }) => (
    <button
        onClick={() => setActiveTab(tabName)}
        className={`flex-1 flex items-center justify-center p-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tabName ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white'}`}
    >
        {icon}{label}
    </button>
  );
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-cyan-400">1. Select Data Source</h2>
      
      <div className="flex border-b border-gray-700 mb-4">
          <TabButton label="Upload Files" icon={<UploadIcon/>} tabName="file" />
          <TabButton label="Kubernetes" icon={<KubeIcon/>} tabName="k8s" />
      </div>

      <div className="flex-grow flex flex-col">
        {activeTab === 'file' && <FileDropZone onFilesChange={onFilesChange} fileCount={fileCount} />}
        {activeTab === 'k8s' && <KubernetesLogSource k8sProps={k8sProps} />}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-cyan-400">2. Configure Analysis</h2>
        <AIToggle isEnabled={isAIEnabled} onChange={onIsAIEnabledChange} />
        <ReportTypeSelector selectedType={reportType} onTypeChange={onReportTypeChange} />
        {isAIEnabled && (
          <RoleSelector selectedRole={role} onRoleChange={onRoleChange} />
        )}
        <button
            onClick={onAnalyze}
            disabled={isLoading || fileCount === 0}
            className="mt-6 w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-cyan-500/50"
        >
            {isLoading ? (
            <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
            </>
            ) : `3. Analyze Reports (${reportType})${isAIEnabled ? ` - AI for ${role}` : ''}`}
        </button>
      </div>
    </div>
  );
};
