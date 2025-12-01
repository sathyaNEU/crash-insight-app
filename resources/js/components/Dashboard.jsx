import React, { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RefreshCw, BarChart3, Filter, X, Sparkles, Send } from 'lucide-react';

export default function DashboardComponent() {
  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states - single select (null means no filter)
  const [filters, setFilters] = useState({
    weather: null,
    light: null,
    collision: null,
    workzone: null
  });

  // AI Chat states
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

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

  // Get unique filter options from raw data
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

  // Apply filters and compute all metrics
  const computedData = useMemo(() => {
    if (!allIncidents.length) return null;

    // Filter incidents based on active filters
    const filteredIncidents = allIncidents.filter(incident => {
      if (filters.weather && incident.weather_condition !== filters.weather) return false;
      if (filters.light && incident.light_condition !== filters.light) return false;
      if (filters.collision && incident.collision_manner !== filters.collision) return false;
      if (filters.workzone && incident.work_zone_related !== filters.workzone) return false;
      return true;
    });

    // Compute summary metrics
    const summary = {
      total_incidents: filteredIncidents.length,
      fatal_injuries: filteredIncidents.reduce((sum, i) => sum + (parseInt(i.cnt_fatal_injury) || 0), 0),
      serious_injuries: filteredIncidents.reduce((sum, i) => sum + (parseInt(i.cnt_sus_serious_injury) || 0), 0),
      minor_injuries: filteredIncidents.reduce((sum, i) => sum + (parseInt(i.cnt_non_incapacitating_injury) || 0), 0)
    };

    // Compute monthly trends
    const monthlyMap = {};
    filteredIncidents.forEach(incident => {
      if (incident.incident_date) {
        const month = incident.incident_date.substring(0, 7); // YYYY-MM
        monthlyMap[month] = (monthlyMap[month] || 0) + 1;
      }
    });
    const monthly_trends = Object.entries(monthlyMap)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Compute geo points (limit to 1000 for performance)
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

    // Compute breakdowns by category
    const groupBy = (arr, key) => {
      const map = {};
      arr.forEach(item => {
        const val = item[key] || 'Unknown';
        if (!map[val]) map[val] = { total: 0, fatal: 0, serious: 0 };
        map[val].total += 1;
        map[val].fatal += parseInt(item.cnt_fatal_injury) || 0;
        map[val].serious += parseInt(item.cnt_sus_serious_injury) || 0;
      });
      return Object.entries(map).map(([name, stats]) => ({ name, ...stats }));
    };

    const by_weather = groupBy(filteredIncidents, 'weather_condition');
    const by_light = groupBy(filteredIncidents, 'light_condition');
    const by_collision = groupBy(filteredIncidents, 'collision_manner');
    
    const by_workzone = ['Y', 'N'].map(val => {
      const filtered = filteredIncidents.filter(i => i.work_zone_related === val);
      return {
        name: val === 'Y' ? 'Work Zone' : 'Non-Work Zone',
        total: filtered.length,
        fatal: filtered.reduce((sum, i) => sum + (parseInt(i.cnt_fatal_injury) || 0), 0),
        serious: filtered.reduce((sum, i) => sum + (parseInt(i.cnt_sus_serious_injury) || 0), 0)
      };
    });

    return {
      summary,
      monthly_trends,
      geo_points,
      by_weather,
      by_light,
      by_collision,
      by_workzone,
      filteredIncidents // Keep the full filtered incidents for AI
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
    
    // Prepare initial question
    const initialQuestion = "Please explain the trend in this data, explain why these accidents happened, what we could have done to help prevent it";
    
    setAiMessages([{ role: 'user', content: initialQuestion }]);
    setAiLoading(true);

    try {
      // Get top 10 filtered records
      const top10Records = computedData.filteredIncidents.slice(0, 10);
      
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: initialQuestion,
          data: top10Records,
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
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Loading interactive dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchAllIncidents}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!computedData || !filterOptions) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600">No incident data available</p>
      </div>
    );
  }

  const { summary, monthly_trends, geo_points } = computedData;

  // Geo map coordinates
  const latitudes = geo_points.map(p => parseFloat(p.latitude));
  const longitudes = geo_points.map(p => parseFloat(p.longitude));
  const hoverTexts = geo_points.map(p =>
    `${p.incident_location || 'Unknown'}<br>Fatal: ${p.cnt_fatal_injury}<br>Serious: ${p.cnt_sus_serious_injury}`
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">Interactive Analytics Dashboard</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExplainWithAI}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            Explain with AI
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
          <button
            onClick={fetchAllIncidents}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-900">AI Analysis</h3>
              </div>
              <button onClick={() => setShowAIChat(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <style>{`
                .ai-markdown h1 {
                  font-size: 1.25rem;
                  font-weight: 700;
                  color: #0f172a;
                  margin-bottom: 0.75rem;
                  margin-top: 0.5rem;
                }
                .ai-markdown h2 {
                  font-size: 1.125rem;
                  font-weight: 600;
                  color: #1e293b;
                  margin-top: 1rem;
                  margin-bottom: 0.5rem;
                  padding-bottom: 0.25rem;
                  border-bottom: 1px solid #e2e8f0;
                }
                .ai-markdown h3 {
                  font-size: 1rem;
                  font-weight: 600;
                  color: #334155;
                  margin-top: 0.75rem;
                  margin-bottom: 0.5rem;
                }
                .ai-markdown p {
                  margin-bottom: 0.75rem;
                  line-height: 1.6;
                  font-size: 0.875rem;
                  color: #475569;
                }
                .ai-markdown ul, .ai-markdown ol {
                  margin-bottom: 0.75rem;
                  padding-left: 1.25rem;
                  font-size: 0.875rem;
                }
                .ai-markdown li {
                  margin-bottom: 0.25rem;
                  line-height: 1.6;
                  color: #475569;
                }
                .ai-markdown strong {
                  font-weight: 600;
                  color: #1e293b;
                }
                .ai-markdown code {
                  background-color: #f1f5f9;
                  padding: 0.125rem 0.25rem;
                  border-radius: 0.25rem;
                  font-size: 0.8125rem;
                  color: #e11d48;
                }
                .ai-markdown pre {
                  background-color: #f8fafc;
                  padding: 0.75rem;
                  border-radius: 0.375rem;
                  overflow-x: auto;
                  margin-bottom: 0.75rem;
                  border: 1px solid #e2e8f0;
                }
                .ai-markdown pre code {
                  background-color: transparent;
                  padding: 0;
                  color: #334155;
                  font-size: 0.8125rem;
                }
              `}</style>
              {aiMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-900'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="ai-markdown">
                        <Markdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </Markdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-lg p-3">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                  </div>
                </div>
              )}
            </div>

            {questionCount >= 3 ? (
              <div className="p-4 border-t bg-amber-50 text-amber-800 text-sm">
                We have capped the number of clarifications on the presented data for API rate limiting, please re-use the explain with AI feature if you have more questions
              </div>
            ) : (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a follow-up question..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={aiLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={aiLoading || !userInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {3 - questionCount} questions remaining
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filters</h3>
          <span className="text-sm text-slate-500 ml-2">
            ({summary.total_incidents.toLocaleString()} incidents)
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Weather Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Weather Condition
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.weather.map(weather => (
                <button
                  key={weather}
                  onClick={() => handleFilterChange('weather', weather)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    filters.weather === weather
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {weather}
                </button>
              ))}
            </div>
          </div>

          {/* Light Condition Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Light Condition
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.light.map(light => (
                <button
                  key={light}
                  onClick={() => handleFilterChange('light', light)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    filters.light === light
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {light}
                </button>
              ))}
            </div>
          </div>

          {/* Collision Manner Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Collision Manner
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.collision.map(collision => (
                <button
                  key={collision}
                  onClick={() => handleFilterChange('collision', collision)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    filters.collision === collision
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {collision}
                </button>
              ))}
            </div>
          </div>

          {/* Work Zone Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Work Zone
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.workzone.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleFilterChange('workzone', value)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    filters.workzone === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
        {Object.entries(summary).map(([key, value]) => (
          <div key={key} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-blue-700">{value.toLocaleString()}</div>
            <div className="text-xs text-slate-600 mt-1 capitalize">{key.replace(/_/g, ' ')}</div>
          </div>
        ))}
      </div>

      {/* Monthly Trend Line */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <Plot
          data={[
            {
              x: monthly_trends.map(d => d.month),
              y: monthly_trends.map(d => d.total),
              type: 'scatter',
              mode: 'lines+markers',
              line: { color: '#2563eb', width: 3 },
              marker: { size: 8 },
            },
          ]}
          layout={{
            title: 'Monthly Incident Trends',
            xaxis: { title: 'Month' },
            yaxis: { title: 'Incidents' },
            hovermode: 'x unified',
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            margin: { t: 40, r: 40, b: 60, l: 60 },
          }}
          style={{ width: '100%', height: '400px' }}
          config={{ responsive: true }}
        />
      </div>

      {/* Geographic Map */}
      {geo_points.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <Plot
            data={[
              {
                type: 'scattermapbox',
                lat: latitudes,
                lon: longitudes,
                text: hoverTexts,
                mode: 'markers',
                marker: {
                  size: 9,
                  color: '#ef4444',
                  opacity: 0.7,
                },
              },
            ]}
            layout={{
              title: `Incident Locations (${geo_points.length} points)`,
              mapbox: {
                style: 'open-street-map',
                zoom: 12,
                center: { lat: 42.3876, lon: -71.0995 },
              },
              margin: { t: 40, r: 0, b: 0, l: 0 },
              hovermode: 'closest',
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
            }}
            style={{ width: '100%', height: '600px' }}
            config={{ responsive: true }}
          />
        </div>
      )}
    </div>
  );
}