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

  // Load threads and active thread on mount
  useEffect(() => {
    try {
      const savedThreads = localStorage.getItem(QA_THREADS_KEY);
      const savedActiveId = localStorage.getItem(QA_ACTIVE_THREAD_KEY);
      
      if (savedThreads) {
        const parsed = JSON.parse(savedThreads);
        setThreads(parsed);
        
        // Load active thread if it exists
        if (savedActiveId) {
          const activeThread = parsed.find(t => t.id === savedActiveId);
          if (activeThread) {
            setActiveThreadId(savedActiveId);
            setMessages(activeThread.messages);
          }
        }
      }
    } catch (error) {
      console.error('Error loading threads from localStorage:', error);
    }
  }, []);

  // Save threads to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(QA_THREADS_KEY, JSON.stringify(threads));
    } catch (error) {
      console.error('Error saving threads to localStorage:', error);
    }
  }, [threads]);

  // Save active thread ID
  useEffect(() => {
    try {
      if (activeThreadId) {
        localStorage.setItem(QA_ACTIVE_THREAD_KEY, activeThreadId);
      }
    } catch (error) {
      console.error('Error saving active thread ID:', error);
    }
  }, [activeThreadId]);

  // Update active thread messages when messages change
  useEffect(() => {
    if (activeThreadId && messages.length > 0) {
      setThreads(prevThreads => 
        prevThreads.map(thread => {
          if (thread.id === activeThreadId) {
            // If thread title is still "New conversation", update it with first user message
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

    // Create new thread if none exists
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
    
    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Check if this is the first message (need to retrieve chunks)
      const isFirstMessage = messages.length === 0;
      let sources = [];

      if (isFirstMessage) {
        // Retrieve relevant chunks from vector database using GET with query params
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

      // Prepare conversation history for API - only include role and content
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

      // Call AI API
      const aiResponse = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('API Error Response:', errorText);
        throw new Error('Failed to get AI response');
      }

      const aiData = await aiResponse.json();
      
      // Add assistant message with sources
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
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex h-[calc(100vh-250px)]">
      {/* Threads Sidebar */}
      <div className={`${showThreadsList ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-slate-200 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Chat Threads</h3>
          <button
            onClick={() => setShowThreadsList(false)}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
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
            <div className="text-center py-8 text-slate-500 text-sm">
              No threads yet. Start a new conversation!
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowThreadsList(!showThreadsList)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Show threads"
              >
                <List className="w-5 h-5 text-slate-600" />
              </button>
              
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {activeThread ? activeThread.title : 'Q&A Assistant'}
                </h2>
                <p className="text-sm text-slate-600">Ask questions about crash incidents</p>
              </div>
            </div>
            
            <button
              onClick={createNewThread}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              New Thread
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 bg-slate-100 rounded-full mb-4">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Start a conversation</h3>
              <p className="text-slate-600 max-w-md">
                Ask questions about crash incidents, patterns, locations, or any insights from the data.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))
          )}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about crash incidents..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadItem({ thread, isActive, onSelect, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);

  const handleSave = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(thread.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
        isActive ? 'bg-purple-100 border border-purple-300' : 'hover:bg-slate-50 border border-transparent'
      }`}
      onClick={onSelect}
    >
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            <h4 
              className="font-medium text-slate-900 text-sm truncate flex-1"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              {thread.title}
            </h4>
            <button
              onClick={onDelete}
              className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-600"
              title="Delete thread"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-500 truncate">{thread.preview}</p>
          <p className="text-xs text-slate-400 mt-1">
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg p-4 ${
            isUser
              ? 'bg-purple-600 text-white'
              : isError
              ? 'bg-red-50 text-red-900 border border-red-200'
              : 'bg-slate-100 text-slate-900'
          }`}
        >
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown content={message.content} />
          </div>
        </div>
        
        {/* Show sources for assistant messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourcesList sources={message.sources} />
        )}
      </div>
    </div>
  );
}

function ReactMarkdown({ content }) {
  // Simple markdown renderer for basic formatting
  const parseMarkdown = (text) => {
    // Handle bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Handle italic
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Handle line breaks
    text = text.replace(/\n/g, '<br />');
    return text;
  };

  return (
    <div 
      className="whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}

function SourcesList({ sources }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
        <Database className="w-3 h-3" />
        <span className="font-medium">Sources ({sources.length})</span>
      </div>
      
      {sources.map((source, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleExpand(index)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-left">
              <span className="text-xs font-medium text-purple-600">
                #{source.metadata.crash_num}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(source.metadata.incident_date).toLocaleDateString()}
              </span>
            </div>
            {expandedIndex === index ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          
          {expandedIndex === index && (
            <div className="px-3 py-3 bg-slate-50 border-t border-slate-200">
              <p className="text-xs text-slate-700 leading-relaxed mb-2">
                {source.content}
              </p>
              <div className="flex gap-3 text-xs text-slate-500">
                <span>ID: {source.metadata.incident_id}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}