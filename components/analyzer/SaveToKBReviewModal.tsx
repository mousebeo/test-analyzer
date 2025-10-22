import React, { useState, useEffect } from 'react';
import * as geminiService from '../../services/geminiService';
import { chunkText } from '../../services/textUtils';


interface SaveToKBReviewModalProps {
    onClose: () => void;
    onSave: (chunks: string[]) => void;
    isSaving: boolean;
    initialChunks: string[];
    contextName: string;
}

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const SaveToKBReviewModal: React.FC<SaveToKBReviewModalProps> = ({ onClose, onSave, isSaving, initialChunks, contextName }) => {
    const [editableChunks, setEditableChunks] = useState<string[]>([]);
    const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | null>(null);
    const [isAiRechunking, setIsAiRechunking] = useState(false);
    const [rechunkError, setRechunkError] = useState<string | null>(null);


    useEffect(() => {
        setEditableChunks(initialChunks);
    }, [initialChunks]);

    const handleChunkChange = (index: number, value: string) => {
        const newChunks = [...editableChunks];
        newChunks[index] = value;
        setEditableChunks(newChunks);
    };
    
    const handleDeleteChunk = (index: number) => {
        const newChunks = editableChunks.filter((_, i) => i !== index);
        setEditableChunks(newChunks);
        if (selectedChunkIndex === index) {
            setSelectedChunkIndex(null);
        }
    };

    const handleSaveClick = () => {
        onSave(editableChunks.filter(chunk => chunk.trim().length > 0)); // Filter out empty chunks on save
    };
    
    const handleRechunkSelected = () => {
        if (selectedChunkIndex === null) return;
        const chunkToSplit = editableChunks[selectedChunkIndex];
        const newSubChunks = chunkText(chunkToSplit, { chunkSize: 1800, chunkOverlap: 150 });
        
        const newChunks = [...editableChunks];
        newChunks.splice(selectedChunkIndex, 1, ...newSubChunks);
        setEditableChunks(newChunks);
        setSelectedChunkIndex(null);
    };
    
    const handleRechunkAllWithAI = async () => {
        setIsAiRechunking(true);
        setRechunkError(null);
        try {
            const fullText = editableChunks.join('\n\n---\n\n');
            const aiChunks = await geminiService.rechunkTextWithAI(fullText);
            setEditableChunks(aiChunks);
        } catch (error) {
            setRechunkError(error instanceof Error ? error.message : "An unknown error occurred.");
        } finally {
            setIsAiRechunking(false);
        }
    };


    return (
        <div 
            className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl border border-gray-200 flex flex-col h-[80vh]">
                <h2 id="modal-title" className="text-xl font-bold text-indigo-600">Review Chunks for '{contextName}'</h2>
                <p className="text-gray-500 mt-2 text-sm">
                    This is the content that will be saved to the knowledge base. You can edit or remove chunks before saving.
                </p>
                <div className="mt-4 flex-1 overflow-y-auto pr-2 space-y-3">
                    {editableChunks.map((chunk, index) => (
                        <div key={index} className="relative group">
                            <textarea
                                value={chunk}
                                onClick={() => setSelectedChunkIndex(index)}
                                onChange={(e) => handleChunkChange(index, e.target.value)}
                                className={`w-full p-2 bg-gray-50 rounded-md text-gray-800 text-sm border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y transition-shadow ${
                                    selectedChunkIndex === index ? 'ring-2 ring-indigo-500 shadow-md' : ''
                                }`}
                                rows={Math.max(3, Math.ceil(chunk.length / 80))}
                            />
                            <button 
                                onClick={() => handleDeleteChunk(index)}
                                className="absolute top-2 right-2 p-1 bg-gray-200 hover:bg-red-500 hover:text-white text-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Delete chunk"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>

                {rechunkError && <p className="text-xs text-red-500 text-center mt-2">{rechunkError}</p>}

                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-4 gap-4">
                    <div className="flex space-x-2">
                         <button
                            onClick={handleRechunkSelected}
                            disabled={selectedChunkIndex === null || isSaving || isAiRechunking}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-md transition-colors flex items-center disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            Re-chunk Selected
                        </button>
                         <button
                            onClick={handleRechunkAllWithAI}
                            disabled={isSaving || isAiRechunking}
                            className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-sm font-semibold rounded-md transition-colors flex items-center disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            {isAiRechunking && <Spinner />}
                            <span className={isAiRechunking ? 'ml-2' : ''}>Re-chunk All with AI</span>
                        </button>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isSaving || isAiRechunking}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveClick}
                            disabled={isSaving || isAiRechunking || editableChunks.length === 0}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSaving && <Spinner />}
                            <span className={isSaving ? 'ml-2' : ''}>{isSaving ? 'Saving...' : `Save ${editableChunks.length} Chunks`}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};