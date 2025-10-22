
import React, { useState, useCallback, useRef } from 'react';
import { IndexedDocument, RAGConfig } from '../../types';

interface RAGUploadViewProps {
  documents: IndexedDocument[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (docId: string) => void;
  config: RAGConfig;
}

const StatusIcon: React.FC<{ status: IndexedDocument['status'] }> = ({ status }) => {
    if (status === 'indexing') {
        return (
            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        );
    }
    if (status === 'ready') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
};

const checkIsConfigured = (config: RAGConfig): boolean => {
    const { vectorDB, embedding } = config;
    let dbConfigured = false;
    switch (vectorDB.type) {
        case 'Pinecone':
        case 'Qdrant':
        case 'Weaviate':
            dbConfigured = !!(vectorDB.config.apiKey && vectorDB.config.host);
            break;
        case 'ChromaDB':
            dbConfigured = !!vectorDB.config.host;
            break;
        default:
            dbConfigured = false;
    }

    let embeddingConfigured = false;
    switch (embedding.type) {
        case 'Ollama':
            embeddingConfigured = !!(embedding.config.host && embedding.config.model);
            break;
        case 'GoogleAI':
            embeddingConfigured = !!(embedding.config.apiKey && embedding.config.model);
            break;
    }
    return dbConfigured && embeddingConfigured;
};


export const RAGUploadView: React.FC<RAGUploadViewProps> = ({ documents, onUpload, onDelete, config }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isConfigured = checkIsConfigured(config);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null); // Clear previous errors on new file selection
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);
    try {
        await onUpload(selectedFile);
        setSelectedFile(null);
    } catch (error) {
        setUploadError(error instanceof Error ? error.message : "An unknown error occurred during upload.");
    } finally {
        setIsUploading(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white border border-gray-200 p-6 rounded-lg space-y-4 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900">Upload New Document</h3>
        <div 
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4h-2m-6-4l4-4m0 0l4 4m-4-4v12" /></svg>
          <p className="mt-2 text-gray-500">{selectedFile ? selectedFile.name : 'Click to browse or drag a file'}</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.json,.html,.log"/>
        </div>
        <button
          onClick={handleUploadClick}
          disabled={!selectedFile || isUploading || !isConfigured}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload to Knowledge Base'}
        </button>
        {uploadError && (
            <p className="text-center text-sm text-red-600">{uploadError}</p>
        )}
        {!isConfigured && (
            <p className="text-center text-xs text-yellow-600">
                Please set the API endpoints and keys in the 'Configuration' tab for your selected providers.
            </p>
        )}
      </div>
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Indexed Documents</h3>
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
            {documents.length > 0 ? documents.map(doc => (
                <div key={doc.id} className="bg-gray-50 p-3 rounded-md flex items-center justify-between border border-gray-200">
                    <div className="flex items-center">
                        <StatusIcon status={doc.status} />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">Uploaded: {new Date(doc.uploadedAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <button onClick={() => onDelete(doc.id)} className="text-gray-500 hover:text-red-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            )) : (
                <p className="text-center text-gray-500 py-8">No documents have been uploaded.</p>
            )}
        </div>
      </div>
    </div>
  );
};
