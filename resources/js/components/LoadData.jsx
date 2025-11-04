import React, { useState } from 'react';
import { AlertCircle, Upload, Database, RefreshCw } from 'lucide-react';

export default function LoadDataComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [loadMetrics, setLoadMetrics] = useState(null);

  // Load data into the system
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
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert with Metrics */}
      {loadSuccess && loadMetrics && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Data Loaded Successfully</h3>
              <p className="text-sm text-green-700">All records have been imported into the system</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {Object.entries(loadMetrics).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-700">{value}</div>
                <div className="text-xs text-slate-600 mt-1 capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Load Data into System</h2>
        </div>

        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Load Incident Data
            </h3>
            <p className="text-slate-600 mb-8">
              This operation will import all traffic incident data into the system.
              Click the button below to start the data loading process.
            </p>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Loading Data...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  Load Data
                </>
              )}
            </button>

            <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700">
                <strong>Note:</strong> This will process and import all traffic incident records.
                The operation may take a few moments depending on the data size.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}