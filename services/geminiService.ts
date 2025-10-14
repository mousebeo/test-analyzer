
import { GoogleGenAI, Type, Chat } from '@google/genai';
import { AnalysisResult, DetailedThreadReport, Role } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

async function fileToText(file: File): Promise<{ name: string; content: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve({ name: file.name, content: reader.result as string });
    reader.onerror = (error) => reject(error);
  });
}

const detailedThreadReportSchema = {
    type: Type.OBJECT,
    description: "A detailed analysis of thread dumps, identifying problematic threads and potential issues like deadlocks or long-waiting threads.",
    properties: {
        summary: { type: Type.STRING, description: "A summary of the overall thread dump analysis." },
        warnings: {
            type: Type.ARRAY,
            description: "A list of warnings identified from the thread dump.",
            items: {
                type: Type.OBJECT,
                properties: {
                    severity: { type: Type.STRING, description: "'High', 'Medium', or 'Low'" },
                    description: { type: Type.STRING },
                }
            }
        },
        problematicThreads: {
            type: Type.ARRAY,
            description: "A list of threads that are exhibiting problematic behavior.",
            items: {
                type: Type.OBJECT,
                properties: {
                    threadName: { type: Type.STRING },
                    state: { type: Type.STRING },
                    details: { type: Type.STRING, description: "Details about what the thread is doing, e.g., 'Blocked on monitor ...' or 'Waiting for lock ...'" },
                    stackTraceSnippet: { type: Type.STRING, description: "A relevant snippet of the thread's stack trace." },
                }
            }
        }
    }
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A concise, 2-3 sentence executive summary of the overall system health and any critical issues found." },
        keyMetrics: {
            type: Type.ARRAY,
            description: "An array of 4-6 most important key performance indicators.",
            items: {
                type: Type.OBJECT,
                properties: {
                    value: { type: Type.STRING },
                    label: { type: Type.STRING },
                },
            },
        },
        systemInfo: {
            type: Type.OBJECT,
            properties: {
                osName: { type: Type.STRING },
                osVersion: { type: Type.STRING },
                architecture: { type: Type.STRING },
                totalPhysicalMemory: { type: Type.STRING, description: "Total physical memory with units (e.g., GB)." },
                freePhysicalMemory: { type: Type.STRING, description: "Free physical memory with units (e.g., GB)." },
                cpuLoad: { type: Type.STRING, description: "Process CPU load as a percentage." },
                availableProcessors: { type: Type.INTEGER },
            },
        },
        importantEnvVars: {
            type: Type.ARRAY,
            description: "A list of important environment variables like JAVA_HOME, PATH, etc.",
            items: {
                type: Type.OBJECT,
                properties: {
                    key: { type: Type.STRING },
                    value: { type: Type.STRING },
                },
            },
        },
        applications: {
            type: Type.ARRAY,
            description: "Details of running applications.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    state: { type: Type.STRING },
                    endpoints: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING },
                                url: { type: Type.STRING },
                                properties: { 
                                    type: Type.ARRAY,
                                    description: "A list of key-value endpoint properties.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            key: { type: Type.STRING },
                                            value: { type: Type.STRING },
                                        }
                                    }
                                },
                            },
                        },
                    },
                },
            },
        },
        processStats: {
            type: Type.OBJECT,
            properties: {
                totalJobsCreated: { type: Type.INTEGER },
                totalActiveJobs: { type: Type.INTEGER },
                totalJobsFaulted: { type: Type.INTEGER },
            },
        },
        memoryAnalysis: {
            type: Type.OBJECT,
            properties: {
                heap: {
                    type: Type.OBJECT,
                    properties: {
                        init: { type: Type.NUMBER },
                        used: { type: Type.NUMBER },
                        committed: { type: Type.NUMBER },
                        max: { type: Type.NUMBER },
                    },
                },
                nonHeap: {
                    type: Type.OBJECT,
                    properties: {
                        init: { type: Type.NUMBER },
                        used: { type: Type.NUMBER },
                        committed: { type: Type.NUMBER },
                        max: { type: Type.NUMBER },
                    },
                },
            },
        },
        threadAnalysis: {
            type: Type.OBJECT,
            properties: {
                totalThreads: { type: Type.INTEGER },
                peakThreads: { type: Type.INTEGER },
                daemonThreads: { type: Type.INTEGER },
                deadlockedThreads: { 
                    type: Type.ARRAY,
                    description: "List of deadlocked thread names. Should be an empty array if none.",
                    items: { type: Type.STRING },
                },
                threadStates: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            state: { type: Type.STRING, description: "e.g., RUNNABLE, WAITING, TIMED_WAITING" },
                            count: { type: Type.INTEGER },
                        },
                    },
                },
            },
        },
        detailedApplicationReports: {
            type: Type.ARRAY,
            description: "A detailed performance and risk analysis for key applications found in the logs. This should be based on deep analysis of service calls, errors, and other relevant metrics.",
            items: {
                type: Type.OBJECT,
                properties: {
                    applicationName: { type: Type.STRING, description: "The name of the application being analyzed." },
                    performanceSummary: { type: Type.STRING, description: "A summary of the application's performance, highlighting any bottlenecks or issues." },
                    serviceCalls: {
                        type: Type.ARRAY,
                        description: "Metrics for internal or external service calls made by the application.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                serviceName: { type: Type.STRING },
                                callCount: { type: Type.INTEGER },
                                averageLatency: { type: Type.STRING, description: "e.g., '150ms'" },
                                errorRate: { type: Type.STRING, description: "e.g., '2.5%'" },
                            }
                        }
                    },
                    warnings: {
                        type: Type.ARRAY,
                        description: "A list of potential risks, performance issues, or security warnings related to this application.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                severity: { type: Type.STRING, description: "'High', 'Medium', or 'Low'" },
                                description: { type: Type.STRING },
                            }
                        }
                    }
                }
            }
        },
    },
};

