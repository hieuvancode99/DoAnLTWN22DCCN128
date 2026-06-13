'use strict';
'use client';

import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { 
  BrainCircuit, 
  Sparkles, 
  Send, 
  Loader2, 
  User,
  MessageSquare
} from 'lucide-react';

// A simple but powerful Markdown-to-HTML formatter component that doesn't need external dependencies
function CustomMarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
      {lines.map((line, index) => {
        let trimmed = line.trim();
        
        // 1. Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={index} className="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500 dark:text-yellow-400 animate-pulse" />
              {trimmed.substring(4)}
            </h3>
          );
        }
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={index} className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mt-4 mb-2">
              {trimmed.substring(5)}
            </h4>
          );
        }

        // 2. Lists
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const listText = trimmed.substring(2);
          // Parse bold text **bold** -> <strong>bold</strong>
          const formatted = parseInlineFormatting(listText);
          return (
            <li key={index} className="list-disc list-inside ml-4 text-slate-700 dark:text-slate-300 mt-1" dangerouslySetInnerHTML={{ __html: formatted }}></li>
          );
        }

        // 3. Number lists
        if (/^\d+\.\s/.test(trimmed)) {
          const listText = trimmed.replace(/^\d+\.\s/, '');
          const formatted = parseInlineFormatting(listText);
          return (
            <div key={index} className="flex gap-2.5 ml-2 mt-1.5">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{trimmed.match(/^\d+/)![0]}.</span>
              <span className="text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: formatted }}></span>
            </div>
          );
        }

        // 4. Empty line
        if (trimmed === '') {
          return <div key={index} className="h-2"></div>;
        }

        // 5. Normal paragraph
        const formattedParagraph = parseInlineFormatting(trimmed);
        return (
          <p key={index} className="text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: formattedParagraph }}></p>
        );
      })}
    </div>
  );
}

// Helpers for bold, inline code, and backticks formatting
function parseInlineFormatting(text: string) {
  let res = text;
  // Bold **word**
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-semibold">$1</strong>');
  // Inline code `code`
  res = res.replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-indigo-600 dark:text-indigo-400 font-mono">$1</code>');
  return res;
}

type Message = {
  role: 'user' | 'model';
  content: string;
};

const SUGGESTED_QUESTIONS = [
  "Phân tích nhanh tổng thu và tổng chi của tôi trong thời gian qua.",
  "Tôi đang chi tiêu quá nhiều vào danh mục nào?",
  "Làm thế nào để tôi có thể tiết kiệm 10% thu nhập trong tháng tới?",
  "Đánh giá tính hợp lý trong cách tôi phân bổ tiền.",
];

export default function AiAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Chào bạn! Tôi là Cố vấn Tài chính AI của Smart Finance. Bạn muốn tôi phân tích điều gì từ lịch sử giao dịch của bạn hôm nay?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.filter(m => m.role !== 'model' || m.content !== 'Chào bạn! Tôi là Cố vấn Tài chính AI của Smart Finance. Bạn muốn tôi phân tích điều gì từ lịch sử giao dịch của bạn hôm nay?');
      
      const res = await axiosInstance.post('/ai/chat', {
        message: text,
        history: history.length > 0 ? history : undefined
      });

      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'model', content: res.data.data }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: res.data.message || 'Có lỗi xảy ra, vui lòng thử lại.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', content: '### Lỗi hệ thống\nKhông thể kết nối đến AI Advisor lúc này. Vui lòng kiểm tra lại kết nối.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <BrainCircuit className="h-8 w-8 text-indigo-600 dark:text-indigo-500" />
          Cố vấn tài chính AI
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Trò chuyện trực tiếp với AI để nhận lời khuyên được cá nhân hóa dựa trên dữ liệu giao dịch của bạn.</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full shadow-md ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}>
                {msg.role === 'user' ? <User className="h-5 w-5" /> : <BrainCircuit className="h-5 w-5" />}
              </div>

              {/* Message Bubble */}
              <div className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                  : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <CustomMarkdownRenderer content={msg.content} />
                  </div>
                )}
              </div>

            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-4 flex-row">
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full shadow-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <BrainCircuit className="h-5 w-5 animate-pulse" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 flex items-center gap-2">
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        <div className="px-4 pt-2 pb-0 flex gap-2 overflow-x-auto no-scrollbar">
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="flex-shrink-0 whitespace-nowrap px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs sm:text-sm font-medium rounded-full border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="p-4 bg-white dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              placeholder="Hỏi AI về tình hình tài chính của bạn..."
              className="flex-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="flex-shrink-0 flex items-center justify-center h-11 w-11 sm:w-auto sm:px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span className="hidden sm:inline ml-2">Gửi</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
