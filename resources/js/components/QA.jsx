import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ChevronDown, ChevronUp, MessageSquare, Database, Trash2, Plus, List, X } from 'lucide-react';

const QA_THREADS_KEY = 'qa_chat_threads';
const QA_ACTIVE_THREAD_KEY = 'qa_active_thread_id';

export default function QAComponent() {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showThreadsList, setShowThreadsList] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      const savedThreads = localStorage.getItem(QA_THREADS_KEY);
      const savedActiveId = localStorage.getItem(QA_ACTIVE_THREAD_KEY);
      
      if (savedThreads) {
        const parsed = JSON.parse(savedThreads);
        setThreads(parsed);
        
        if (savedActiveId) {
          const activeThread = parsed.find(t => t.id === savedActiveId);
          if (activeThread) {
            setActiveThreadId(savedActiveId);
            setMessages(activeThread.messages);
          }
        }
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(QA_THREADS_KEY, JSON.stringify(threads));
    } catch (error) {
      console.error('Error saving threads:', error);
    }
  }, [threads]);

  useEffect(() => {
    try {
      if (activeThreadId) {
        localStorage.setItem(QA_ACTIVE_THREAD_KEY, activeThreadId);
      }
    } catch (error) {
      console.error('Error saving active thread:', error);
    }
  }, [activeThreadId]);

  useEffect(() => {
    if (activeThreadId && messages.length > 0) {
      setThreads(prevThreads => 
        prevThreads.map(thread => {
          if (thread.id === activeThreadId) {
            const newTitle = thread.title === 'New conversation' && messages.length >= 1 && messages[0].role === 'user'
              ? (messages[0].content.length > 50 ? messages[0].content.substring(0, 50) + '...' : messages[0].content)
              : thread.title;
            
            return {
              ...thread,
              title: newTitle,
              messages, 
              updatedAt: new Date().toISOString(),
              preview: messages[messages.length - 1]?.content.substring(0, 60) + '...'
            };
          }
          return thread;
        })
      );
    }
  }, [messages, activeThreadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewThread = () => {
    const newThread = {
      id: Date.now().toString(),
      title: 'New conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preview: 'New conversation'
    };
    
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setMessages([]);
    setShowThreadsList(false);
  };

  const loadThread = (threadId) => {
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      setActiveThreadId(threadId);
      setMessages(thread.messages);
      setShowThreadsList(false);
    }
  };

  const deleteThread = (threadId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this thread?')) {
      setThreads(prev => prev.filter(t => t.id !== threadId));
      
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
    }
  };

  const renameThread = (threadId, newTitle) => {
    setThreads(prev => 
      prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, title: newTitle }
          : thread
      )
    );
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    if (!activeThreadId) {
      const threadTitle = input.length > 50 ? input.substring(0, 50) + '...' : input;
      const newThread = {
        id: Date.now().toString(),
        title: threadTitle,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preview: threadTitle
      };
      
      setThreads(prev => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
    }

    const userMessage = input.trim();
    setInput('');
    
    const newUserMessage = {
      role: 'user',
      content: userMessage
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const isFirstMessage = messages.length === 0;
      let sources = [];

      if (isFirstMessage) {
        const params = new URLSearchParams({
          q: userMessage,
          k: '5'
        });
        
        const retrieveResponse = await fetch(`http://localhost:8080/retrieve?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!retrieveResponse.ok) {
          throw new Error('Failed to retrieve context');
        }

        const retrieveData = await retrieveResponse.json();
        sources = retrieveData.results || [];
      }

      const conversationHistory = messages
        .filter(msg => msg.role && msg.content)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const requestBody = {
        question: userMessage,
        data: sources.map(s => ({
          content: s.content,
          ...s.metadata
        })),
        mode: 'qa',
        isFollowUp: !isFirstMessage,
        conversationHistory: conversationHistory
      };

      const aiResponse = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiData = await aiResponse.json();
      
      const newAssistantMessage = {
        role: 'assistant',
        content: aiData.response,
        sources: sources
      };
      
      setMessages(prev => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <div className="glass rounded-3xl shadow-2xl flex h-[calc(100vh-250px)] overflow-hidden">
      {/* Threads Sidebar */}
      <div className={`${showThreadsList ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-slate-200 flex flex-col overflow-hidden bg-gradient-to-b from-purple-50 to-pink-50`}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <List className="w-5 h-5 text-purple-600" />
            Chat Threads
          </h3>
          <button
            onClick={() => setShowThreadsList(false)}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          {threads.map(thread => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeThreadId}
              onSelect={() => loadThread(thread.id)}
              onDelete={(e) => deleteThread(thread.id, e)}
              onRename={(newTitle) => renameThread(thread.id, newTitle)}
            />
          ))}
          
          {threads.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              No threads yet. Start a new conversation!
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-purple-50/30">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowThreadsList(!showThreadsList)}
                className="p-3 hover:bg-purple-100 rounded-xl transition-all hover:scale-105"
                title="Show threads"
              >
                <List className="w-5 h-5 text-slate-600" />
              </button>
              
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl pulse-glow">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold gradient-text">
                  {activeThread ? activeThread.title : 'Q&A Assistant'}
                </h2>
                <p className="text-sm text-slate-600">Ask questions about crash incidents</p>
              </div>
            </div>
            
            <button
              onClick={createNewThread}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 transition-all shadow-lg font-semibold btn-vibrant"
            >
              <Plus className="w-5 h-5" />
              New Thread
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl mb-6 float-animation">
                <MessageSquare className="w-16 h-16 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Start a conversation</h3>
              <p className="text-slate-600 max-w-md text-lg">
                Ask questions about crash incidents, patterns, locations, or any insights from the data.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))
          )}
          
          {isLoading && (
            <div className="flex items-center gap-3 text-purple-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Thinking...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about crash incidents..."
              disabled={isLoading}
              className="flex-1 px-6 py-4 border-2 border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all text-lg"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:scale-105 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg font-semibold btn-vibrant"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ThreadItem({ thread, isActive, onSelect, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);

  const handleSave = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`p-4 rounded-xl mb-2 cursor-pointer transition-all hover:scale-102 ${
        isActive ? 'bg-gradient-to-r from-purple-200 to-pink-200 shadow-lg' : 'hover:bg-white/70 bg-white/40'
      }`}
      onClick={onSelect}
    >
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setEditTitle(thread.title);
              setIsEditing(false);
            }
          }}
          onBlur={handleSave}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-3 py-2 text-sm border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <h4 
              className="font-bold text-slate-900 text-sm truncate flex-1"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              {thread.title}
            </h4>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-600 transition-all"
              title="Delete thread"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 truncate mb-2">{thread.preview}</p>
          <p className="text-xs text-slate-400 font-medium">
            {new Date(thread.updatedAt).toLocaleDateString()} {new Date(thread.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </>
      )}
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isError = message.error;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} chat-bubble`}>
      <div className={`max-w-[80%]`}>
        <div
          className={`rounded-2xl p-5 shadow-lg ${
            isUser
              ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
              : isError
              ? 'bg-red-50 text-red-900 border-2 border-red-200'
              : 'bg-white text-slate-900 border-2 border-slate-200'
          }`}
        >
          <div className="prose prose-sm max-w-none">
            {message.content.split('\n').map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">{line}</p>
            ))}
          </div>
        </div>
        
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourcesList sources={message.sources} />
        )}
      </div>
    </div>
  );
}

function SourcesList({ sources }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 text-xs text-slate-600 mb-3 font-semibold">
        <Database className="w-4 h-4" />
        <span>Sources ({sources.length})</span>
      </div>
      
      {sources.map((source, index) => (
        <div
          key={index}
          className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 transition-colors"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-sm font-bold text-purple-600">
                #{source.metadata.crash_num}
              </span>
              <span className="text-sm text-slate-600 font-medium">
                {new Date(source.metadata.incident_date).toLocaleDateString()}
              </span>
            </div>
            {expandedIndex === index ? (
              <ChevronUp className="w-5 h-5 text-purple-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          {expandedIndex === index && (
            <div className="px-4 py-4 bg-white border-t-2 border-purple-100">
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                {source.content}
              </p>
              <div className="flex gap-4 text-xs text-slate-500 font-medium">
                <span>ID: {source.metadata.incident_id}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}