const getRoleBasedPromptInstructions = (role: Role): string => {
    switch (role) {
        case 'Executive':
            return `
                - **Persona**: You are a CTO presenting a high-level summary to non-technical executives.
                - **Focus**: Business impact, overall system stability, critical risks, and potential service disruptions.
                - **Key Metrics**: Select metrics that reflect service health, user impact, and major risks (e.g., application downtime, deadlocks, severe errors).
                - **Language**: Use clear, concise business language. Avoid deep technical jargon, stack traces, and granular data. The summary should be easily understandable by a CEO.
            `;
        case 'Administrator':
            return `
                - **Persona**: You are a senior System Administrator or SRE responsible for system uptime and performance.
                - **Focus**: System resource utilization (CPU, Memory), infrastructure health, configuration issues, error rates, and identifying bottlenecks.
                - **Key Metrics**: Select metrics crucial for system health monitoring (e.g., CPU load, memory usage, faulted jobs, thread contention).
                - **Language**: Use technical language appropriate for an infrastructure expert. Provide actionable insights for system tuning and problem resolution.
            `;
        case 'Developer':
            return `
                - **Persona**: You are a senior Software Developer debugging a complex application performance issue.
                - **Focus**: Application-level performance, code execution, thread behavior, memory management (heap/non-heap), and potential bugs. Analyze service calls, latency, and errors in detail.
                - **Key Metrics**: Select metrics relevant to debugging (e.g., peak threads, deadlocked threads, heap usage vs. max, specific application error rates).
                - **Language**: Use deep technical language. The analysis should help pinpoint specific areas in the application or code that require attention.
            `;
    }
};


export async function analyzeSystemReports(files: File[], role: Role): Promise<AnalysisResult> {
  const fileContents = await Promise.all(files.map(fileToText));
  const roleInstructions = getRoleBasedPromptInstructions(role);

  const prompt = `
    As an expert system performance analyst, meticulously analyze the following system report files from the perspective of a **${role}**.
    Your response MUST be tailored to this persona.
    
    **Persona Instructions:**
    ${roleInstructions}

    **General Instructions:**
    - The file contents are provided as separate text parts after this main instruction.
    - Extract and structure the key information into a valid JSON object adhering to the provided schema.
    - Synthesize the data to provide a clear and actionable overview of the system's health, tailored to your assigned persona.
    - Pay close attention to memory usage, thread states, application statuses, and overall system configuration.
    - In addition to the summary data, perform a deep-dive analysis on application behavior, service calls, error rates, and latency.
    
    IMPORTANT: Do NOT perform a detailed thread dump analysis in this request. Provide only the high-level thread statistics (total, peak, daemon, deadlocked, states).

    Derive numerical values where possible (e.g., convert memory sizes to bytes).
    If a value or a detailed analysis section is not possible due to lack of data, use a sensible default like 0 for numbers, an empty string, or an empty array, and omit the optional detailed analysis objects if no relevant data is found.
    Do not add any text or markdown before or after the JSON object.
  `;
  
  const fileParts = fileContents.map(fc => ({ 
    text: `--- START OF FILE ${fc.name} ---\n${fc.content}\n--- END OF FILE ${fc.name} ---` 
  }));

  const allParts = [{ text: prompt }, ...fileParts];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: allParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return { ...result, analysisType: 'AI', role } as AnalysisResult;
    
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to get a valid response from the AI. Check the console for details.");
  }
}

export async function getDetailedThreadAnalysis(files: File[]): Promise<DetailedThreadReport> {
    const fileContents = await Promise.all(files.map(fileToText));
  
    const prompt = `
      As an expert system performance analyst, perform a deep-dive analysis of the thread dumps contained within the following system report files.
      The file contents are provided as separate text parts after this main instruction.
      Focus exclusively on identifying problematic threads, potential deadlocks, long-waiting threads, and any other performance bottlenecks related to threading.
      Structure your response as a valid JSON object adhering to the provided schema.
      Provide a concise summary, a list of actionable warnings with severity, and a detailed breakdown of the most problematic threads, including their state, activity details, and a relevant stack trace snippet.
      If no thread dump information is available, return a summary indicating that and empty arrays for warnings and problematic threads.
      Do not add any text or markdown before or after the JSON object.
    `;
    
    const fileParts = fileContents.map(fc => ({ 
      text: `--- START OF FILE ${fc.name} ---\n${fc.content}\n--- END OF FILE ${fc.name} ---` 
    }));
  
    const allParts = [{ text: prompt }, ...fileParts];
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: allParts },
        config: {
          responseMimeType: "application/json",
          responseSchema: detailedThreadReportSchema,
        },
      });
  
      const jsonText = response.text.trim();
      const result = JSON.parse(jsonText);
      return result as DetailedThreadReport;
      
    } catch (error) {
      console.error("Gemini API call for detailed thread analysis failed:", error);
      throw new Error("Failed to get a valid response from the AI for thread analysis. Check the console for details.");
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
            systemInstruction: 'You are a friendly and intelligent assistant for the System Report Analyzer application. Your name is "Sys", and you specialize in system performance, thread dump analysis, and Java virtual machines. Help users understand the data, offer advice on troubleshooting, and explain how to use the application. Be concise and helpful.',
        },
    });
    return assistantChat;
}
