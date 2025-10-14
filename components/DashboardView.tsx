
import React, { useState, useEffect } from 'react';
import { User, Session } from '../types';
import { AnalyzerIcon, UsersIcon } from '../assets/icons';
import * as sessionService from '../services/sessionService';

interface DashboardViewProps {
    user: User;
    setActiveView: (view: 'dashboard' | 'analyzer' | 'users') => void;
    onLoadSession: (sessionId: string) => void;
}

const ActionCard: React.FC<{
    icon: React.ReactElement;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700/50 hover:ring-2 hover:ring-cyan-500 transition-all text-left h-full"
    >
        <div className="flex items-center text-cyan-400">
            {icon}
            <h3 className="ml-4 text-xl font-semibold text-gray-100">{title}</h3>
        </div>
        <p className="mt-2 text-gray-400">{description}</p>
    </button>
);

const SessionList: React.FC<{ onLoadSession: (id: string) => void }> = ({ onLoadSession }) => {
    const [sessions, setSessions] = useState<Session[]>([]);

    useEffect(() => {
        setSessions(sessionService.getSessions());
    }, []);

    const handleDelete = (id: string) => {
        sessionService.deleteSession(id);
        setSessions(sessions.filter(s => s.id !== id));
    };

    if (sessions.length === 0) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg text-center">
                <p className="text-gray-400">No saved sessions found.</p>
                <p className="text-sm text-gray-500 mt-1">Completed analyses will appear here automatically.</p>
            </div>
        )
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {sessions.map(session => (
                            <tr key={session.id} className="hover:bg-gray-700/40 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{session.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(session.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {session.result.analysisType}
                                    {session.result.role && ` (${session.result.role})`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => onLoadSession(session.id)} className="text-cyan-400 hover:text-cyan-300">View</button>
                                    <button onClick={() => handleDelete(session.id)} className="text-red-400 hover:text-red-300">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


export const DashboardView: React.FC<DashboardViewProps> = ({ user, setActiveView, onLoadSession }) => {
    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-white">Welcome back, {user.name.split(' ')[0]}!</h1>
                <p className="mt-2 text-lg text-gray-400">Here's what you can do today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ActionCard
                    icon={<AnalyzerIcon />}
                    title="Analyze System Reports"
                    description="Upload log files or connect to Kubernetes to perform a fast local analysis or leverage AI for an in-depth, persona-based breakdown."
                    onClick={() => setActiveView('analyzer')}
                />
                <ActionCard
                    icon={<UsersIcon />}
                    title="Manage Users & Roles"
                    description="View the list of current users in the system and their assigned roles. (This is a mock-up for demonstration purposes)."
                    onClick={() => setActiveView('users')}
                />
            </div>

            <div>
                <h2 className="text-3xl font-bold text-white mb-4">Recent Analysis Sessions</h2>
                <SessionList onLoadSession={onLoadSession} />
            </div>
        </div>
    );
};
