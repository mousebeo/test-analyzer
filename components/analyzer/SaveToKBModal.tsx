import React, { useState } from 'react';

interface SaveToKBModalProps {
    onClose: () => void;
    onSave: (machineName: string) => void;
    isSaving: boolean;
}

export const SaveToKBModal: React.FC<SaveToKBModalProps> = ({ onClose, onSave, isSaving }) => {
    const [machineName, setMachineName] = useState('');

    const handleSaveClick = () => {
        if (machineName.trim()) {
            onSave(machineName.trim());
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
                <h2 id="modal-title" className="text-xl font-bold text-cyan-400">Save to Knowledge Base</h2>
                <p className="text-gray-400 mt-2 text-sm">
                    Provide a context name for this analysis report. This helps you find it later when chatting with your documents.
                </p>
                <div className="mt-4">
                    <label htmlFor="machineName" className="block text-sm font-medium text-gray-300">
                        Machine or Context Name
                    </label>
                    <input
                        type="text"
                        id="machineName"
                        value={machineName}
                        onChange={(e) => setMachineName(e.target.value)}
                        placeholder="e.g., 'Production Server A', 'Staging TIBCO'"
                        className="mt-1 w-full p-2 bg-gray-700 rounded-md text-white border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        autoFocus
                    />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveClick}
                        disabled={isSaving || !machineName.trim()}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-md transition-colors flex items-center disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isSaving && (
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};