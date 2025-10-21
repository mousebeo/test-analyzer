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

  const isConfigured = config.pineconeApiKey && config.pineconeHost && config.ollamaHost && config.ollamaModel;

  if (!isConfigured) {
      return (
          <div className="text-center bg-yellow-900/30 border border-yellow-700 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-yellow-300">Configuration Needed</h3>
              <p className="text-yellow-400 mt-2">
                  Please set your API endpoints and keys in the 'Configuration' tab before using the chat.
              </p>
          </div>
      );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg flex flex-col h-[70vh]">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl px-4 py-2 rounded-lg shadow ${msg.sender === 'user' ? 'bg-cyan-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-xl px-4 py-2 rounded-lg shadow bg-gray-700 text-gray-200">
                    <div className="flex items-center justify-center space-x-1 pt-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center bg-gray-700 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question based on your uploaded documents..."
            className="flex-1 bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none"
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 text-cyan-400 disabled:text-gray-500 hover:text-cyan-300 disabled:cursor-not-allowed">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};