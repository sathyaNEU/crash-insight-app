import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { RefreshCw, BarChart3 } from 'lucide-react';

export default function DashboardComponent() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      setMetrics(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading)
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Loading interactive dashboard...</p>
      </div>
    );

  if (error) return <div className="text-center text-red-600 py-20">{error}</div>;
  if (!metrics) return null;

  const { summary, by_weather, by_light, by_collision, by_workzone, monthly_trends, geo_points } = metrics;

  // Geo map coordinates
  const latitudes = geo_points.map(p => p.latitude);
  const longitudes = geo_points.map(p => p.longitude);
  const hoverTexts = geo_points.map(p =>
    `${p.incident_location || 'Unknown'}<br>Fatal: ${p.cnt_fatal_injury}<br>Serious: ${p.cnt_sus_serious_injury}`
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-slate-900">Interactive Analytics Dashboard</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(summary).map(([key, value]) => (
          <div key={key} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{value}</div>
            <div className="text-xs text-slate-600 mt-1 capitalize">{key.replace(/_/g, ' ')}</div>
          </div>
        ))}
      </div>

      {/* Weather Bar */}
      <Plot
        data={[
          {
            x: by_weather.map(d => d.weather_condition || 'Unknown'),
            y: by_weather.map(d => d.total),
            type: 'bar',
            marker: { color: '#2563eb' },
          },
        ]}
        layout={{
          title: 'Incidents by Weather Condition',
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { color: '#1e293b' },
        }}
        style={{ width: '100%', height: '400px' }}
      />

      {/* Light Condition Pie */}
      <Plot
        data={[
          {
            type: 'pie',
            labels: by_light.map(d => d.light_condition || 'Unknown'),
            values: by_light.map(d => d.total),
            textinfo: 'label+percent',
            hoverinfo: 'label+value+percent',
            marker: { colors: ['#1e40af', '#2563eb', '#60a5fa', '#a5b4fc', '#93c5fd'] },
          },
        ]}
        layout={{
          title: 'Incidents by Light Condition',
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
        }}
        style={{ width: '100%', height: '400px' }}
      />

      {/* Collision Sunburst */}
      <Plot
        data={[
          {
            type: 'sunburst',
            labels: by_collision.map(d => d.collision_manner || 'Unknown'),
            parents: by_collision.map(() => ''),
            values: by_collision.map(d => d.total),
            branchvalues: 'total',
          },
        ]}
        layout={{
          title: 'Collision Manner Breakdown',
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
        }}
        style={{ width: '100%', height: '400px' }}
      />

      {/* Monthly Trend Line */}
      <Plot
        data={[
          {
            x: monthly_trends.map(d => d.month),
            y: monthly_trends.map(d => d.total),
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#2563eb', width: 3 },
          },
        ]}
        layout={{
          title: 'Monthly Incident Trends',
          xaxis: { title: 'Month' },
          yaxis: { title: 'Incidents' },
          hovermode: 'x unified',
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
        }}
        style={{ width: '100%', height: '400px' }}
      />

      {/* Work Zone Donut */}
      <Plot
        data={[
          {
            type: 'pie',
            hole: 0.5,
            labels: by_workzone.map(d => (d.is_work_zone ? 'Work Zone' : 'Non-Work Zone')),
            values: by_workzone.map(d => d.total),
            marker: { colors: ['#22c55e', '#facc15'] },
          },
        ]}
        layout={{
          title: 'Work Zone vs Non-Work Zone Incidents',
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
        }}
        style={{ width: '100%', height: '400px' }}
      />

      {/* Geographic Map */}
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
            zoom: 11,
            center: { lat: 42.3876, lon: -71.0995 }, // default Somerville
          },
          margin: { t: 40, b: 20 },
          hovermode: 'closest',
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
        }}
        style={{ width: '100%', height: '600px' }}
      />

      {/* Scatter Matrix (Optional Advanced Visualization) */}
      <Plot
        data={[
          {
            type: 'splom',
            dimensions: [
              { label: 'Fatal Injuries', values: geo_points.map(p => p.cnt_fatal_injury) },
              { label: 'Serious Injuries', values: geo_points.map(p => p.cnt_sus_serious_injury) },
            ],
            text: geo_points.map(p => p.incident_location),
            marker: { color: '#3b82f6', size: 6 },
          },
        ]}
        layout={{
          title: 'Injury Correlation (Scatter Matrix)',
          dragmode: 'select',
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
        }}
        style={{ width: '100%', height: '600px' }}
      />
    </div>
  );
}
