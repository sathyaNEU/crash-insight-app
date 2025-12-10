import React, { useEffect, useState, useMemo, useRef } from 'react';
import Plot from 'react-plotly.js';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RefreshCw, BarChart3, Filter, X, Sparkles, Send, ChevronDown, ChevronUp } from 'lucide-react';

export default function DashboardComponent() {
  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    weather: null,
    light: null,
    collision: null,
    workzone: null
  });

  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const chatEndRef = useRef(null);

  const scrollToChat = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    if (aiMessages.length > 0) {
      scrollToChat();
    }
  }, [aiMessages]);

  const fetchAllIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      const result = await response.json();
      const data = result.data || result;
      setAllIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setAllIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllIncidents();
  }, []);

  const filterOptions = useMemo(() => {
    if (!allIncidents.length) return null;
    
    return {
      weather: [...new Set(allIncidents.map(d => d.weather_condition))].filter(Boolean).sort(),
      light: [...new Set(allIncidents.map(d => d.light_condition))].filter(Boolean).sort(),
      collision: [...new Set(allIncidents.map(d => d.collision_manner))].filter(Boolean).sort(),
      workzone: [
        { value: 'Y', label: 'Work Zone' },
        { value: 'N', label: 'Non-Work Zone' }
      ]
    };
  }, [allIncidents]);

  const computedData = useMemo(() => {
    if (!allIncidents.length) return null;

    const filteredIncidents = allIncidents.filter(incident => {
      if (filters.weather && incident.weather_condition !== filters.weather) return false;
      if (filters.light && incident.light_condition !== filters.light) return false;
      if (filters.collision && incident.collision_manner !== filters.collision) return false;
      if (filters.workzone && incident.work_zone_related !== filters.workzone) return false;
      return true;
    });

    const summary = {
      total_incidents: filteredIncidents.length,
      fatal_injuries: filteredIncidents.reduce((sum, i) => sum + (parseInt(i.cnt_fatal_injury) || 0), 0),
      serious_injuries: filteredIncidents.reduce((sum, i) => sum + (parseInt(i.cnt_sus_serious_injury) || 0), 0),
      minor_injuries: filteredIncidents.reduce((sum, i) => sum + (parseInt(i.cnt_non_incapacitating_injury) || 0), 0)
    };

    const monthlyMap = {};
    filteredIncidents.forEach(incident => {
      if (incident.incident_date) {
        const month = incident.incident_date.substring(0, 7);
        monthlyMap[month] = (monthlyMap[month] || 0) + 1;
      }
    });
    const monthly_trends = Object.entries(monthlyMap)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const geo_points = filteredIncidents
      .filter(i => i.latitude && i.longitude)
      .slice(0, 1000)
      .map(i => ({
        latitude: i.latitude,
        longitude: i.longitude,
        incident_location: i.incident_location,
        cnt_fatal_injury: i.cnt_fatal_injury || 0,
        cnt_sus_serious_injury: i.cnt_sus_serious_injury || 0
      }));

    return {
      summary,
      monthly_trends,
      geo_points,
      filteredIncidents
    };
  }, [allIncidents, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      weather: null,
      light: null,
      collision: null,
      workzone: null
    });
  };

  const hasActiveFilters = Object.values(filters).some(f => f !== null);

  const handleExplainWithAI = async () => {
    setShowAIChat(true);
    setQuestionCount(0);
    setAiMessages([]);
    
    const initialQuestion = "Please explain the trend in this data, explain why these accidents happened, what we could have done to help prevent it";
    
    setAiMessages([{ role: 'user', content: initialQuestion }]);
    setAiLoading(true);

    try {
      const top10Records = computedData.filteredIncidents.slice(0, 10);
      
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: initialQuestion,
          data: top10Records,
          mode: 'report',
          isFollowUp: false
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      
      const result = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
      setQuestionCount(1);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || questionCount >= 3) return;

    const newQuestion = userInput;
    setUserInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: newQuestion }]);
    setAiLoading(true);

    try {
      const top10Records = computedData.filteredIncidents.slice(0, 10);
      
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          data: top10Records,
          mode: 'report',
          isFollowUp: true,
          conversationHistory: aiMessages
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      
      const result = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
      setQuestionCount(prev => prev + 1);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl pulse-glow mb-6">
          <RefreshCw className="w-12 h-12 animate-spin text-white" />
        </div>
        <p className="text-lg text-slate-700 font-medium">Loading interactive dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 glass rounded-3xl p-12">
        <div className="text-red-600 mb-6 text-lg font-medium">{error}</div>
        <button
          onClick={fetchAllIncidents}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 transition-all shadow-2xl font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!computedData || !filterOptions) {
    return (
      <div className="text-center py-20 glass rounded-3xl p-12">
        <p className="text-slate-600 text-lg">No incident data available</p>
      </div>
    );
  }

  const { summary, monthly_trends, geo_points } = computedData;

  const latitudes = geo_points.map(p => parseFloat(p.latitude));
  const longitudes = geo_points.map(p => parseFloat(p.longitude));
  const hoverTexts = geo_points.map(p =>
    `${p.incident_location || 'Unknown'}<br>Fatal: ${p.cnt_fatal_injury}<br>Serious: ${p.cnt_sus_serious_injury}`
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 card-hover">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold gradient-text">Interactive Analytics Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExplainWithAI}
              className="flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-105 font-semibold btn-vibrant"
            >
              <Sparkles className="w-5 h-5" />
              Explain with AI
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl transition-all hover:bg-slate-800 hover:scale-105 font-semibold shadow-lg"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
            <button
              onClick={fetchAllIncidents}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all hover:scale-105 shadow-lg font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Inline AI Chat Section */}
      {showAIChat && (
        <div className="glass rounded-2xl overflow-hidden slide-in-up">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl pulse-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xl">AI Analysis</h3>
                <p className="text-sm text-slate-600">Ask questions about the data trends</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAIChat(false)} 
              className="p-2 hover:bg-white rounded-xl transition-colors"
              title="Close AI Chat"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto bg-gradient-to-b from-white to-purple-50/30">
            {aiMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} chat-bubble`}>
                <div className={`max-w-[85%] rounded-2xl p-5 shadow-lg ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white' 
                    : 'bg-white text-slate-900 border-2 border-slate-200'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                    </div>
                  ) : (
                    <p className="text-sm font-medium">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-slate-200">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
                    <span className="text-sm text-slate-600 font-medium">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {questionCount >= 3 ? (
            <div className="p-6 border-t bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <p className="text-amber-900 text-sm font-bold">Question Limit Reached</p>
                  <p className="text-amber-800 text-xs mt-1">
                    We have capped the number of clarifications for API rate limiting. Please re-use the explain with AI feature for more questions.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 border-t bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={aiLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={aiLoading || !userInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg font-semibold"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {3 - questionCount} questions remaining
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div className="glass rounded-2xl p-6 card-hover">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Filters</h3>
          <span className="px-4 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-semibold">
            {summary.total_incidents.toLocaleString()} incidents
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Weather Filter */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-3">
              Weather Condition
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.weather.map(weather => (
                <button
                  key={weather}
                  onClick={() => handleFilterChange('weather', weather)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all hover:scale-105 ${
                    filters.weather === weather
                      ? 'filter-active text-white'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-2 border-blue-300'
                  }`}
                >
                  {weather}
                </button>
              ))}
            </div>
          </div>

          {/* Light Condition Filter */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-3">
              Light Condition
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.light.map(light => (
                <button
                  key={light}
                  onClick={() => handleFilterChange('light', light)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all hover:scale-105 ${
                    filters.light === light
                      ? 'filter-active text-white'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-2 border-blue-300'
                  }`}
                >
                  {light}
                </button>
              ))}
            </div>
          </div>

          {/* Collision Manner Filter */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-3">
              Collision Manner
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.collision.map(collision => (
                <button
                  key={collision}
                  onClick={() => handleFilterChange('collision', collision)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all hover:scale-105 ${
                    filters.collision === collision
                      ? 'filter-active text-white'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-2 border-blue-300'
                  }`}
                >
                  {collision}
                </button>
              ))}
            </div>
          </div>

          {/* Work Zone Filter */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-3">
              Work Zone
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.workzone.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleFilterChange('workzone', value)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all hover:scale-105 ${
                    filters.workzone === value
                      ? 'filter-active text-white'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-2 border-blue-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(summary).map(([key, value], index) => (
          <div key={key} className={`metric-card glass rounded-2xl p-6 text-center slide-in-up stagger-${index + 1} border-2 border-purple-200`}>
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">{value.toLocaleString()}</div>
            <div className="text-xs text-slate-800 font-bold uppercase tracking-wider">{key.replace(/_/g, ' ')}</div>
          </div>
        ))}
      </div>

      {/* Monthly Trend Line */}
      <div className="chart-container glass p-6">
        <Plot
          data={[
            {
              x: monthly_trends.map(d => d.month),
              y: monthly_trends.map(d => d.total),
              type: 'scatter',
              mode: 'lines+markers',
              line: { color: '#8b5cf6', width: 3 },
              marker: { size: 10, color: '#ec4899' },
              fill: 'tozeroy',
              fillcolor: 'rgba(139, 92, 246, 0.1)'
            },
          ]}
          layout={{
            title: {
              text: 'Monthly Incident Trends',
              font: { size: 20, color: '#1e293b', family: 'Instrument Sans' }
            },
            xaxis: { title: 'Month', gridcolor: '#e2e8f0' },
            yaxis: { title: 'Incidents', gridcolor: '#e2e8f0' },
            hovermode: 'x unified',
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'rgba(248, 250, 252, 0.5)',
            margin: { t: 60, r: 40, b: 60, l: 60 },
          }}
          style={{ width: '100%', height: '400px' }}
          config={{ responsive: true }}
        />
      </div>

      {/* Geographic Map - FIXED VERSION */}
      {geo_points.length > 0 && (
        <div className="chart-container glass p-6">
          <Plot
            data={[
              {
                type: 'scattermapbox',
                lat: latitudes,
                lon: longitudes,
                text: hoverTexts,
                mode: 'markers',
                marker: {
                  size: 8,
                  color: '#ec4899',
                  opacity: 0.6,
                },
                hoverinfo: 'text',
              },
            ]}
            layout={{
              title: {
                text: `Incident Locations (${geo_points.length} points)`,
                font: { size: 20, color: '#1e293b', family: 'Instrument Sans' }
              },
              mapbox: {
                style: 'open-street-map',
                zoom: 11,
                center: { lat: 42.3601, lon: -71.0589 },
              },
              autosize: true,
              margin: { t: 60, r: 0, b: 0, l: 0 },
              hovermode: 'closest',
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
            }}
            style={{ width: '100%', height: '600px' }}
            config={{ 
              responsive: true,
              displayModeBar: true,
              scrollZoom: true,
              displaylogo: false,
              modeBarButtonsToRemove: ['select2d', 'lasso2d'],
              doubleClick: 'reset',
            }}
            useResizeHandler={true}
          />
        </div>
      )}
    </div>
  );
}