
import React, { useState } from 'react';
import { User, AnalysisResult } from '../types';
import { DashboardIcon, AnalyzerIcon, UsersIcon, LogoutIcon } from '../assets/icons';
import { DashboardView } from './DashboardView';
import { AnalyzerView } from './AnalyzerView';
import { UserManagementView } from './UserManagementView';
import { AIAssistant } from './AIAssistant';
import * as sessionService from '../services/sessionService';

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
}

type View = 'dashboard' | 'analyzer' | 'users';

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
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
        }`}
    >
        {icon}
        <span className="ml-4 font-medium">{label}</span>
    </button>
);


export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout }) => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [loadedResult, setLoadedResult] = useState<AnalysisResult | null>(null);

    const handleViewChange = (view: View) => {
        if (view !== 'analyzer') {
            setLoadedResult(null);
        }
        setActiveView(view);
    };

    const handleLoadSession = (sessionId: string) => {
        const session = sessionService.getSession(sessionId);
        if (session) {
            setLoadedResult(session.result);
            setActiveView('analyzer');
        }
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardView user={user} setActiveView={handleViewChange} onLoadSession={handleLoadSession} />;
            case 'analyzer':
                return <AnalyzerView initialResult={loadedResult} onClearInitialResult={() => setLoadedResult(null)} />;
            case 'users':
                return <UserManagementView />;
            default:
                return <DashboardView user={user} setActiveView={handleViewChange} onLoadSession={handleLoadSession} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-gray-800 flex flex-col">
                <div className="h-20 flex items-center justify-center px-4 border-b border-gray-700">
                    <h1 className="text-xl font-bold text-cyan-400 text-center">
                        <span className="text-3xl">🤖</span> Analyzer
                    </h1>
                </div>
                <nav className="flex-1 mt-6 space-y-2">
                    <NavItem icon={<DashboardIcon />} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => handleViewChange('dashboard')} />
                    <NavItem icon={<AnalyzerIcon />} label="System Analyzer" isActive={activeView === 'analyzer'} onClick={() => handleViewChange('analyzer')} />
                    <NavItem icon={<UsersIcon />} label="User Management" isActive={activeView === 'users'} onClick={() => handleViewChange('users')} />
                </nav>
                <div className="p-4 border-t border-gray-700">
                     <button
                        onClick={onLogout}
                        className="flex items-center w-full px-4 py-3 text-left text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200 rounded-md"
                    >
                        <LogoutIcon />
                        <span className="ml-4 font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 flex items-center justify-end px-8">
                    <div className="text-right">
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="text-xs text-cyan-400">{user.role}</p>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {renderView()}
                </main>
            </div>
            <AIAssistant />
        </div>
    );
};
