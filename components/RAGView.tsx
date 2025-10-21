import React, { useState, useEffect, useCallback } from 'react';
import { RAGConfig, IndexedDocument } from '../types';
import * as ragService from '../services/ragService';
import { RAGUploadView } from './rag/RAGUploadView';
import { RAGChatView } from './rag/RAGChatView';
import { RAGConfigView } from './rag/RAGConfigView';

type RAGTab = 'upload' | 'chat' | 'config';

interface RAGViewProps {
    documents: IndexedDocument[];
    config: RAGConfig;
    onSaveConfig: (newConfig: RAGConfig) => void;
    onUpload: (file: File) => Promise<void>;
    onDelete: (docId: string) => void;
}


const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap pb-3 px-4 border-b-2 font-medium text-lg transition-colors ${
      isActive
        ? 'border-cyan-500 text-cyan-400'
        : 'border-transparent text-gray-500 hover:text-gray-300'
    }`}
  >
    {label}
  </button>
);

export const RAGView: React.FC<RAGViewProps> = ({ documents, config, onSaveConfig, onUpload, onDelete }) => {
  const [activeTab, setActiveTab] = useState<RAGTab>('chat');

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <RAGUploadView documents={documents} onUpload={onUpload} onDelete={onDelete} config={config} />;
      case 'chat':
        return <RAGChatView config={config} />;
      case 'config':
        return <RAGConfigView config={config} onSave={onSaveConfig} />;
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white">Document Intelligence</h1>
        <p className="mt-2 text-lg text-gray-400">Upload, manage, and chat with your knowledge base.</p>
      </div>
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-6">
          <TabButton label="Ask Your Docs" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          <TabButton label="Upload Documents" isActive={activeTab === 'upload'} onClick={() => setActiveTab('upload')} />
          <TabButton label="Configuration" isActive={activeTab === 'config'} onClick={() => setActiveTab('config')} />
        </nav>
      </div>
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};
