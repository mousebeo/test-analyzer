
import React, { useState, useEffect } from 'react';
import { User, AnalysisResult, IndexedDocument, RAGConfig } from '../types';
import { DashboardIcon, AnalyzerIcon, UsersIcon, LogoutIcon, KnowledgeBaseIcon, SettingsIcon } from '../assets/icons';
import { DashboardView } from './DashboardView';
import { AnalyzerView } from './AnalyzerView';
import { UserManagementView } from './UserManagementView';
import { AIAssistant } from './AIAssistant';
import * as sessionService from '../services/sessionService';
import * as ragService from '../services/ragService';
import { RAGView } from './RAGView';
import { ConfigurationView } from './ConfigurationView';

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
}

type View = 'dashboard' | 'analyzer' | 'users' | 'rag' | 'settings';

const NavItem: React.FC<{
    icon: React.ReactElement;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 ${
            isActive
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
        {icon}
        <span className="ml-4 font-medium">{label}</span>
    </button>
);


export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout }) => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [loadedResult, setLoadedResult] = useState<AnalysisResult | null>(null);
    const [analysisContext, setAnalysisContext] = useState<AnalysisResult | null>(null);
    const [documents, setDocuments] = useState<IndexedDocument[]>([]);
    const [ragConfig, setRagConfig] = useState<RAGConfig>(ragService.getConfig());


    useEffect(() => {
        setDocuments(ragService.getIndexedDocuments());
    }, []);
    
    const handleSaveRagConfig = (newConfig: RAGConfig) => {
        ragService.saveConfig(newConfig);
        setRagConfig(newConfig);
    };

    const handleUploadDocument = async (file: File, context: { machineName?: string } = {}) => {
        await ragService.uploadDocument(file, ragConfig, (updatedDocs) => {
            setDocuments([...updatedDocs]);
        }, context);
    };

    const handleDeleteDocument = (docId: string) => {
        const updatedDocs = ragService.deleteDocument(docId);
        setDocuments(updatedDocs);
    };

    const handleViewChange = (view: View) => {
        if (view !== 'analyzer') {
            setLoadedResult(null);
        }
        if (view !== 'analyzer' && view !== 'rag') {
            setAnalysisContext(null);
        }
        setActiveView(view);
    };

    const handleLoadSession = (sessionId: string) => {
        const session = sessionService.getSession(sessionId);
        if (session) {
            setLoadedResult(session.result);
            setAnalysisContext(session.result);
            setActiveView('analyzer');
        }
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardView user={user} setActiveView={handleViewChange} onLoadSession={handleLoadSession} />;
            case 'analyzer':
                return <AnalyzerView 
                            initialResult={loadedResult} 
                            onClearInitialResult={() => setLoadedResult(null)}
                            onAnalysisComplete={setAnalysisContext}
                            onUploadDocument={handleUploadDocument}
                        />;
            case 'users':
                return <UserManagementView />;
            case 'rag':
                return <RAGView 
                            documents={documents}
                            config={ragConfig}
                            onUpload={handleUploadDocument}
                            onDelete={handleDeleteDocument}
                        />;
            case 'settings':
                return <ConfigurationView config={ragConfig} onSave={handleSaveRagConfig} />;
            default:
                return <DashboardView user={user} setActiveView={handleViewChange} onLoadSession={handleLoadSession} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-800">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-white flex flex-col border-r border-gray-200">
                <div className="h-20 flex items-center justify-center px-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-indigo-600 text-center">
                        <span className="text-3xl">🤖</span> Analyzer
                    </h1>
                </div>
                <nav className="flex-1 mt-6 space-y-2">
                    <NavItem icon={<DashboardIcon />} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => handleViewChange('dashboard')} />
                    <NavItem icon={<AnalyzerIcon />} label="System Analyzer" isActive={activeView === 'analyzer'} onClick={() => handleViewChange('analyzer')} />
                    <NavItem icon={<KnowledgeBaseIcon />} label="Doc Intelligence" isActive={activeView === 'rag'} onClick={() => handleViewChange('rag')} />
                    <NavItem icon={<UsersIcon />} label="User Management" isActive={activeView === 'users'} onClick={() => handleViewChange('users')} />
                    <NavItem icon={<SettingsIcon />} label="Configuration" isActive={activeView === 'settings'} onClick={() => handleViewChange('settings')} />
                </nav>
                <div className="p-4 border-t border-gray-200">
                     <button
                        onClick={onLogout}
                        className="flex items-center w-full px-4 py-3 text-left text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-md"
                    >
                        <LogoutIcon />
                        <span className="ml-4 font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center justify-end px-8">
                    <div className="text-right">
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-indigo-600">{user.role}</p>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                    {renderView()}
                </main>
            </div>
            <AIAssistant context={analysisContext} config={ragConfig} />
        </div>
    );
};
