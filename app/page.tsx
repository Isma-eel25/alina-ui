'use client';

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

interface ChatInputFormProps {
  onSendMessage: (messageText: string) => Promise<void>;
  isLoading: boolean;
}

// --- Helper Components ---
const TypingIndicator = () => (
    <div className="p-3 rounded-lg bg-slate-700 self-start max-w-lg flex items-center space-x-2">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
    </div>
);

const ChatInputForm = ({ onSendMessage, isLoading }: ChatInputFormProps) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (input.trim() === '' || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // This logic allows Shift+Enter for newlines on PC.
        // On mobile (smaller screens), it allows the default Enter behavior (new line).
        if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
            e.preventDefault();
            const form = e.currentTarget.closest('form');
            if (form) form.requestSubmit();
        }
    };
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    return (
        <footer className="bg-slate-800/50 backdrop-blur-sm p-4 border-t border-slate-700">
            <form onSubmit={handleSubmit} className="flex items-start max-w-4xl mx-auto">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Shift + Enter for new line on PC)"
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 p-2 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 resize-none"
                    style={{ maxHeight: '200px' }}
                />
                <button type="submit" disabled={isLoading || input.trim() === ''} className="ml-4 p-3 bg-indigo-600 rounded-full hover:bg-indigo-700 focus:outline-none disabled:bg-slate-600 disabled:cursor-not-allowed self-end">
                    <PaperAirplaneIcon className="h-6 w-6 text-white" />
                </button>
            </form>
        </footer>
    );
};

const NameEntryModal = ({ onNameSubmit }: { onNameSubmit: (name: string) => void }) => {
    const [name, setName] = useState('');
    const handleSubmit = (e: FormEvent) => { e.preventDefault(); if (name.trim()) onNameSubmit(name.trim()); };
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900 bg-opacity-95">
            <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center w-11/12 max-w-sm">
                <h2 className="text-2xl font-bold mb-4">Welcome to Alina AI</h2>
                <p className="text-slate-400 mb-6">Please enter your name to begin.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Your Name"
                    />
                    <button type="submit" className="w-full mt-4 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 font-semibold">
                        Start Chatting
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        const savedName = localStorage.getItem('alina-user-name');
        setUserName(savedName);
        if (savedName) {
            try {
                const savedMessages = localStorage.getItem(`alina-chat-history-${savedName}`);
                if (savedMessages) setMessages(JSON.parse(savedMessages));
                else setMessages([{ text: `Welcome back, ${savedName}.`, sender: 'alina' }]);
                const savedSessionId = localStorage.getItem(`alina-session-id-${savedName}`);
                if (savedSessionId) setSessionId(savedSessionId);
            } catch (error) {
                console.error("Failed to parse from localStorage", error);
                setMessages([{ text: 'Hello! How can I help you today?', sender: 'alina' }]);
            }
        }
    }, []);

    const handleNameSubmit = (name: string) => {
        setUserName(name);
        localStorage.setItem('alina-user-name', name);
        setMessages([{ text: `Hello ${name}! How can I help you today?`, sender: 'alina' }]);
        if (localStorage.getItem(`alina-chat-history-${name}`)) localStorage.removeItem(`alina-chat-history-${name}`);
        if (localStorage.getItem(`alina-session-id-${name}`)) localStorage.removeItem(`alina-session-id-${name}`);
        setSessionId(null);
    };

    useEffect(() => {
        if (userName) {
            if (messages.length > 0) localStorage.setItem(`alina-chat-history-${userName}`, JSON.stringify(messages));
            if (sessionId) localStorage.setItem(`alina-session-id-${userName}`, sessionId);
        }
    }, [messages, sessionId, userName]);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
    useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

    const handleSendMessage = async (messageText: string) => {
        setIsLoading(true);
        const userMessage: Message = { text: messageText, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userName || "User", user_input: messageText }),
            });
            const data = await response.json();
            if (data.content) {
                const alinaMessage: Message = { text: data.content, sender: 'alina' };
                setMessages(prev => [...prev, alinaMessage]);
                if (data.session_id) setSessionId(data.session_id);
            }
        } catch (error) {
            console.error('Failed to get response from API:', error);
            setMessages(prev => [...prev, { text: 'Sorry, I encountered an error.', sender: 'alina'}]);
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
            } catch (error) { console.error("Failed to archive chat:", error); }
        }
        if (userName) {
            localStorage.removeItem(`alina-chat-history-${userName}`);
            localStorage.removeItem(`alina-session-id-${userName}`);
        }
        setMessages([{ text: `Hello again, ${userName || 'friend'}. Let's begin a new conversation.`, sender: 'alina' }]);
        setSessionId(null);
    };

    if (!userName) {
        return <NameEntryModal onNameSubmit={handleNameSubmit} />;
    }

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white">
            <header className="sticky top-0 z-10 bg-slate-800/75 backdrop-blur-sm p-4 shadow-md flex justify-between items-center border-b border-slate-700">
                <button onClick={handleNewChat} className="flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
                    <PlusIcon className="h-5 w-5" />
                    <span>New Chat</span>
                </button>
                <h1 className="text-xl font-bold text-center mx-2">Alina AI</h1>
                <Link href="/tasks" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                    Task Log
                </Link>
            </header>
            <main className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col space-y-4 max-w-4xl mx-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`p-4 rounded-lg max-w-2xl ${msg.sender === 'user' ? 'bg-indigo-600 self-end' : 'bg-slate-700 self-start'}`}>
                            <div className="prose dark:prose-invert prose-p:my-0">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            <ChatInputForm onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
    );
}