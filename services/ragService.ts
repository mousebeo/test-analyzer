import { RAGConfig, IndexedDocument, VectorPayload, VectorQueryResult, VectorDBConfig, EmbeddingConfig, APIEndpoints } from '../types';
import { chunkText } from './textUtils';
import * as geminiService from './geminiService';

const RAG_CONFIG_KEY = 'ragConfig';
const INDEXED_DOCS_KEY = 'indexedDocuments';

// --- Default Configurations ---
export const defaultVectorDBConfig = (type: RAGConfig['vectorDB']['type']): VectorDBConfig => {
    switch (type) {
        case 'Pinecone': return { type, config: { apiKey: '', host: '' } };
        case 'Qdrant': return { type, config: { apiKey: '', host: '' } };
        case 'Weaviate': return { type, config: { apiKey: '', host: '' } };
        case 'ChromaDB': return { type, config: { host: '' } };
        default: return { type: 'Pinecone', config: { apiKey: '', host: '' } };
    }
};

export const defaultEmbeddingConfig = (type: RAGConfig['embedding']['type']): EmbeddingConfig => {
    switch (type) {
        case 'Ollama': return { type, config: { host: 'http://localhost:11434', model: 'mxbai-embed-large' } };
        case 'GoogleAI': return { type, config: { apiKey: '', model: 'embedding-001' } };
        default: return { type: 'Ollama', config: { host: 'http://localhost:11434', model: 'mxbai-embed-large' } };
    }
};

const defaultAPIEndpoints: APIEndpoints = {
    ollamaEmbed: '{host}/api/embeddings',
    googleAIEmbed: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:batchEmbedContents?key={apiKey}',
    pineconeUpsert: '{host}/vectors/upsert',
    pineconeQuery: '{host}/query',
    weaviateUpsert: '{host}/v1/batch/objects',
    weaviateQuery: '{host}/v1/graphql',
    processDocument: '',
    ragQuery: '',
    docIntelligenceChatApi: '',
};

// --- Configuration Management ---
export function getConfig(): RAGConfig {
  try {
    const configJson = localStorage.getItem(RAG_CONFIG_KEY);
    if (configJson) {
      const parsedConfig = JSON.parse(configJson);
      // Ensure apiEndpoints exists and has all keys, merging with defaults if needed.
      parsedConfig.apiEndpoints = { ...defaultAPIEndpoints, ...parsedConfig.apiEndpoints };
      return parsedConfig;
    }
  } catch (error) {
    console.error("Failed to retrieve RAG config:", error);
  }
  // Return a fresh default if nothing is stored
  return {
    vectorDB: defaultVectorDBConfig('Pinecone'),
    embedding: defaultEmbeddingConfig('Ollama'),
    apiEndpoints: defaultAPIEndpoints,
  };
}

export function saveConfig(config: RAGConfig): void {
  try {
    localStorage.setItem(RAG_CONFIG_KEY, JSON.stringify(config));
  } catch (error)
 {
    console.error("Failed to save RAG config:", error);
  }
}


// --- Document List Management (localStorage) ---
export function getIndexedDocuments(): IndexedDocument[] {
  try {
    const docsJson = localStorage.getItem(INDEXED_DOCS_KEY);
    return docsJson ? JSON.parse(docsJson) : [];
  } catch (error) {
    console.error("Failed to retrieve indexed documents:", error);
    return [];
  }
}

function saveIndexedDocuments(documents: IndexedDocument[]): void {
  try {
    localStorage.setItem(INDEXED_DOCS_KEY, JSON.stringify(documents));
  } catch (error) {
    console.error("Failed to save indexed documents:", error);
  }
}

// --- High-level functions for UI ---

async function fileToText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}

export async function uploadDocument(
  file: File,
  config: RAGConfig,
  updateCallback: (docs: IndexedDocument[]) => void,
  metadataContext: { machineName?: string } = {}
): Promise<void> {
  const docs = getIndexedDocuments();
  const newDoc: IndexedDocument = { id: `doc_${Date.now()}`, name: file.name, status: 'indexing', uploadedAt: Date.now() };
  const updatedDocs = [newDoc, ...docs];
  saveIndexedDocuments(updatedDocs);
  updateCallback(updatedDocs);

  let finalStatus: 'ready' | 'error' = 'ready';

  try {
    const processUrl = config.apiEndpoints.processDocument;
    if (!processUrl) {
      throw new Error("The document processing service URL is not configured. Please set it in the Configuration tab.");
    }

    const formData = new FormData();
    formData.append('file', file);
    if (metadataContext.machineName) {
        formData.append('contextName', metadataContext.machineName);
    }
    // Pass necessary configs to the backend service
    formData.append('vectorDBConfig', JSON.stringify(config.vectorDB));
    formData.append('embeddingConfig', JSON.stringify(config.embedding));
    formData.append('apiEndpoints', JSON.stringify(config.apiEndpoints));

    const response = await fetch(processUrl, {
        method: 'POST',
        body: formData,
        // In a real app, you might add authentication headers here
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Document processing service failed (${response.status}): ${errorText}`);
    }

    console.log(`Document ${file.name} successfully submitted to processing service.`);

  } catch (error) {
    console.error(`Failed to process document ${file.name}:`, error);
    finalStatus = 'error';
    throw error;
  } finally {
    const finalDocs = getIndexedDocuments();
    const docToUpdate = finalDocs.find(d => d.id === newDoc.id);
    if (docToUpdate) {
      docToUpdate.status = finalStatus;
      saveIndexedDocuments(finalDocs);
      updateCallback(finalDocs);
    }
  }
}

export async function askQuestion(question: string, config: RAGConfig): Promise<string> {
    try {
        if (!question.trim()) return "Please ask a question.";

        const customChatUrl = config.apiEndpoints.docIntelligenceChatApi;
        const ragQueryUrl = config.apiEndpoints.ragQuery;

        if (customChatUrl) {
            // Use the new, simplified API that expects {question: "..."} and returns text
            const response = await fetch(customChatUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Document Intelligence Chat API failed (${response.status}): ${errorText}`);
            }
            // Assume the response body is the answer text directly
            return response.text();
        } 
        
        if (ragQueryUrl) {
            // Use the existing, more complex RAG query service
            const response = await fetch(ragQueryUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    ragConfig: config,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`RAG query service failed (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            if (!data.answer) {
                throw new Error("Invalid response from RAG query service. 'answer' field is missing.");
            }
            return data.answer;
        }

        // If neither URL is configured, throw an error.
        throw new Error("Neither the Document Intelligence Chat API nor the RAG Query Service URL is configured. Please set one in the Configuration tab.");

    } catch (error) {
        console.error('Error in askQuestion pipeline:', error);
         if (error instanceof TypeError && error.message === 'Failed to fetch') {
             throw new Error(`Could not connect to the configured Chat/Query Service. Please ensure the service is running and the URL is correct.`);
        }
        if (error instanceof Error) {
            // Re-throw specific errors to be displayed in the UI
            throw error;
        }
        throw new Error(`Sorry, an unknown error occurred while processing your question.`);
    }
}


export function deleteDocument(docId: string): IndexedDocument[] {
    let docs = getIndexedDocuments();
    docs = docs.filter(d => d.id !== docId);
    saveIndexedDocuments(docs);
    return docs;
}