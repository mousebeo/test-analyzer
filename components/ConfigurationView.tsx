
import React, { useState } from 'react';
import { RAGConfig, VectorDBType, EmbeddingProviderType } from '../types';
import * as ragService from '../services/ragService';

interface ConfigurationViewProps {
  config: RAGConfig;
  onSave: (newConfig: RAGConfig) => void;
}

const InputField: React.FC<{
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    isPassword?: boolean;
}> = ({ label, name, value, onChange, placeholder, isPassword }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type={isPassword ? 'password' : 'text'}
            name={name}
            id={name}
            value={value || ''}
            onChange={onChange}
            className="mt-1 block w-full bg-gray-100 border-gray-300 text-gray-900 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
            placeholder={placeholder}
        />
    </div>
);

const APIEndpointField: React.FC<{
    label: string;
    description: string;
    name: keyof RAGConfig['apiEndpoints'];
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, description, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <p className="text-xs text-gray-500 mt-1 mb-1">{description}</p>
        <input
            type="text"
            name={name}
            id={name}
            value={value || ''}
            onChange={onChange}
            className="block w-full bg-gray-100 border-gray-300 text-gray-900 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm font-mono text-xs"
        />
        <p className="text-xs text-gray-400 mt-1 italic">
            Placeholders: <code className="bg-gray-200 px-1 rounded-sm">{'{host}'}</code>, <code className="bg-gray-200 px-1 rounded-sm">{'{model}'}</code>, <code className="bg-gray-200 px-1 rounded-sm">{'{apiKey}'}</code> will be replaced automatically.
        </p>
    </div>
);


