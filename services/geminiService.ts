import { GoogleGenAI, Type, Chat } from '@google/genai';
import { AnalysisResult, DetailedThreadReport, ReportType, Role, AISummary, AIDeeperAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Define a maximum character length for file content to prevent token limit errors.
const MAX_FILE_CONTENT_LENGTH = 150000; // Approx 30k-40k tokens, leaving room for JSON and multiple files.

async function fileToText(file: File): Promise<{ name: string; content: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      let content = reader.result as string;
      if (content.length > MAX_FILE_CONTENT_LENGTH) {
        const start = content.substring(0, MAX_FILE_CONTENT_LENGTH / 2);
        const end = content.substring(content.length - MAX_FILE_CONTENT_LENGTH / 2);
        content = `[File content for "${file.name}" was truncated because it is too large]\n\n--- START OF FILE ---\n${start}\n\n[... middle of file truncated ...]\n\n--- END OF FILE ---\n${end}`;
      }
      resolve({ name: file.name, content });
    };
    reader.onerror = (error) => reject(error);
  });
}

const aiSummarySchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A concise, 2-3 sentence executive summary of the overall system health and any critical issues found, tailored to the user's role." },
        healthHighlights: {
            type: Type.ARRAY,
            description: "A list of 3-5 bullet points highlighting positive aspects or things that are working correctly.",
            items: { type: Type.STRING }
        },
        areasOfConcern: {
            type: Type.ARRAY,
            description: "A list of potential risks, performance issues, or warnings. Prioritize the most critical issues.",
            items: {
                type: Type.OBJECT,
                properties: {
                    severity: { type: Type.STRING, description: "'High', 'Medium', or 'Low'" },
                    description: { type: Type.STRING, description: "A clear, concise description of the issue." },
                }
            }
        }
    }
};

const aiDeeperAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        detailedNarrative: {
            type: Type.STRING,
            description: "A detailed, multi-paragraph narrative of the system's performance and behavior, connecting different data points (e.g., how memory usage might affect process performance)."
        },
        rootCauseAnalysis: {
            type: Type.ARRAY,
            description: "A breakdown of the most significant issues, providing a likely root cause for each.",
            items: {
                type: Type.OBJECT,
                properties: {
                    issue: { type: Type.STRING, description: "A one-sentence title for the issue (e.g., 'High Memory Churn and Garbage Collection Pauses')." },
                    analysis: { type: Type.STRING, description: "A detailed explanation of the evidence from the logs and data that points to this root cause." },
                }
            }
        },
        recommendations: {
            type: Type.ARRAY,
            description: "A list of concrete, actionable recommendations to address the identified issues.",
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING, description: "The area the recommendation applies to (e.g., 'JVM Tuning', 'Application Code', 'Infrastructure')." },
                    recommendation: { type: Type.STRING, description: "The specific recommendation (e.g., 'Increase the Xmx heap size to 8GB' or 'Investigate the high fault rate in the 'OrderProcessing' process.')." },
                }
            }
        }
    }
}


const getRoleBasedPromptInstructions = (role: Role): string => {
    switch (role) {
        case 'Executive':
            return `Focus on business impact, overall system stability, critical risks, and potential service disruptions. Use clear, non-technical business language.`;
        case 'Administrator':
            return `Focus on system resource utilization (CPU, Memory), infrastructure health, configuration issues, error rates, and identifying bottlenecks. Use technical language appropriate for an infrastructure expert.`;
        case 'Developer':
            return `Focus on application-level performance, code execution, thread behavior, memory management, and potential bugs. Use deep technical language to help pinpoint specific areas in the application that require attention.`;
    }
};

