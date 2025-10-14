

import React, { useState, useEffect, useRef } from 'react';
import { getAssistantChat } from '../services/geminiService';
import { AssistantIcon, CloseIcon, SendIcon } from '../assets/icons';
import { AnalysisResult } from '../types';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

interface AIAssistantProps {
    context: AnalysisResult | null;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ context }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Hi! I'm Sys, your AI assistant. How can I help you analyze your system reports today?", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        let prompt = input;
        if (context) {
            // Create a summarized version of the context to avoid large token counts
            const summarizedContext = {
                analysisType: context.analysisType,
                role: context.role,
                summary: context.summary,
                keyMetrics: context.keyMetrics,
                ...(context.aiSummary && {
                    healthHighlights: context.aiSummary.healthHighlights,
                    areasOfConcern: context.aiSummary.areasOfConcern,
                })
            };
            prompt = `
CONTEXT: The user is currently viewing the following system analysis report. Use this data to answer their question.
\`\`\`json
${JSON.stringify(summarizedContext, null, 2)}
\`\`\`

USER QUESTION: ${input}
            `;
        }
        
        const aiMessageId = Date.now() + 1;
        setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);
        
        try {
            const chat = getAssistantChat();
            const stream = await chat.sendMessageStream({ message: prompt });
            
            for await (const chunk of stream) {
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId ? { ...msg, text: msg.text + chunk.text } : msg
                ));
            }

        } catch (error) {
            console.error('AI Assistant Error:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId ? { ...msg, text: "Sorry, I encountered an error. Please try again." } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-4 shadow-lg z-50 transition-transform hover:scale-110"
                aria-label="Open AI Assistant"
            >
                <AssistantIcon />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[60vh] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900/50 rounded-t-lg">
                <h3 className="font-semibold text-white flex items-center">
                    <AssistantIcon />
                    <span className="ml-2">AI Assistant "Sys"</span>
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                    <CloseIcon />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-cyan-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            {isLoading && msg.sender === 'ai' && msg.text === '' && (
                               <div className="flex items-center justify-center space-x-1 pt-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-700">
                <div className="flex items-center bg-gray-700 rounded-lg">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask Sys anything..."
                        className="flex-1 bg-transparent p-2 text-white placeholder-gray-400 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 text-cyan-400 disabled:text-gray-500 hover:text-cyan-300 disabled:cursor-not-allowed">
                        <SendIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};