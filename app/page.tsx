'use client';
// Performance fix for mobile typing lag - July 17, 2025

import React, { useState, FormEvent, useRef, useEffect, KeyboardEvent } from 'react';
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Type Definitions ---
interface Message {
  text: string;
  sender: 'user' | 'alina';
}

// --- MODIFIED: ChatInputForm Props ---
// 'input' and 'setInput' are no longer needed from the parent.
interface ChatInputFormProps {
  onSendMessage: (messageText: string) => Promise<void>; // Now takes the message text directly
  isLoading: boolean;
}

// --- Helper Components ---
const TypingIndicator = () => (
    <div className="p-3 rounded-lg bg-gray-700 self-start max-w-lg flex items-center space-x-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

// --- MODIFIED: ChatInputForm Component ---
const ChatInputForm = ({ onSendMessage, isLoading }: ChatInputFormProps) => {
    // --- FIX: State is now managed inside this component ---
    // This stops the parent component from re-rendering on every keystroke.
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // This new function handles the form submission locally
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (input.trim() === '' || isLoading) return;
        onSendMessage(input); // Send the final text to the parent
        setInput(''); // Clear the local input
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const form = e.currentTarget.closest('form');
            if (form) {
                // We can still use this clever trick to submit the form
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(submitEvent);
            }
        }
    };
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    return (
        <footer className="bg-gray-800 p-4">
            <form onSubmit={handleSubmit} className="flex items-start">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Shift + Enter for new line)"
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 p-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 resize-none overflow-y-auto"
                    style={{ maxHeight: '200px' }}
                />
                <button type="submit" disabled={isLoading || input.trim() === ''} className="ml-4 p-3 bg-purple-600 rounded-full hover:bg-purple-700 focus:outline-none disabled:bg-gray-500 disabled:cursor-not-allowed self-end">
                    <PaperAirplaneIcon className="h-6 w-6 text-white" />
                </button>
            </form>
        </footer>
    );
};

// --- Main Chat Page Component ---
export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    // --- FIX: Input state is removed from the parent component ---
    // const [input, setInput] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        try {
            const savedMessages = localStorage.getItem('alina-chat-history');
            if (savedMessages) setMessages(JSON.parse(savedMessages));
            else setMessages([{ text: 'Hello! How can I help you today?', sender: 'alina' }]);
            
            const savedSessionId = localStorage.getItem('alina-session-id');
            if (savedSessionId) setSessionId(savedSessionId);
        } catch (error) {
            console.error("Failed to parse from localStorage", error);
            setMessages([{ text: 'Hello! How can I help you today?', sender: 'alina' }]);
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) localStorage.setItem('alina-chat-history', JSON.stringify(messages));
        if (sessionId) localStorage.setItem('alina-session-id', sessionId);
    }, [messages, sessionId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // --- MODIFIED: handleSendMessage function ---
    // It now receives the final message text as an argument.
    const handleSendMessage = async (messageText: string) => {
        setIsLoading(true);
        const userMessage: Message = { text: messageText, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: "Isma-eel", user_input: messageText }),
            });
            const data = await response.json();
            if (data.content) {
                const alinaMessage: Message = { text: data.content, sender: 'alina' };
                setMessages(prev => [...prev, alinaMessage]);
                if (data.session_id) {
                    setSessionId(data.session_id);
                }
            }
        } catch (error) {
            console.error('Failed to get response from API:', error);
            const errorMessage: Message = { text: 'Sorry, I encountered an error.', sender: 'alina'};
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNewChat = async () => {
        if (messages.length > 1 && sessionId) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/archive_chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId, transcript: messages }),
                });
            } catch (error) {
                console.error("Failed to archive chat:", error);
            }
        }
        localStorage.removeItem('alina-chat-history');
        localStorage.removeItem('alina-session-id');
        setMessages([{ text: 'Hello again. Let\'s begin a new conversation.', sender: 'alina' }]);
        setSessionId(null);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center">
                <button onClick={handleNewChat} className="flex items-center space-x-2 text-purple-400 hover:text-purple-300">
                    <PlusIcon className="h-5 w-5" />
                    <span>New Chat</span>
                </button>
                <h1 className="text-xl font-bold">Alina AI</h1>
                <Link href="/tasks" className="text-sm text-purple-400 hover:text-purple-300">
                    View Task Log
                </Link>
            </header>
            <main className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`p-3 rounded-lg max-w-lg ${msg.sender === 'user' ? 'bg-purple-600 self-end' : 'bg-gray-700 self-start'}`}>
                            <div className="prose dark:prose-invert prose-p:my-0 prose-headings:my-2">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            {/* --- MODIFIED: Pass the updated function to the form --- */}
            <ChatInputForm onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
    );
}