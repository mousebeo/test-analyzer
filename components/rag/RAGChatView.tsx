import React, { useState, useEffect, useRef } from 'react';
import { RAGConfig } from '../../types';
import * as ragService from '../../services/ragService';
import { SendIcon } from '../../assets/icons';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

interface RAGChatViewProps {
  config: RAGConfig;
}

const checkIsConfigured = (config: RAGConfig): boolean => {
    // Chat is configured if either the new dedicated API or the old RAG service URL is set.
    return !!config.apiEndpoints.docIntelligenceChatApi || !!config.apiEndpoints.ragQuery;
};


export const RAGChatView: React.FC<RAGChatViewProps> = ({ config }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! Ask me anything about the documents in your knowledge base.", sender: 'ai' }
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

    try {
      const responseText = await ragService.askQuestion(input, config);
      const aiMessage: Message = { id: Date.now() + 1, text: responseText, sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Sorry, I encountered an error trying to get an answer.";
      const errorMessage: Message = { id: Date.now() + 1, text, sender: 'ai' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const isConfigured = checkIsConfigured(config);

  if (!isConfigured) {
      return (
          <div className="text-center bg-yellow-50 border border-yellow-300 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-yellow-800">Configuration Needed</h3>
              <p className="text-yellow-700 mt-2">
                  Please set either the 'Document Intelligence Chat API' or the 'RAG Query Service URL' in the 'Configuration' tab to enable chat.
              </p>
          </div>
      );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col h-[70vh]">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl px-4 py-2 rounded-lg shadow ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-xl px-4 py-2 rounded-lg shadow bg-gray-100 text-gray-800">
                    <div className="flex items-center justify-center space-x-1 pt-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center bg-gray-100 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question based on your uploaded documents..."
            className="flex-1 bg-transparent p-3 text-gray-900 placeholder-gray-500 focus:outline-none"
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 text-indigo-600 disabled:text-gray-400 hover:text-indigo-500 disabled:cursor-not-allowed">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};