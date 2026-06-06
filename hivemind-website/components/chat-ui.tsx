"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { jsonrepair } from 'jsonrepair';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils"; 
import { analyzeAgentAction } from '@/app/actions/ai-chat'; 
import { RoadmapProposal } from '@/components/roadmap-proposal';

type ChatMessage = {
    sender: 'user' | 'ai' | 'system';
    text: string;
    isStreaming?: boolean;
    proposalData?: any; 
};

export default function ChatUI({ userId }: { userId: string }) {
    const [message, setMessage] = useState<string>('');
    const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const rawAiResponseRef = useRef<string>("");

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatLog]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMessage: ChatMessage = { sender: 'user', text: message };
        const aiMessagePlaceholder: ChatMessage = { sender: 'ai', text: '', isStreaming: true };
        
        setChatLog(prev => [...prev, userMessage, aiMessagePlaceholder]);
        const currentInput = message;
        setMessage('');
        setIsLoading(true);
        rawAiResponseRef.current = "";

        try {
            const streamIterator = await analyzeAgentAction(userId, currentInput);

            for await (const chunk of streamIterator) {
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataContent = line.replace('data: ', '').trim();

                        if (dataContent === '[DONE]') {
                            setIsLoading(false);
                            setChatLog(prev => {
                                const newLog = [...prev];
                                const lastMsg = newLog[newLog.length - 1];
                                if (lastMsg) lastMsg.isStreaming = false;
                                return newLog;
                            });
                            break;
                        }

                        try {
                            const parsedChunk = JSON.parse(dataContent);
                            
                            if (parsedChunk.chunk) {
                                rawAiResponseRef.current += parsedChunk.chunk;
                                try {
                                    const repairedJson = JSON.parse(jsonrepair(rawAiResponseRef.current));
                                    
                                    setChatLog(prev => {
                                        const newLog = [...prev];
                                        const aiIndex = newLog.length - 1;
                                        if (newLog[aiIndex]) {
                                            if (repairedJson.message) {
                                                newLog[aiIndex].text = repairedJson.message;
                                            }
                                            if (repairedJson.milestones && repairedJson.milestones.length > 0) {
                                                newLog[aiIndex].proposalData = repairedJson;
                                            }
                                        }
                                        return newLog;
                                    });
                                } catch (e) { /* Buffer incomplete */ }
                            } else if (parsedChunk.error) {
                                setChatLog(prev => [...prev, { sender: 'system', text: `Error: ${parsedChunk.error}` }]);
                            }
                        } catch (e) {
                            console.error("Error parsing chunk", e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Action error:', error);
            setChatLog(prev => {
                const newLog = [...prev];
                if (newLog[newLog.length - 1]?.sender === 'ai') {
                    newLog[newLog.length - 1].isStreaming = false;
                }
                return [...newLog, { sender: 'system', text: 'Connection failed.' }];
            });
            setIsLoading(false);
        }
    }, [message, isLoading, userId]);

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="bg-zinc-50 border-b border-zinc-200 p-4 flex items-center gap-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                    <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-zinc-900">Hivemind Analyst</h3>
                    <p className="text-xs text-zinc-500">Live Context from DB</p>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-zinc-50/50">
                {chatLog.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                        <Bot className="w-12 h-12 mb-4 opacity-20" />
                        <p>I have access to your milestones and profile. How can I help?</p>
                    </div>
                )}
                
                {chatLog.map((msg, index) => (
                    <div key={index} className={cn("flex flex-col gap-2", msg.sender === 'user' ? "items-end" : "items-start")}>
                        <div className={cn("flex gap-3 max-w-[90%]", msg.sender === 'user' ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                msg.sender === 'user' ? "bg-blue-100 text-blue-600" : 
                                msg.sender === 'ai' ? "bg-purple-100 text-purple-600" : "bg-red-100 text-red-600"
                            )}>
                                {msg.sender === 'user' ? <User className="w-4 h-4" /> : 
                                 msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            </div>

                            <div className={cn(
                                "rounded-2xl px-4 py-3 text-sm shadow-sm",
                                msg.sender === 'user' ? "bg-blue-600 text-white rounded-tr-none" : 
                                msg.sender === 'system' ? "bg-red-50 text-red-800 border border-red-100" :
                                "bg-white border border-zinc-200 text-zinc-800 rounded-tl-none"
                            )}>
                                {/* --- CHANGED SECTION START --- */}
                                <div className="leading-relaxed">
                                    <ReactMarkdown
                                        components={{
                                            // Override basic elements to match Tailwind styles
                                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                            strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                                {/* --- CHANGED SECTION END --- */}

                                {msg.isStreaming && (
                                    <div className="mt-2 flex items-center gap-1 text-zinc-400">
                                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {msg.sender === 'ai' && msg.proposalData && !msg.isStreaming && (
                            <div className="w-full max-w-[90%] pl-11">
                                <RoadmapProposal data={msg.proposalData} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="p-4 bg-white border-t border-zinc-200">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input 
                        className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm"
                        type="text" 
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)} 
                        placeholder="Type your message..."
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                        disabled={isLoading || !message.trim()}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </form>
            </div>
        </div>
    );
}