import React, { useState } from 'react';
import { Car, Database, Upload, BarChart3, Brain, MessageCircle } from 'lucide-react';
import ViewIncidentsComponent from './ViewIncidents';
import LoadDataComponent from './LoadData';
import DashboardComponent from './Dashboard';
import ReportComponent from './Reports';
import QAComponent from './QA';

export default function HomeComponent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, component: DashboardComponent },
    { id: 'view', label: 'View Incidents', icon: Database, component: ViewIncidentsComponent },
    { id: 'load', label: 'Load Data', icon: Upload, component: LoadDataComponent },
    { id: 'reports', label: 'AI - Insights', icon: Brain, component: ReportComponent },
    { id: 'qa', label: 'Q&A Assistant', icon: MessageCircle, component: QAComponent }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

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
              <p className="text-sm text-slate-600">
                Traffic incident data management system
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-lg shadow-sm p-1 inline-flex gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {ActiveComponent && <ActiveComponent />}
      </main>
    </div>
  );
}