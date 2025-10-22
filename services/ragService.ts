
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

// --- Helper to resolve URL placeholders ---
function resolveUrl(template: string, config: RAGConfig, context: 'embedding' | 'vectorDB'): string {
    let url = template;
    const { vectorDB, embedding } = config;

    if (context === 'embedding') {
        if (embedding.type === 'Ollama') {
            url = url.replace('{host}', embedding.config.host || '');
            url = url.replace('{model}', embedding.config.model || '');
        }
        if (embedding.type === 'GoogleAI') {
            url = url.replace('{apiKey}', embedding.config.apiKey || '');
            url = url.replace('{model}', embedding.config.model || '');
        }
    }

    if (context === 'vectorDB') {
        if (vectorDB.type === 'Pinecone' || vectorDB.type === 'Qdrant' || vectorDB.type === 'Weaviate' || vectorDB.type === 'ChromaDB') {
            url = url.replace('{host}', (vectorDB.config as any).host || '');
        }
        // Specific check for apiKey
        if (vectorDB.type === 'Pinecone' || vectorDB.type === 'Qdrant' || vectorDB.type === 'Weaviate') {
             url = url.replace('{apiKey}', (vectorDB.config as any).apiKey || '');
        }
    }

    return url;
}


// --- Embedding Implementations ---

async function embedWithOllama(texts: string[], config: RAGConfig): Promise<number[][]> {
    const { model } = config.embedding.config as { model: string };
    const apiUrl = resolveUrl(config.apiEndpoints.ollamaEmbed, config, 'embedding');

    const promises = texts.map(text => 
        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt: text }),
        }).then(async response => {
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ error: 'Unknown error structure' }));
                const errorMessage = errorBody.error || await response.text();
                throw new Error(`Ollama API error (${response.status}): ${errorMessage}`);
            }
            const data = await response.json();
            if (data.error) throw new Error(`Ollama API error: ${data.error}`);
            if (!data.embedding || !Array.isArray(data.embedding)) {
                throw new Error(`Invalid embedding response from Ollama: ${JSON.stringify(data)}`);
            }
            return data.embedding;
        })
    );

    return Promise.all(promises);
}


async function embedWithGoogleAI(texts: string[], config: RAGConfig): Promise<number[][]> {
    const { model } = config.embedding.config as { model: string };
    const apiUrl = resolveUrl(config.apiEndpoints.googleAIEmbed, config, 'embedding');
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            requests: texts.map(text => ({
                model: `models/${model}`,
                content: { parts: [{ text }] }
            }))
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google AI Embedding API error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    if (!data.embeddings || !Array.isArray(data.embeddings)) {
        throw new Error("Google AI returned an invalid embedding response.");
    }
    return data.embeddings.map((e: { values: number[] }) => e.values);
}

// --- Vector DB Implementations ---

async function upsertToPinecone(vectors: VectorPayload[], config: RAGConfig): Promise<void> {
    const { apiKey } = config.vectorDB.config as { apiKey: string };
    const apiUrl = resolveUrl(config.apiEndpoints.pineconeUpsert, config, 'vectorDB');
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey },
        body: JSON.stringify({ vectors }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinecone API error: ${response.statusText} - ${errorText}`);
    }
}

async function queryPinecone(vector: number[], topK: number, config: RAGConfig): Promise<VectorQueryResult[]> {
    const { apiKey } = config.vectorDB.config as { apiKey: string };
    const apiUrl = resolveUrl(config.apiEndpoints.pineconeQuery, config, 'vectorDB');
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey },
        body: JSON.stringify({ vector, topK, includeMetadata: true, includeValues: false }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinecone query error: ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    return data.matches || [];
}

async function upsertToWeaviate(vectors: VectorPayload[], config: RAGConfig): Promise<void> {
    const { apiKey } = config.vectorDB.config as { apiKey: string };
    const apiUrl = resolveUrl(config.apiEndpoints.weaviateUpsert, config, 'vectorDB');

    const weaviateObjects = vectors.map(v => ({
        class: 'Document', // A default class name
        id: v.id,
        properties: {
            text: v.metadata.text,
        },
        vector: v.values,
    }));

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ objects: weaviateObjects }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Weaviate API error during upsert (${response.status}): ${errorText}`);
    }
    const responseData = await response.json();
    if (responseData.results) {
        const errors = responseData.results.filter((r: any) => r.result?.status === 'FAILED');
        if (errors.length > 0) {
            throw new Error(`Weaviate failed to upsert ${errors.length} vectors. First error: ${JSON.stringify(errors[0].result.errors)}`);
        }
    }
}

