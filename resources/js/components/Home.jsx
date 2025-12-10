import React, { useState, useEffect } from 'react';
import { Car, Database, Upload, BarChart3, Brain, MessageCircle, ArrowRight, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import ViewIncidentsComponent from './ViewIncidents';
import LoadDataComponent from './LoadData';
import DashboardComponent from './Dashboard';
import ReportComponent from './Reports';
import QAComponent from './QA';

export default function HomeComponent() {
  const [activeTab, setActiveTab] = useState('home');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const tabs = [
    { id: 'load', label: 'Load Data', icon: Upload, component: LoadDataComponent },
    { id: 'view', label: 'View Incidents', icon: Database, component: ViewIncidentsComponent },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, component: DashboardComponent },
    { id: 'reports', label: 'AI Insights', icon: Brain, component: ReportComponent },
    { id: 'qa', label: 'Q&A Assistant', icon: MessageCircle, component: QAComponent }
  ];

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="glass-dark sticky top-0 z-50 border-b border-white/10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer slide-in-left"
              onClick={() => setActiveTab('home')}
            >
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl pulse-glow">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Somerville Crash Analysis
                </h1>
                <p className="text-xs text-purple-200">
                  AI-Powered Traffic Intelligence
                </p>
              </div>
            </div>
            
            {activeTab !== 'home' && (
              <button
                onClick={() => setActiveTab('home')}
                className="px-4 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                ← Back to Home
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' ? (
          <IntroductionPage setActiveTab={setActiveTab} mousePosition={mousePosition} />
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="mb-8 slide-in-up">
              <div className="glass rounded-2xl p-2 inline-flex gap-2 shadow-2xl">
                {tabs.map(({ id, label, icon: Icon }, index) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 relative slide-in-up stagger-${index + 1} ${
                      activeTab === id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                        : 'text-slate-700 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {activeTab === id && <div className="tab-indicator" />}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Component Content */}
            <div className="slide-in-up stagger-2">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function IntroductionPage({ setActiveTab, mousePosition }) {
  const features = [
    {
      icon: BarChart3,
      title: 'Interactive Dashboard',
      description: 'Visualize crash data with dynamic filters and real-time analytics',
      color: 'from-blue-500 to-cyan-500',
      delay: '0.1s'
    },
    {
      icon: Brain,
      title: 'AI Insights',
      description: 'Pre-computed reports with deep analysis powered by Claude AI',
      color: 'from-purple-500 to-pink-500',
      delay: '0.2s'
    },
    {
      icon: MessageCircle,
      title: 'Q&A Assistant',
      description: 'Ask questions about incidents using natural language',
      color: 'from-green-500 to-emerald-500',
      delay: '0.3s'
    },
    {
      icon: Database,
      title: 'Data Management',
      description: 'Load, view, and manage traffic incident records efficiently',
      color: 'from-orange-500 to-red-500',
      delay: '0.4s'
    }
  ];

  const stats = [
    { label: 'Traffic Incidents', value: '10K+', icon: TrendingUp },
    { label: 'AI Accuracy', value: '95%', icon: Sparkles },
    { label: 'Response Time', value: '<2s', icon: Zap },
    { label: 'Data Security', value: '100%', icon: Shield }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(/highway.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        
        <div className="gradient-animated absolute inset-0 opacity-80" />
        
        <div className="relative glass-dark rounded-3xl p-12 lg:p-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6 slide-in-up">
              <div className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="text-purple-300 font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Traffic Safety Platform
                </span>
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 slide-in-up stagger-1">
              Somerville
              <span className="block gradient-text neon-glow">Crash Analysis</span>
            </h1>
            
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto slide-in-up stagger-2">
              Transform traffic incident data into actionable insights with advanced AI analytics, 
              interactive visualizations, and intelligent Q&A capabilities.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center slide-in-up stagger-3">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2 btn-vibrant"
              >
                Explore Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => setActiveTab('qa')}
                className="px-8 py-4 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                Ask AI Assistant
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="slide-in-up stagger-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className={`glass rounded-2xl p-6 text-center card-hover slide-in-up`}
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
            >
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center float-animation">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold gradient-text mb-2">{stat.value}</div>
              <div className="text-sm text-slate-700 font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="slide-in-up stagger-3">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-purple-200 text-lg">
            Everything you need to analyze and understand traffic incidents
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`glass rounded-2xl p-8 card-hover cursor-pointer group slide-in-up`}
              style={{ animationDelay: feature.delay }}
              onClick={() => {
                if (feature.title.includes('Dashboard')) setActiveTab('dashboard');
                else if (feature.title.includes('Insights')) setActiveTab('reports');
                else if (feature.title.includes('Q&A')) setActiveTab('qa');
                else if (feature.title.includes('Data')) setActiveTab('load');
              }}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 pulse-glow`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-slate-700 leading-relaxed mb-4 font-medium">
                {feature.description}
              </p>
              
              <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                Learn More
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="slide-in-up stagger-4">
        <div className="glass-dark rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20" />
          
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-purple-200 text-lg mb-8 max-w-2xl mx-auto">
              Begin your journey to safer streets with AI-powered traffic analysis
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => setActiveTab('load')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Load Data
              </button>
              
              <button
                onClick={() => setActiveTab('view')}
                className="px-8 py-4 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                <Database className="w-5 h-5" />
                View Incidents
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}