export async function getAIAnalysisSummary(localResult: AnalysisResult, files: File[], role: Role): Promise<AISummary> {
    const fileContents = await Promise.all(files.map(fileToText));
    const roleInstructions = getRoleBasedPromptInstructions(role);

    const prompt = `
        As an expert system performance analyst, analyze the following structured data from a local parser AND the raw log files.
        Your analysis should be from the perspective of a **${role}**. Your response MUST be tailored to this persona.
        
        **Persona Instructions:**
        ${roleInstructions}

        **Task:**
        1.  Provide a concise, 2-3 sentence executive summary of the overall system health.
        2.  Identify 3-5 positive "Health Highlights" indicating that the system is performing well in certain areas.
        3.  List the most important "Areas of Concern," if any, with a severity level. Focus on actionable issues.

        **Input Data:**
        - A JSON object with pre-parsed data is provided first. Use this as your primary source of truth for metrics.
        - The raw file contents are provided after the JSON. Note: for large files, the content is truncated to only include the beginning and end. Use these to get context and details that might be missing from the parsed data.

        Your response must be a single, valid JSON object adhering to the provided schema. Do not add any text or markdown before or after the JSON object.
    `;

    const allParts = [
        { text: prompt },
        { text: `PARSED DATA:\n\`\`\`json\n${JSON.stringify(localResult)}\n\`\`\``},
        ...fileContents.map(fc => ({ text: `--- START OF FILE ${fc.name} ---\n${fc.content}\n--- END OF FILE ${fc.name} ---` }))
    ];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: allParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: aiSummarySchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AISummary;

    } catch (error) {
        console.error("Gemini AI Summary call failed:", error);
        throw new Error("Failed to get a valid summary from the AI. Check the console for details.");
    }
}

export async function getAIDeeperAnalysis(localResult: AnalysisResult, files: File[], role: Role): Promise<AIDeeperAnalysis> {
    const fileContents = await Promise.all(files.map(fileToText));
    const roleInstructions = getRoleBasedPromptInstructions(role);

    const prompt = `
        As an expert system performance analyst, perform a DEEP-DIVE analysis of the provided structured data and raw log files.
        Your analysis should be from the perspective of a **${role}**.
        
        **Persona Instructions:**
        ${roleInstructions}

        **Task:**
        Your goal is to provide a comprehensive report that goes beyond surface-level metrics.
        1.  **Detailed Narrative:** Write a detailed, multi-paragraph narrative of the system's performance. Connect different data points together to tell a story. For example, explain how high CPU load and specific thread states might be related to the faulted jobs in a particular application.
        2.  **Root Cause Analysis:** For the top 2-3 most critical issues identified in the data, provide a detailed root cause analysis. Explain the evidence from the logs and metrics that leads you to your conclusions.
        3.  **Actionable Recommendations:** Provide a list of specific, actionable recommendations to address the identified issues. Categorize them for clarity (e.g., 'JVM Tuning', 'Application Code', 'Infrastructure').

        **Input Data:**
        - A JSON object with pre-parsed data is provided first.
        - The raw file contents are provided after the JSON. Note: for large files, the content is truncated to only include the beginning and end. Scour these files for specific error messages, stack traces, and configuration details to support your analysis.

        Your response must be a single, valid JSON object adhering to the provided schema. Do not add any text or markdown before or after the JSON object.
    `;
    
     const allParts = [
        { text: prompt },
        { text: `PARSED DATA:\n\`\`\`json\n${JSON.stringify(localResult)}\n\`\`\``},
        ...fileContents.map(fc => ({ text: `--- START OF FILE ${fc.name} ---\n${fc.content}\n--- END OF FILE ${fc.name} ---` }))
    ];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: allParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: aiDeeperAnalysisSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AIDeeperAnalysis;

    } catch (error) {
        console.error("Gemini Deeper Analysis call failed:", error);
        throw new Error("Failed to get a valid deeper analysis from the AI. Check the console for details.");
    }
}

export async function getRAGCompletion(question: string, context: string): Promise<string> {
    const prompt = `
        Based ONLY on the following context, answer the user's question.
        Provide a detailed answer using information from the context.
        If the context does not contain the answer, state that you cannot answer the question based on the provided documents.

        CONTEXT:
        ---
        ${context}
        ---

        QUESTION: ${question}
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini RAG completion call failed:", error);
        throw new Error("Failed to get a completion from the AI for RAG. Check the console for details.");
    }
}


let assistantChat: Chat | null = null;
export function getAssistantChat(): Chat {
    if (assistantChat) {
        return assistantChat;
    }
    assistantChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are a friendly and intelligent assistant for the System Report Analyzer application. Your name is "Sys", and you specialize in system performance, thread dump analysis, and Java virtual machines. Help users understand the data, offer advice on troubleshooting, and explain how to use the application. You may receive a JSON object with context about a system analysis report at the beginning of a user's prompt. Use this context to provide specific and relevant answers. Be concise and helpful.`,
        },
    });
    return assistantChat;
}