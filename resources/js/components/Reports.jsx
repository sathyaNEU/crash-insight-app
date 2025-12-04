import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ReportComponent() {
  const [reports] = useState([
    {
      id: "report_1",
      question: "What caused the incident when every factor was perfect?",
      file: "/ai/computed/report_1.md"
    },
    {
      id: "report_2",
      question: "What are the most common collision types?",
      file: "/ai/computed/report_2.md"
    },
    {
      id: "report_3",
      question: "How does weather affect crash severity?",
      file: "/ai/computed/report_3.md"
    },
    {
      id: "report_4",
      question: "Identifying High-Risk Locations With the Most Frequent Incident Occurrences?",
      file: "/ai/computed/report_4.md"
    },
    {
      id: "report_5",
      question: "Examining Traffic Control and Intersection Types in Severe or Fatal Crashes",
      file: "/ai/computed/report_5.md"
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

    // Load markdown if expanding and not already cached
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Incident Analysis Reports
          </h1>
          <p className="text-slate-600">
            AI-generated insights from crash data
          </p>
        </div>

        {/* Accordion Reports */}
        <div className="space-y-4">
          {reports.map((report) => {
            const isExpanded = expandedReports[report.id];
            const isLoading = loadingReports[report.id];
            const content = markdownCache[report.id];

            return (
              <div 
                key={report.id}
                className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
              >
                {/* Header - Always Visible */}
                <button
                  onClick={() => toggleReport(report.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <h2 className="text-lg font-semibold text-slate-900 text-left">
                    {report.question}
                  </h2>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  )}
                </button>

                {/* Content - Shown when expanded */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-200">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-pulse flex space-x-4">
                          <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
                          <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
                          <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="markdown-content">
                        <style>{`
                          .markdown-content h1 {
                            font-size: 2rem;
                            font-weight: 700;
                            color: #0f172a;
                            margin-bottom: 1.5rem;
                            margin-top: 0;
                            line-height: 1.2;
                          }
                          .markdown-content h2 {
                            font-size: 1.5rem;
                            font-weight: 700;
                            color: #1e293b;
                            margin-top: 2rem;
                            margin-bottom: 1rem;
                            padding-bottom: 0.5rem;
                            border-bottom: 2px solid #e2e8f0;
                            line-height: 1.3;
                          }
                          .markdown-content h3 {
                            font-size: 1.25rem;
                            font-weight: 600;
                            color: #334155;
                            margin-top: 1.5rem;
                            margin-bottom: 0.75rem;
                            line-height: 1.4;
                          }
                          .markdown-content p {
                            margin-bottom: 1rem;
                            line-height: 1.7;
                            color: #475569;
                          }
                          .markdown-content ul, .markdown-content ol {
                            margin-bottom: 1.5rem;
                            padding-left: 1.5rem;
                          }
                          .markdown-content li {
                            margin-bottom: 0.5rem;
                            line-height: 1.7;
                            color: #475569;
                          }
                          .markdown-content strong {
                            font-weight: 600;
                            color: #1e293b;
                          }
                          .markdown-content code {
                            background-color: #f1f5f9;
                            padding: 0.2rem 0.4rem;
                            border-radius: 0.25rem;
                            font-size: 0.9em;
                            color: #e11d48;
                          }
                          .markdown-content pre {
                            background-color: #f8fafc;
                            padding: 1rem;
                            border-radius: 0.5rem;
                            overflow-x: auto;
                            margin-bottom: 1.5rem;
                            border: 1px solid #e2e8f0;
                          }
                          .markdown-content pre code {
                            background-color: transparent;
                            padding: 0;
                            color: #334155;
                          }
                          .markdown-content blockquote {
                            border-left: 4px solid #3b82f6;
                            padding-left: 1rem;
                            margin: 1.5rem 0;
                            color: #64748b;
                            font-style: italic;
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
    </div>
  );
}