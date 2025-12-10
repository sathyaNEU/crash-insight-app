import React, { useState } from 'react';
import { AlertCircle, Upload, Database, RefreshCw, CheckCircle } from 'lucide-react';

export default function LoadDataComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [loadMetrics, setLoadMetrics] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setLoadSuccess(false);
    setLoadMetrics(null);
    try {
      const response = await fetch('/api/v1/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to load data');
      const result = await response.json();
      setLoadSuccess(true);
      setLoadMetrics(result.counts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Error Alert */}
      {error && (
        <div className="mb-6 glass rounded-2xl p-6 flex items-start gap-4 border-l-4 border-red-500 slide-in-up">
          <div className="p-3 bg-red-100 rounded-xl">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-red-900 text-lg">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert with Metrics */}
      {loadSuccess && loadMetrics && (
        <div className="mb-6 glass rounded-2xl p-8 border-l-4 border-green-500 slide-in-up">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-green-100 rounded-xl pulse-glow">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-xl">Data Loaded Successfully!</h3>
              <p className="text-sm text-green-700 mt-1">All records have been imported into the system</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {Object.entries(loadMetrics).map(([key, value], index) => (
              <div key={key} className={`metric-card glass rounded-xl p-4 border border-green-200 slide-in-up stagger-${index + 1}`}>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{value}</div>
                <div className="text-xs text-slate-600 mt-1 capitalize font-medium">
                  {key.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
          <h2 className="text-2xl font-bold gradient-text">Load Data into System</h2>
        </div>

        <div className="p-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-block p-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl mb-8 float-animation">
              <Upload className="w-16 h-16 text-white" />
            </div>
            
            <h3 className="text-3xl font-bold text-slate-900 mb-4">
              Load Incident Data
            </h3>
            <p className="text-slate-600 mb-12 text-lg">
              This operation will import all traffic incident data into the system.
              Click the button below to start the data loading process.
            </p>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl hover:shadow-purple-500/50 text-lg btn-vibrant"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  Loading Data...
                </>
              ) : (
                <>
                  <Database className="w-6 h-6" />
                  Load Data
                </>
              )}
            </button>

            <div className="mt-12 p-6 glass rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Note:</strong> This will process and import all traffic incident records.
                The operation may take a few moments depending on the data size.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}