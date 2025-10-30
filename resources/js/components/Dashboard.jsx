import React, { useState, useEffect } from 'react';
import { AlertCircle, Upload, Database, RefreshCw, MapPin, Calendar, Car, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SomervilleCrashDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [loadMetrics, setLoadMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('view');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch incidents from API
  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      const result = await response.json();
      // Handle Laravel API response structure { success: true, data: [...] }
      const data = result.data || result;
      setIncidents(Array.isArray(data) ? data : []);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (err) {
      setError(err.message);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (activeTab === 'view') {
      fetchIncidents();
      setLoadSuccess(false);
      setLoadMetrics(null);
    }
  }, [activeTab]);

  // Pagination calculations
  const totalPages = Math.ceil(incidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIncidents = incidents.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Somerville Crash Analysis
              </h1>
              <p className="text-sm text-slate-600">Traffic incident data management system</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-lg shadow-sm p-1 inline-flex gap-1">
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === 'view'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              View Incidents
            </div>
          </button>
          <button
            onClick={() => setActiveTab('load')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === 'load'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Load Data
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* View Incidents Tab */}
        {activeTab === 'view' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Incident Records</h2>
              <button
                onClick={fetchIncidents}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-slate-600">Loading incidents...</p>
                </div>
              ) : incidents.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">No incidents found</p>
                  <p className="text-sm text-slate-500 mt-1">Load data to populate the system</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {Object.keys(incidents[0] || {}).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                            >
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {currentIncidents.map((incident, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            {Object.values(incident).map((value, valueIdx) => (
                              <td key={valueIdx} className="px-4 py-3 text-sm text-slate-900">
                                {value !== null && value !== undefined ? String(value) : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                    <div className="text-sm text-slate-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, incidents.length)} of {incidents.length} incidents
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first page, last page, current page, and pages around current
                            return page === 1 || 
                                   page === totalPages || 
                                   (page >= currentPage - 1 && page <= currentPage + 1);
                          })
                          .map((page, idx, arr) => (
                            <React.Fragment key={page}>
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span className="px-2 text-slate-400">...</span>
                              )}
                              <button
                                onClick={() => goToPage(page)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))}
                      </div>
                      
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Load Data Tab */}
        {activeTab === 'load' && (
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
        )}
      </main>
    </div>
  );
}