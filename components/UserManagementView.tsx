
import React from 'react';
import { User, Role } from '../types';

const mockUsers: User[] = [
    { id: 1, name: 'Administrator', role: 'Administrator' },
    { id: 2, name: 'Executive User', role: 'Executive' },
    { id: 3, name: 'Developer User', role: 'Developer' },
    { id: 4, name: 'Jane Doe', role: 'Administrator' },
    { id: 5, name: 'John Smith', role: 'Developer' },
];

const roleColors: Record<Role, string> = {
    Administrator: 'bg-cyan-800 text-cyan-200',
    Executive: 'bg-purple-800 text-purple-200',
    Developer: 'bg-amber-800 text-amber-200',
};

export const UserManagementView: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-6">User Management</h1>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {mockUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-700/40 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                    {user.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="text-green-400">Active</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <p className="text-sm text-gray-500 mt-4 text-center">
                This is a static, mock view for demonstration purposes.
            </p>
        </div>
    );
};