export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<RAGConfig>(config);
  const [isSaved, setIsSaved] = useState(false);
  
  const vectorDBTypes: VectorDBType[] = ['Pinecone', 'Qdrant', 'Weaviate', 'ChromaDB'];
  const embeddingProviderTypes: EmbeddingProviderType[] = ['Ollama', 'GoogleAI'];

  const handleDBTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as VectorDBType;
    setLocalConfig(prev => ({
      ...prev,
      vectorDB: ragService.defaultVectorDBConfig(type),
    }));
  };

  const handleEmbeddingTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as EmbeddingProviderType;
     setLocalConfig(prev => ({
      ...prev,
      embedding: ragService.defaultEmbeddingConfig(type),
    }));
  };
  
  const handleConfigChange = (
    section: 'vectorDB' | 'embedding',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setLocalConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        config: {
          ...prev[section].config,
          [name]: value,
        },
      },
    }));
  };
  
  const handleApiEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setLocalConfig(prev => ({
          ...prev,
          apiEndpoints: {
              ...prev.apiEndpoints,
              [name]: value
          }
      }));
  };

  const handleSave = () => {
    onSave(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };
  
  const renderVectorDBFields = () => {
    const { type, config } = localConfig.vectorDB;
    switch(type) {
        case 'Pinecone':
        case 'Qdrant':
            return (
                <div className="space-y-4">
                     <InputField label="Host URL" name="host" value={(config as any).host} onChange={(e) => handleConfigChange('vectorDB', e)} placeholder={`e.g., https://my-index-12345.svc.host.${type.toLowerCase()}.io`} />
                     <InputField label="API Key" name="apiKey" value={(config as any).apiKey} onChange={(e) => handleConfigChange('vectorDB', e)} placeholder={`Enter your ${type} API key`} isPassword={true} />
                </div>
            );
        case 'Weaviate':
             return (
                <div className="space-y-4">
                     <InputField label="Host URL" name="host" value={(config as any).host} onChange={(e) => handleConfigChange('vectorDB', e)} placeholder="e.g., my-cluster.weaviate.network or localhost:8080" />
                     <InputField label="API Key (for Weaviate Cloud)" name="apiKey" value={(config as any).apiKey} onChange={(e) => handleConfigChange('vectorDB', e)} placeholder="Optional for local instances" isPassword={true} />
                </div>
            );
        case 'ChromaDB':
             return (
                <div className="space-y-4">
                     <InputField label="Host URL" name="host" value={(config as any).host} onChange={(e) => handleConfigChange('vectorDB', e)} placeholder="e.g., http://localhost:8000" />
                </div>
            );
        default:
            return <p className="text-sm text-red-600">This vector database is not yet implemented.</p>;
    }
  };
  
  const renderEmbeddingFields = () => {
    const { type, config } = localConfig.embedding;
    switch(type) {
        case 'Ollama':
            return (
                <div className="space-y-4">
                    <InputField label="Ollama Host URL" name="host" value={config.host} onChange={(e) => handleConfigChange('embedding', e)} placeholder="e.g., http://localhost:11434" />
                    <InputField label="Embedding Model Name" name="model" value={config.model} onChange={(e) => handleConfigChange('embedding', e)} placeholder="e.g., mxbai-embed-large" />
                </div>
            );
        case 'GoogleAI':
             return (
                <div className="space-y-4">
                    <InputField label="Google AI API Key" name="apiKey" value={config.apiKey} onChange={(e) => handleConfigChange('embedding', e)} placeholder="Enter your Google AI API key" isPassword={true} />
                    <InputField label="Embedding Model Name" name="model" value={config.model} onChange={(e) => handleConfigChange('embedding', e)} placeholder="e.g., embedding-001" />
                </div>
            );
        default:
            return null;
    }
  };

  return (
    <div className="animate-fade-in">
        <h1 className="text-4xl font-bold text-gray-900">Configuration</h1>
        <p className="mt-2 text-lg text-gray-500">
            Manage settings for external services like embedding models and vector databases.
        </p>

        <div className="mt-8 max-w-2xl bg-white p-8 rounded-lg shadow-lg border border-gray-200">
            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold text-indigo-600 mb-4 border-b pb-2">Embedding Provider</h2>
                    <div>
                         <label htmlFor="embeddingProvider" className="block text-sm font-medium text-gray-700">Provider</label>
                         <select id="embeddingProvider" value={localConfig.embedding.type} onChange={handleEmbeddingTypeChange} className="mt-1 block w-full bg-gray-100 border-gray-300 text-gray-900 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm">
                            {embeddingProviderTypes.map(type => <option key={type} value={type}>{type}</option>)}
                         </select>
                    </div>
                    <div className="mt-4">{renderEmbeddingFields()}</div>
                </div>
                
                <div>
                    <h2 className="text-xl font-semibold text-indigo-600 mb-4 border-b pb-2">Vector Database</h2>
                     <div>
                         <label htmlFor="vectorDB" className="block text-sm font-medium text-gray-700">Database Type</label>
                         <select id="vectorDB" value={localConfig.vectorDB.type} onChange={handleDBTypeChange} className="mt-1 block w-full bg-gray-100 border-gray-300 text-gray-900 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm">
                             {vectorDBTypes.map(type => <option key={type} value={type}>{type}</option>)}
                         </select>
                    </div>
                    <div className="mt-4">{renderVectorDBFields()}</div>
                </div>

                 <div>
                    <h2 className="text-xl font-semibold text-indigo-600 mb-4 border-b pb-2">API Call Configuration</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Advanced: Override the full URL for specific API calls. The default values should work for standard setups.
                    </p>
                    <div className="space-y-6">
                        <APIEndpointField 
                            label="Document Processing Service"
                            description="The backend endpoint that receives an uploaded document for chunking, embedding, and upserting."
                            name="processDocument"
                            value={localConfig.apiEndpoints.processDocument}
                            onChange={handleApiEndpointChange}
                        />
                        <APIEndpointField 
                            label="Ollama - Embeddings"
                            description="The endpoint used to generate text embeddings from your local Ollama instance."
                            name="ollamaEmbed"
                            value={localConfig.apiEndpoints.ollamaEmbed}
                            onChange={handleApiEndpointChange}
                        />
                        <APIEndpointField 
                            label="Google AI - Embeddings"
                            description="The endpoint for Google's API to generate embeddings. The API key is appended automatically."
                            name="googleAIEmbed"
                            value={localConfig.apiEndpoints.googleAIEmbed}
                            onChange={handleApiEndpointChange}
                        />
                         <APIEndpointField 
                            label="Pinecone - Upsert"
                            description="The endpoint used to write (upsert) vectors into your Pinecone index."
                            name="pineconeUpsert"
                            value={localConfig.apiEndpoints.pineconeUpsert}
                            onChange={handleApiEndpointChange}
                        />
                         <APIEndpointField 
                            label="Pinecone - Query"
                            description="The endpoint used to query your Pinecone index to find relevant document chunks."
                            name="pineconeQuery"
                            value={localConfig.apiEndpoints.pineconeQuery}
                            onChange={handleApiEndpointChange}
                        />
                         <APIEndpointField 
                            label="Weaviate - Batch Upsert"
                            description="The endpoint for batch importing objects (vectors) into your Weaviate instance."
                            name="weaviateUpsert"
                            value={localConfig.apiEndpoints.weaviateUpsert}
                            onChange={handleApiEndpointChange}
                        />
                         <APIEndpointField 
                            label="Weaviate - GraphQL Query"
                            description="The GraphQL endpoint used to query your Weaviate instance for vector search."
                            name="weaviateQuery"
                            value={localConfig.apiEndpoints.weaviateQuery}
                            onChange={handleApiEndpointChange}
                        />
                    </div>
                </div>

                <div className="flex justify-end items-center pt-4">
                    {isSaved && <p className="text-sm text-green-600 mr-4">Configuration saved!</p>}
                    <button
                        onClick={handleSave}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
