import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

export default function ReportComponent() {
  const [reports] = useState([
    {
      id: "report_1",
      question: "What caused the incident when every factor was perfect?",
      file: "/ai/computed/report_1.md",
      icon: "🔍"
    },
    {
      id: "report_2",
      question: "What are the most common collision types?",
      file: "/ai/computed/report_2.md",
      icon: "📊"
    },
    {
      id: "report_3",
      question: "How does weather affect crash severity?",
      file: "/ai/computed/report_3.md",
      icon: "⛈️"
    },
    {
      id: "report_4",
      question: "Identifying High-Risk Locations With the Most Frequent Incident Occurrences?",
      file: "/ai/computed/report_4.md",
      icon: "📍"
    },
    {
      id: "report_5",
      question: "Examining Traffic Control and Intersection Types in Severe or Fatal Crashes",
      file: "/ai/computed/report_5.md",
      icon: "🚦"
    }
  ]);

  const [expandedReports, setExpandedReports] = useState({});
  const [markdownCache, setMarkdownCache] = useState({});
  const [loadingReports, setLoadingReports] = useState({});

  const toggleReport = (reportId) => {
    const isCurrentlyExpanded = expandedReports[reportId];
    
    setExpandedReports(prev => ({
      ...prev,
      [reportId]: !isCurrentlyExpanded
    }));

    if (!isCurrentlyExpanded && !markdownCache[reportId]) {
      loadMarkdown(reportId);
    }
  };

  const loadMarkdown = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    setLoadingReports(prev => ({ ...prev, [reportId]: true }));

    fetch(report.file)
      .then(res => res.text())
      .then(text => {
        setMarkdownCache(prev => ({ ...prev, [reportId]: text }));
        setLoadingReports(prev => ({ ...prev, [reportId]: false }));
      })
      .catch(err => {
        console.error('Error loading report:', err);
        setMarkdownCache(prev => ({ 
          ...prev, 
          [reportId]: "# Error\nCould not load report." 
        }));
        setLoadingReports(prev => ({ ...prev, [reportId]: false }));
      });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass rounded-3xl p-8 card-hover">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl pulse-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              AI-Generated Insights
            </h1>
            <p className="text-lg text-slate-600">
              Pre-computed analysis reports powered by Claude AI
            </p>
          </div>
        </div>
      </div>

      {/* Accordion Reports */}
      <div className="space-y-4">
        {reports.map((report, index) => {
          const isExpanded = expandedReports[report.id];
          const isLoading = loadingReports[report.id];
          const content = markdownCache[report.id];

          return (
            <div 
              key={report.id}
              className={`glass rounded-2xl overflow-hidden card-hover slide-in-up stagger-${index + 1}`}
            >
              {/* Header - Always Visible */}
              <button
                onClick={() => toggleReport(report.id)}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-purple-50/50 transition-all group"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="text-4xl">{report.icon}</div>
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    {report.question}
                  </h2>
                </div>
                <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-purple-100' : 'bg-slate-100'}`}>
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-purple-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-slate-600" />
                  )}
                </div>
              </button>

              {/* Content - Shown when expanded */}
              {isExpanded && (
                <div className="px-8 pb-8 pt-4 border-t-2 border-purple-100">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="flex space-x-2 mb-4">
                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-3 h-3 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <p className="text-slate-600 font-medium">Loading analysis...</p>
                    </div>
                  ) : (
                    <div className="markdown-content prose prose-lg max-w-none">
                      <style>{`
                        .markdown-content h1 {
                          font-size: 2.25rem;
                          font-weight: 800;
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          -webkit-background-clip: text;
                          -webkit-text-fill-color: transparent;
                          margin-bottom: 1.5rem;
                          margin-top: 0;
                          line-height: 1.2;
                        }
                        .markdown-content h2 {
                          font-size: 1.75rem;
                          font-weight: 700;
                          color: #1e293b;
                          margin-top: 2.5rem;
                          margin-bottom: 1rem;
                          padding-bottom: 0.75rem;
                          border-bottom: 3px solid #e2e8f0;
                          line-height: 1.3;
                        }
                        .markdown-content h3 {
                          font-size: 1.375rem;
                          font-weight: 600;
                          color: #334155;
                          margin-top: 2rem;
                          margin-bottom: 0.75rem;
                          line-height: 1.4;
                        }
                        .markdown-content p {
                          margin-bottom: 1.25rem;
                          line-height: 1.8;
                          color: #475569;
                          font-size: 1.0625rem;
                        }
                        .markdown-content ul, .markdown-content ol {
                          margin-bottom: 1.5rem;
                          padding-left: 2rem;
                        }
                        .markdown-content li {
                          margin-bottom: 0.75rem;
                          line-height: 1.8;
                          color: #475569;
                          font-size: 1.0625rem;
                        }
                        .markdown-content strong {
                          font-weight: 700;
                          color: #1e293b;
                        }
                        .markdown-content code {
                          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                          padding: 0.25rem 0.5rem;
                          border-radius: 0.375rem;
                          font-size: 0.9375rem;
                          color: #e11d48;
                          font-weight: 600;
                        }
                        .markdown-content pre {
                          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                          padding: 1.5rem;
                          border-radius: 0.75rem;
                          overflow-x: auto;
                          margin-bottom: 1.5rem;
                          border: 2px solid #e2e8f0;
                        }
                        .markdown-content pre code {
                          background: transparent;
                          padding: 0;
                          color: #334155;
                          font-size: 0.9375rem;
                        }
                        .markdown-content blockquote {
                          border-left: 4px solid #8b5cf6;
                          padding-left: 1.5rem;
                          margin: 2rem 0;
                          color: #64748b;
                          font-style: italic;
                          font-size: 1.125rem;
                        }
                      `}</style>
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {content || ""}
                      </Markdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}