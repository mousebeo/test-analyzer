import { RAGConfig, IndexedDocument, PineconeVector, PineconeQueryResult } from '../types';
import { chunkText } from './textUtils';
import * as geminiService from './geminiService';

const RAG_CONFIG_KEY = 'ragConfig';
const INDEXED_DOCS_KEY = 'indexedDocuments';

// --- Configuration Management ---
export function getConfig(): RAGConfig {
  try {
    const configJson = localStorage.getItem(RAG_CONFIG_KEY);
    if (configJson) {
      return JSON.parse(configJson);
    }
  } catch (error) {
    console.error("Failed to retrieve RAG config:", error);
  }
  // Default values provided by the user
  return {
    pineconeApiKey: 'pcsk_2mm6om_McxDT5UZd1N1dtpUbwbEw5ESERSGtxduMffEePCbMfa5XzW7RFxUPxSbe4JAZum',
    pineconeHost: 'https://myindex-g2dj8mh.svc.aped-4627-b74a.pinecone.io',
    ollamaHost: 'https://milana-hydrokinetic-undeviatingly.ngrok-free.dev',
    ollamaModel: 'mxbai-embed-large',
  };
}

export function saveConfig(config: RAGConfig): void {
  try {
    localStorage.setItem(RAG_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
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

// --- Core Vector DB operations ---

async function embedTexts(texts: string[], config: RAGConfig): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
        try {
            const response = await fetch(`${config.ollamaHost}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.ollamaModel,
                    prompt: text,
                }),
            });
            if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
            const data = await response.json();
            embeddings.push(data.embedding);
        } catch (error) {
            console.error("Error embedding text chunk:", text.substring(0, 100), error);
            throw new Error("Failed to generate embeddings via Ollama. Check host/model config and ensure the service is running.");
        }
    }
    return embeddings;
}

async function upsertToPinecone(vectors: PineconeVector[], config: RAGConfig): Promise<void> {
    try {
        const response = await fetch(`${config.pineconeHost}/vectors/upsert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': config.pineconeApiKey,
            },
            body: JSON.stringify({ vectors }),
        });
        if (!response.ok) {
             const errorText = await response.text();
             throw new Error(`Pinecone API error: ${response.statusText} - ${errorText}`);
        }
    } catch (error) {
        console.error("Error upserting to Pinecone:", error);
        throw new Error("Failed to upsert vectors to Pinecone. Check API key and host configuration.");
    }
}

async function queryPinecone(vector: number[], topK: number, config: RAGConfig): Promise<PineconeQueryResult[]> {
    try {
         const response = await fetch(`${config.pineconeHost}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': config.pineconeApiKey,
            },
            body: JSON.stringify({
                vector,
                topK,
                includeMetadata: true,
                includeValues: false,
            }),
        });
        if (!response.ok) {
             const errorText = await response.text();
             throw new Error(`Pinecone query error: ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        return data.matches || [];
    } catch(error) {
        console.error("Error querying Pinecone:", error);
        throw new Error("Failed to query Pinecone. Check API key and host configuration.");
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
    const fileContent = await fileToText(file);
    const chunks = chunkText(fileContent, { chunkSize: 750, chunkOverlap: 75 });
    
    const contextualChunks = chunks.map(chunk => {
        if(metadataContext.machineName) {
            return `[Machine: ${metadataContext.machineName} Date: ${new Date().toISOString()}] ${chunk}`;
        }
        return chunk;
    });

    const embeddings = await embedTexts(contextualChunks, config);
    
    const vectors: PineconeVector[] = embeddings.map((embedding, i) => ({
        id: `${file.name}_${Date.now()}_${i}`,
        values: embedding,
        metadata: { text: contextualChunks[i] },
    }));

    await upsertToPinecone(vectors, config);

  } catch (error) {
    console.error(`Failed to process document ${file.name}:`, error);
    finalStatus = 'error';
  }

  // Update the document with the final status
  const finalDocs = getIndexedDocuments();
  const docToUpdate = finalDocs.find(d => d.id === newDoc.id);
  if (docToUpdate) {
    docToUpdate.status = finalStatus;
    saveIndexedDocuments(finalDocs);
    updateCallback(finalDocs);
  }
}

export async function askQuestion(question: string, config: RAGConfig): Promise<string> {
    try {
        if (!question.trim()) return "Please ask a question.";
        
        // 1. Embed the user's question
        const [questionEmbedding] = await embedTexts([question], config);
        if (!questionEmbedding) {
            throw new Error("Could not generate an embedding for the question.");
        }

        // 2. Query Pinecone to find relevant text chunks
        const queryResults = await queryPinecone(questionEmbedding, 5, config);
        
        if (queryResults.length === 0) {
            return "I couldn't find any relevant information in the knowledge base to answer that question.";
        }

        // 3. Assemble the context from the results
        const context = queryResults
            .map(result => result.metadata.text)
            .join("\n\n---\n\n");

        // 4. Call Gemini with the context and question
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