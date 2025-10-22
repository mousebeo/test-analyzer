
import React, { useState } from 'react';

interface SaveToKBModalProps {
    onClose: () => void;
    onPreview: (machineName: string) => void;
}

export const SaveToKBModal: React.FC<SaveToKBModalProps> = ({ onClose, onPreview }) => {
    const [machineName, setMachineName] = useState('');

    const handlePreviewClick = () => {
        if (machineName.trim()) {
            onPreview(machineName.trim());
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
                <h2 id="modal-title" className="text-xl font-bold text-indigo-600">Save to Knowledge Base</h2>
                <p className="text-gray-500 mt-2 text-sm">
                    Provide a context name for this analysis report. This helps you find it later when chatting with your documents.
                </p>
                <div className="mt-4">
                    <label htmlFor="machineName" className="block text-sm font-medium text-gray-700">
                        Machine or Context Name
                    </label>
                    <input
                        type="text"
                        id="machineName"
                        value={machineName}
                        onChange={(e) => setMachineName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePreviewClick()}
                        placeholder="e.g., 'Production Server A', 'Staging TIBCO'"
                        className="mt-1 w-full p-2 bg-gray-100 rounded-md text-gray-900 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        autoFocus
                    />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePreviewClick}
                        disabled={!machineName.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Review & Save
                    </button>
                </div>
            </div>
        </div>
    );
};