async function queryWeaviate(vector: number[], topK: number, config: RAGConfig): Promise<VectorQueryResult[]> {
    const { apiKey } = config.vectorDB.config as { apiKey: string };
    const apiUrl = resolveUrl(config.apiEndpoints.weaviateQuery, config, 'vectorDB');

    const query = {
        query: `
            {
              Get {
                Document(
                  nearVector: {
                    vector: [${vector.join(',')}]
                  }
                  limit: ${topK}
                ) {
                  text
                  _additional {
                    id
                    certainty
                    vector
                  }
                }
              }
            }
        `
    };

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(query),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Weaviate query error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (data.errors) {
        throw new Error(`Weaviate GraphQL error: ${JSON.stringify(data.errors)}`);
    }
    
    const results = data.data?.Get?.Document || [];

    return results.map((res: any) => ({
        id: res._additional.id,
        score: res._additional.certainty,
        values: res._additional.vector,
        metadata: {
            text: res.text,
        },
    }));
}

// --- Dispatcher Functions ---

async function embedTexts(texts: string[], config: RAGConfig): Promise<number[][]> {
    try {
        if (texts.some(t => !t || typeof t !== 'string' || t.trim() === '')) {
            throw new Error("One of the text chunks to embed is empty or invalid.");
        }
        switch (config.embedding.type) {
            case 'Ollama':
                return await embedWithOllama(texts, config);
            case 'GoogleAI':
                return await embedWithGoogleAI(texts, config);
            default:
                throw new Error(`Unsupported embedding provider: ${(config.embedding as any).type}`);
        }
    } catch (error) {
        console.error("Error during embedding:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate embeddings via ${config.embedding.type}. ${error.message}`);
        }
        throw new Error("An unknown error occurred during embedding generation.");
    }
}

async function upsertVectors(vectors: VectorPayload[], config: RAGConfig): Promise<void> {
    if (vectors.some(v => !v.values || v.values.length === 0)) {
        const problematicChunkIndex = vectors.findIndex(v => !v.values || v.values.length === 0);
        const problematicChunkText = vectors[problematicChunkIndex]?.metadata?.text.substring(0, 200) + '...';
        throw new Error(`Cannot upsert vectors with empty values. Embedding generation likely failed for a chunk starting with: "${problematicChunkText}"`);
    }
    try {
        switch (config.vectorDB.type) {
            case 'Pinecone':
                return await upsertToPinecone(vectors, config);
            case 'Weaviate':
                return await upsertToWeaviate(vectors, config);
            // Add other DB implementations here
            default:
                throw new Error(`Vector DB type "${config.vectorDB.type}" is not yet implemented.`);
        }
    } catch(error) {
        console.error("Error upserting vectors:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to upsert vectors to ${config.vectorDB.type}. ${error.message}`);
        }
        throw new Error("An unknown error occurred while upserting vectors.");
    }
}

async function queryVectors(vector: number[], topK: number, config: RAGConfig): Promise<VectorQueryResult[]> {
     try {
        switch (config.vectorDB.type) {
            case 'Pinecone':
                return await queryPinecone(vector, topK, config);
            case 'Weaviate':
                return await queryWeaviate(vector, topK, config);
            // Add other DB implementations here
            default:
                throw new Error(`Vector DB type "${config.vectorDB.type}" is not yet implemented.`);
        }
    } catch(error) {
        console.error("Error querying vectors:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to query knowledge base from ${config.vectorDB.type}. ${error.message}`);
        }
        throw new Error("An unknown error occurred while querying the knowledge base.");
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
        
        const [questionEmbedding] = await embedTexts([question], config);
        if (!questionEmbedding) throw new Error("Could not generate an embedding for the question.");

        const queryResults = await queryVectors(questionEmbedding, 5, config);
        if (queryResults.length === 0) {
            return "I couldn't find any relevant information in the knowledge base to answer that question.";
        }

        const context = queryResults.map(result => result.metadata.text).join("\n\n---\n\n");
        const answer = await geminiService.getRAGCompletion(question, context);
        return answer;

    } catch (error) {
        console.error('Error in askQuestion pipeline:', error);
        return `Sorry, an error occurred while processing your question. ${error instanceof Error ? error.message : ''}`;
    }
}

export function deleteDocument(docId: string): IndexedDocument[] {
    let docs = getIndexedDocuments();
    docs = docs.filter(d => d.id !== docId);
    saveIndexedDocuments(docs);
    return docs;
}
