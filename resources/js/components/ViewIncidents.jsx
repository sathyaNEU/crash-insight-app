import React, { useState, useEffect } from 'react';
import { AlertCircle, Database, RefreshCw, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function ViewIncidentsComponent() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 20;

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      const result = await response.json();
      const data = result.data || result;
      setIncidents(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Filter incidents based on search
  const filteredIncidents = incidents.filter(incident => {
    if (!searchTerm) return true;
    return Object.values(incident).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIncidents = filteredIncidents.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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

      <div className="glass rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold gradient-text">Incident Records</h2>
          </div>
          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg font-semibold btn-vibrant"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="p-8">
          {/* Search Bar */}
          {incidents.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl pulse-glow mb-6">
                <RefreshCw className="w-12 h-12 text-white animate-spin" />
              </div>
              <p className="text-lg text-slate-700 font-medium">Loading incidents...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block p-6 bg-slate-100 rounded-3xl mb-6">
                <Database className="w-16 h-16 text-slate-400" />
              </div>
              <p className="text-xl text-slate-600 font-bold mb-2">No incidents found</p>
              <p className="text-sm text-slate-500">Load data to populate the system</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <tr>
                      {Object.keys(incidents[0] || {}).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                        >
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {currentIncidents.map((incident, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/50 transition-colors">
                        {Object.values(incident).map((value, valueIdx) => (
                          <td key={valueIdx} className="px-6 py-4 text-sm text-slate-900">
                            {value !== null && value !== undefined ? String(value) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-slate-600 font-medium">
                  Showing <span className="font-bold text-purple-600">{startIndex + 1}</span> to <span className="font-bold text-purple-600">{Math.min(endIndex, filteredIncidents.length)}</span> of <span className="font-bold text-purple-600">{filteredIncidents.length.toLocaleString()}</span> incidents
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
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
                            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                : 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50'
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
                    className="p-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}