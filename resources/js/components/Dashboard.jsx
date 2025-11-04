import React, { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { RefreshCw, BarChart3, Filter, X } from 'lucide-react';

export default function DashboardComponent() {
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states - now using arrays for multi-select
  const [filters, setFilters] = useState({
    weather: [],
    light: [],
    collision: [],
    workzone: []
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      setAllData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    if (!allData) return null;
    
    return {
      weather: [...new Set(allData.by_weather.map(d => d.weather_condition))].filter(Boolean),
      light: [...new Set(allData.by_light.map(d => d.light_condition))].filter(Boolean),
      collision: [...new Set(allData.by_collision.map(d => d.collision_manner))].filter(Boolean),
      workzone: [
        { value: 'Y', label: 'Work Zone' },
        { value: 'N', label: 'Non-Work Zone' }
      ]
    };
  }, [allData]);

  // Apply filters to get filtered incidents
  const filteredData = useMemo(() => {
    if (!allData) return null;

    // Helper function to check if item matches filters
    const matchesFilters = (item, filterKey, itemValue) => {
      if (filters[filterKey].length === 0) return true;
      return filters[filterKey].includes(itemValue);
    };

    // Filter each dataset independently
    const filteredWeather = allData.by_weather.filter(item =>
      matchesFilters(item, 'weather', item.weather_condition)
    );

    const filteredLight = allData.by_light.filter(item =>
      matchesFilters(item, 'light', item.light_condition)
    );

    const filteredCollision = allData.by_collision.filter(item =>
      matchesFilters(item, 'collision', item.collision_manner)
    );

    const filteredWorkzone = allData.by_workzone.filter(item =>
      matchesFilters(item, 'workzone', item.work_zone_related)
    );

    // Calculate filtered summary metrics
    const totalIncidents = filters.weather.length === 0 && filters.light.length === 0 && 
                           filters.collision.length === 0 && filters.workzone.length === 0
      ? allData.summary.total_incidents
      : Math.min(
          filters.weather.length > 0 ? filteredWeather.reduce((sum, d) => sum + d.total, 0) : Infinity,
          filters.light.length > 0 ? filteredLight.reduce((sum, d) => sum + d.total, 0) : Infinity,
          filters.collision.length > 0 ? filteredCollision.reduce((sum, d) => sum + d.total, 0) : Infinity,
          filters.workzone.length > 0 ? filteredWorkzone.reduce((sum, d) => sum + d.total, 0) : Infinity
        );

    // For injuries, we'll proportionally scale based on filtered incidents
    const filterRatio = totalIncidents / allData.summary.total_incidents;
    
    const summary = {
      total_incidents: totalIncidents,
      fatal_injuries: Math.round(allData.summary.fatal_injuries * filterRatio),
      serious_injuries: Math.round(allData.summary.serious_injuries * filterRatio),
      minor_injuries: Math.round(allData.summary.minor_injuries * filterRatio)
    };

    // Filter monthly trends (approximate based on filter ratio)
    const monthly_trends = allData.monthly_trends.map(month => ({
      ...month,
      total: Math.round(month.total * filterRatio)
    }));

    // For geo points, we'll show all if no filters, or sample based on filter ratio
    const geo_points = filterRatio === 1 
      ? allData.geo_points 
      : allData.geo_points.slice(0, Math.round(allData.geo_points.length * filterRatio));

    return {
      summary,
      monthly_trends,
      geo_points,
      by_weather: filteredWeather,
      by_light: filteredLight,
      by_collision: filteredCollision,
      by_workzone: filteredWorkzone
    };
  }, [allData, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const isSelected = currentValues.includes(value);
      
      return {
        ...prev,
        [filterType]: isSelected
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      weather: [],
      light: [],
      collision: [],
      workzone: []
    });
  };

  const hasActiveFilters = Object.values(filters).some(f => f.length > 0);

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Loading interactive dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 py-20">{error}</div>;
  }

  if (!allData || !filteredData || !filterOptions) return null;

  const { summary, monthly_trends, geo_points } = filteredData;

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
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filters</h3>
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
                    filters.weather.includes(weather)
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
                    filters.light.includes(light)
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
                    filters.collision.includes(collision)
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
                    filters.workzone.includes(value)
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
            <div className="text-3xl font-bold text-blue-700">{value}</div>
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
            title: 'Incident Locations (Geo Distribution)',
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
    </div>
  );
}