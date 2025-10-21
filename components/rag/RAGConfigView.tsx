import React, { useState } from 'react';
import { RAGConfig } from '../../types';

interface RAGConfigViewProps {
  config: RAGConfig;
  onSave: (newConfig: RAGConfig) => void;
}

export const RAGConfigView: React.FC<RAGConfigViewProps> = ({ config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<RAGConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold text-gray-100 mb-2">Vector DB Configuration</h3>
      <p className="text-sm text-gray-400 mb-6">Configure the endpoints for your embedding model and vector database.</p>
      
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold text-cyan-400 mb-2">Embedding Model (Ollama)</h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="ollamaHost" className="block text-sm font-medium text-gray-300">Ollama Host URL</label>
              <input
                type="text"
                name="ollamaHost"
                id="ollamaHost"
                value={localConfig.ollamaHost}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                placeholder="e.g., http://localhost:11434"
              />
            </div>
             <div>
              <label htmlFor="ollamaModel" className="block text-sm font-medium text-gray-300">Embedding Model Name</label>
              <input
                type="text"
                name="ollamaModel"
                id="ollamaModel"
                value={localConfig.ollamaModel}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                placeholder="e.g., mxbai-embed-large"
              />
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700"></div>

        <div>
           <h4 className="text-lg font-semibold text-cyan-400 mb-2">Vector Database (Pinecone)</h4>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="pineconeApiKey" className="block text-sm font-medium text-gray-300">Pinecone API Key</label>
                    <input
                        type="password"
                        name="pineconeApiKey"
                        id="pineconeApiKey"
                        value={localConfig.pineconeApiKey}
                        onChange={handleChange}
                        className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                        placeholder="Enter your Pinecone API key"
                    />
                </div>
                 <div>
                    <label htmlFor="pineconeHost" className="block text-sm font-medium text-gray-300">Pinecone Host URL</label>
                    <input
                        type="text"
                        name="pineconeHost"
                        id="pineconeHost"
                        value={localConfig.pineconeHost}
                        onChange={handleChange}
                        className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                        placeholder="e.g., https://my-index-12345.svc.host.pinecone.io"
                    />
                </div>
            </div>
        </div>

        <div className="flex justify-end items-center pt-4">
            {isSaved && <p className="text-sm text-green-400 mr-4">Configuration saved!</p>}
            <button
                onClick={handleSave}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
                Save
            </button>
        </div>
      </div>
    </div>
  );
};