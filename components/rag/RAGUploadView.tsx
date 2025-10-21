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
            <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        );
    }
    if (status === 'ready') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
};


export const RAGUploadView: React.FC<RAGUploadViewProps> = ({ documents, onUpload, onDelete, config }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isConfigured = config && config.uploadUrl;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    await onUpload(selectedFile);
    setIsUploading(false);
    setSelectedFile(null);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-gray-800 p-6 rounded-lg space-y-4">
        <h3 className="text-xl font-semibold text-gray-200">Upload New Document</h3>
        <div 
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4h-2m-6-4l4-4m0 0l4 4m-4-4v12" /></svg>
          <p className="mt-2 text-gray-400">{selectedFile ? selectedFile.name : 'Click to browse or drag a file'}</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
        <button
          onClick={handleUploadClick}
          disabled={!selectedFile || isUploading || !isConfigured}
          className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload to Knowledge Base'}
        </button>
        {!isConfigured && (
            <p className="text-center text-xs text-yellow-400">
                Please set the Document Upload API URL in the 'Configuration' tab.
            </p>
        )}
      </div>
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-200 mb-4">Indexed Documents</h3>
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
            {documents.length > 0 ? documents.map(doc => (
                <div key={doc.id} className="bg-gray-700/50 p-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                        <StatusIcon status={doc.status} />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-200">{doc.name}</p>
                            <p className="text-xs text-gray-400">Uploaded: {new Date(doc.uploadedAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <button onClick={() => onDelete(doc.id)} className="text-gray-500 hover:text-red-400 transition-colors">
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