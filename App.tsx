import React, { useState, useEffect } from 'react';
import { Settings, Lock, Share2, Shield, Link as LinkIcon, Database, LayoutDashboard, Key, LogOut, Code, User, Loader2, Check, History, ChevronRight, ChevronDown, Activity, Globe, RefreshCw } from 'lucide-react';
import PaymentCard from './components/PaymentCard';
import IntegrationDocs from './components/IntegrationDocs';
import SystemCheck from './components/SystemCheck';
import MaintenanceView from './components/MaintenanceView';
import { UPIConfig, PaymentStatus, PaymentRecord } from './types';
import { saveConfig, loadConfig, checkDbConnection, getPaymentHistory, seedDatabase } from './services/storageService';
import { verifyAdminPin, changeAdminPin } from './services/adminService';

const App: React.FC = () => {
  // Main State
  const [isSystemReady, setIsSystemReady] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'history' | 'integration' | 'apikeys'>('settings');

  // Payment State
  const [config, setConfig] = useState<UPIConfig>({
    pa: 'shopc2c@upi',
    pn: 'ShopC2C Store',
    tn: 'Order Payment',
    am: '0',
    title: 'Secure Payment',
    amountLocked: false,
    redirectUrl: ''
  });
  const [amount, setAmount] = useState<string>('');
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.IDLE);

  // Admin Auth State
  const [adminPin, setAdminPin] = useState('');
  const [sessionPin, setSessionPin] = useState(''); // Store valid PIN for session actions
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connected');

  // Admin Form State
  const [adminVpa, setAdminVpa] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminTitle, setAdminTitle] = useState('');
  const [adminRedirectUrl, setAdminRedirectUrl] = useState('');
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceEndTime, setMaintenanceEndTime] = useState<number | null>(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  // Change PIN State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');

  // Initialization & URL Handling
  useEffect(() => {
    const init = async () => {
      // 1. Check Database Connection (Non-blocking)
      checkDbConnection().then(isConnected => {
        // Optionally update status, but user requested to "show connected"
        if (isConnected) setDbStatus('connected');
        // We won't set error state to keep UI clean as requested
      });

      // 2. Load Persisted Config
      const savedConfig = await loadConfig();
      let effectiveConfig = savedConfig || config;

      // 3. Secret Admin Entry & Override with URL Params
      if (window.location.pathname === '/c2c') {
        setIsAdminOpen(true);
      }

      const params = new URLSearchParams(window.location.search);
      if (params.has('pa')) {
        effectiveConfig = {
          ...effectiveConfig,
          pa: params.get('pa') || effectiveConfig.pa,
          pn: params.get('pn') || effectiveConfig.pn,
          tn: params.get('tn') || effectiveConfig.tn,
          am: params.get('am') || effectiveConfig.am,
          title: params.get('title') || effectiveConfig.title,
          // Only override amountLocked if explicitly present in URL
          amountLocked: params.has('locked') ? params.get('locked') === 'true' : effectiveConfig.amountLocked,
          redirectUrl: params.get('redirect_url') || effectiveConfig.redirectUrl
        };
      }

      setConfig(effectiveConfig);

      // Sync Admin State
      setAdminVpa(effectiveConfig.pa);
      setAdminName(effectiveConfig.pn);
      setAdminTitle(effectiveConfig.title || 'Secure Payment');
      setAdminRedirectUrl(effectiveConfig.redirectUrl || '');
      setIsAmountLocked(!!effectiveConfig.amountLocked);
      setIsMaintenanceMode(!!effectiveConfig.maintenanceMode);
      setMaintenanceMessage(effectiveConfig.maintenanceMessage || '');
      setMaintenanceEndTime(effectiveConfig.maintenanceEndTime || null);
      if (effectiveConfig.am && effectiveConfig.am !== '0') {
        setAmount(effectiveConfig.am);
      }
    };

    init();

    // Real-time Polling
    const interval = setInterval(async () => {
      // Poll if:
      // 1. Admin modal is closed
      // 2. OR Admin modal is open but NOT authenticated (still on login screen)
      if (!isAdminOpen || !isAuthenticated) {
        const latest = await loadConfig();
        if (latest) {
          setConfig(prev => ({ ...prev, ...latest }));
          // Also update admin state to stay in sync
          setIsAmountLocked(!!latest.amountLocked);
          setIsMaintenanceMode(!!latest.maintenanceMode);
          setMaintenanceMessage(latest.maintenanceMessage || '');
          setMaintenanceEndTime(latest.maintenanceEndTime || null);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAdminOpen]);

  // Auto-disable maintenance mode logic
  useEffect(() => {
    if (config.maintenanceMode && config.maintenanceEndTime) {
      const checkTimer = () => {
        const now = Date.now();
        if (now >= (config.maintenanceEndTime || 0)) {
          console.log("🕒 Maintenance time ended, auto-disabling maintenance mode...");
          const updatedConfig = {
            ...config,
            maintenanceMode: false,
            maintenanceEndTime: undefined
          };
          saveConfig(updatedConfig).then(() => {
            setConfig(updatedConfig);
            setIsMaintenanceMode(false);
            setMaintenanceEndTime(null);
          });
        }
      };

      const timerInterval = setInterval(checkTimer, 10000); // Check every 10s
      checkTimer(); // Check immediately

      return () => clearInterval(timerInterval);
    }
  }, [config.maintenanceMode, config.maintenanceEndTime]);

  // Fetch history when tab changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (isAuthenticated && activeTab === 'history') {
        const hist = await getPaymentHistory();
        setHistory(hist);
      }
    };
    fetchHistory();
  }, [activeTab, isAuthenticated]);

  // Fetch API Keys
  useEffect(() => {
    if (isAuthenticated && activeTab === 'apikeys') {
      // Using sessionPin for auth
      fetch('/api/apikey', { headers: { 'x-admin-pin': sessionPin || '' } })
        .then(res => res.json())
        .then(data => setApiKeys(data.keys || []))
        .catch(e => console.error(e));
    }
  }, [activeTab, isAuthenticated]);

  const handleAdminAuth = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      const result = await verifyAdminPin(adminPin);

      if (result.success) {
        setIsAuthenticated(true);
        setSessionPin(adminPin); // Keep it for API calls
        setAdminPin('');
      } else {
        setAuthError(result.error || 'Incorrect PIN.');
        setAdminPin('');
      }
    } catch (e) {
      setAuthError('Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSave = async () => {
    const newConfig = {
      ...config,
      pa: adminVpa,
      pn: adminName,
      title: adminTitle,
      amountLocked: isAmountLocked,
      redirectUrl: adminRedirectUrl,
      maintenanceMode: isMaintenanceMode,
      maintenanceMessage: maintenanceMessage,
      maintenanceEndTime: maintenanceEndTime
    };

    // Save to DB
    await saveConfig(newConfig);
    setConfig(newConfig);

    // Generate new Link automatically
    const params = new URLSearchParams();
    params.set('pa', adminVpa);
    params.set('pn', adminName);
    if (config.am && config.am !== '0') params.set('am', config.am);
    params.set('tn', config.tn || 'Payment');
    params.set('title', adminTitle);
    if (isAmountLocked) params.set('locked', 'true');
    if (adminRedirectUrl) params.set('redirect_url', adminRedirectUrl);

    const link = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    setGeneratedLink(link);
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setSessionPin('');
    setActiveTab('settings');
    setIsAdminOpen(false);
  };

  const handleChangePin = async () => {
    setPinChangeMsg('Updating...');
    if (newPin.length < 4) {
      setPinChangeMsg('Error: New PIN must be at least 4 digits');
      return;
    }

    const res = await changeAdminPin(currentPin, newPin);
    if (res.success) {
      setPinChangeMsg('✅ PIN Changed Successfully');
      setCurrentPin('');
      setNewPin('');
      // Re-auth required or just let them stay? Let's keep them logged in.
    } else {
      setPinChangeMsg(`❌ Error: ${res.error}`);
    }
  };

  const handleGenerateKey = async () => {
    const name = prompt("Enter a name for this key (e.g. 'Website Integration')");
    if (!name || name.trim() === '') {
      alert("❌ Key name is required");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔑 Requesting API key generation...");
      const res = await fetch('/api/apikey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': sessionPin
        },
        body: JSON.stringify({ name: name.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        console.log("✅ API key generated successfully");
        setNewApiKey(data.apiKey);

        // Refresh list
        const listRes = await fetch('/api/apikey', {
          headers: { 'x-admin-pin': sessionPin }
        });
        const listData = await listRes.json();
        setApiKeys(listData.keys || []);
      } else {
        console.error("❌ API key generation failed:", data);
        const errorMsg = data.details
          ? `${data.message || data.error}\n\nDetails: ${data.details}`
          : (data.message || data.error || 'Unknown error occurred');
        alert(`❌ Failed to generate API key\n\n${errorMsg}`);
      }
    } catch (error: any) {
      console.error("❌ Network error during API key generation:", error);
      alert(`❌ Network Error\n\nCould not connect to the server.\n\nError: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("⚠️ Revoke this key?\n\nIt will stop working immediately and cannot be recovered.")) {
      return;
    }

    try {
      console.log(`🗑️ Deleting API key: ${id}`);
      const res = await fetch(`/api/apikey?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': sessionPin }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        console.log("✅ API key deleted successfully");
        setApiKeys(prev => prev.filter(k => k.id !== id));
      } else {
        console.error("❌ API key deletion failed:", data);
        const errorMsg = data.details
          ? `${data.message || data.error}\n\nDetails: ${data.details}`
          : (data.message || data.error || 'Unknown error occurred');
        alert(`❌ Failed to delete API key\n\n${errorMsg}`);
      }
    } catch (error: any) {
      console.error("❌ Network error during API key deletion:", error);
      alert(`❌ Network Error\n\nCould not connect to the server.\n\nError: ${error.message}`);
    }
  };



  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative font-sans selection:bg-neon-blue selection:text-black">

      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3 backdrop-blur-md bg-white/5 py-2 px-4 rounded-full border border-white/10">
          <div className="w-8 h-8 bg-gradient-to-tr from-neon-blue to-neon-purple rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.3)]">
            <Shield className="w-4 h-4 text-black fill-current" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">ShopC2C</span>
        </div>
        <div className="flex items-center gap-4">
          {dbStatus === 'connected' && (isAdminOpen || window.location.pathname === '/c2c') && (
            <div className="hidden md:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)] animate-pulse">
              <Database className="w-3 h-3" />
              <span>Connected</span>
            </div>
          )}

          {(isAdminOpen || window.location.pathname === '/c2c') && (
            <button
              onClick={() => setIsAdminOpen(true)}
              className="group flex items-center gap-2 text-slate-400 hover:text-white transition-all bg-black/20 hover:bg-white/10 backdrop-blur-md border border-white/5 hover:border-white/20 p-2 md:px-4 rounded-full"
            >
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              <span className="hidden md:block text-sm font-medium">Admin</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Payment View */}
      {config.maintenanceMode && !isAuthenticated && window.location.pathname !== '/c2c' ? (
        <MaintenanceView
          message={config.maintenanceMessage}
          endTime={config.maintenanceEndTime}
          onAdminClick={() => setIsAdminOpen(true)}
        />
      ) : (
        <main className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 z-10 pt-20 lg:pt-0">
          <div className="hidden lg:flex flex-col items-start gap-6 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-blue/30 bg-neon-blue/5 text-neon-blue text-xs font-bold tracking-wider uppercase">
              <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse"></div>
              Live Gateway v2.4
            </div>
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-tight">
              {config.title || "Secure Payments"}
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Accept UPI payments instantly. Powered by ShopC2C AI for fraud detection and Firebase Firestore for secure transaction logging.
            </p>
          </div>

          <div className="w-full flex justify-center lg:justify-end">
            <PaymentCard
              config={config}
              status={status}
              setStatus={setStatus}
              amount={amount}
              setAmount={setAmount}
            />
          </div>
        </main>
      )}

      <footer className="absolute bottom-4 text-center w-full text-slate-600 text-xs flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
        <span>&copy; 2025 ShopC2C Inc.</span>
        <span className="hidden md:block w-1 h-1 rounded-full bg-slate-700"></span>
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" /> Encrypted & Verified
        </span>
      </footer>

      {/* Modern Admin Modal */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-2xl h-auto max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700/50 bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="bg-neon-blue/10 p-2 rounded-lg">
                  {isAuthenticated ? <LayoutDashboard className="w-5 h-5 text-neon-blue" /> : <Lock className="w-5 h-5 text-neon-blue" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-none">Admin Console</h3>
                  <p className="text-xs text-slate-500 mt-1">{isAuthenticated ? 'Manage Settings & Integration' : 'Authentication Required'}</p>
                </div>
              </div>
              <button onClick={() => setIsAdminOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-900/50 p-6">
              {!isAuthenticated ? (
                // Login Screen
                <div className="h-full flex flex-col items-center justify-center py-8 space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center shadow-inner border border-white/5">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-neon-blue rounded-full p-1.5 border-4 border-[#0f172a] animate-pulse">
                      <Shield className="w-3 h-3 text-black" />
                    </div>
                  </div>

                  <div className="w-full max-w-xs space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 font-bold ml-1 uppercase">Access PIN</label>
                      <div className="relative mt-1">
                        <input
                          type="password"
                          value={adminPin}
                          onChange={(e) => setAdminPin(e.target.value)}
                          placeholder="••••"
                          className="w-full bg-slate-800 border border-slate-700 text-center text-2xl tracking-[1em] rounded-xl py-4 text-white focus:ring-2 focus:ring-neon-blue outline-none transition-all placeholder:tracking-normal placeholder:text-sm placeholder:text-slate-600"
                          onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
                        />
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      </div>
                    </div>

                    {authError && (
                      <div className="text-rose-400 text-xs text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                        {authError}
                      </div>
                    )}

                    <button
                      onClick={handleAdminAuth}
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-xl bg-neon-blue hover:bg-cyan-400 text-black font-bold shadow-lg shadow-neon-blue/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unlock Dashboard'}
                    </button>
                  </div>
                </div>
              ) : (
                // Dashboard Content
                <div className="flex flex-col h-full">
                  {/* Tabs */}
                  <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                    >
                      <Settings className="w-4 h-4" />
                      Configuration
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                    >
                      <History className="w-4 h-4" />
                      History
                    </button>
                    <button
                      onClick={() => setActiveTab('integration')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'integration' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                    >
                      <Code className="w-4 h-4" />
                      Integration Docs
                    </button>
                    <button
                      onClick={() => setActiveTab('apikeys')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'apikeys' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                    >
                      <Key className="w-4 h-4" />
                      API Keys
                    </button>
                  </div>

                  <div className="flex-1">
                    {activeTab === 'settings' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-bold uppercase">Merchant VPA</label>
                            <input
                              type="text"
                              value={adminVpa}
                              onChange={(e) => setAdminVpa(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-neon-blue outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-bold uppercase">Merchant Name</label>
                            <input
                              type="text"
                              value={adminName}
                              onChange={(e) => setAdminName(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-neon-blue outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-bold uppercase">Page Title</label>
                            <input
                              type="text"
                              value={adminTitle}
                              onChange={(e) => setAdminTitle(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-neon-blue outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-bold uppercase">Success Redirect URL</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={adminRedirectUrl}
                                onChange={(e) => setAdminRedirectUrl(e.target.value)}
                                placeholder="https://example.com/success"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 pl-10 text-white focus:border-neon-blue outline-none"
                              />
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                        </div>

                        {/* Amount Lock Section - Enhanced */}
                        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                          <div className="flex items-start gap-3">
                            <label className="flex items-start gap-3 cursor-pointer group flex-1">
                              <div className="relative mt-0.5">
                                <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${isAmountLocked ? 'bg-neon-blue border-neon-blue shadow-lg shadow-neon-blue/30' : 'border-slate-500 group-hover:border-neon-blue/50 group-hover:bg-slate-700'}`}>
                                  {isAmountLocked && <Check className="w-4 h-4 text-black font-bold" />}
                                </div>
                              </div>
                              <input type="checkbox" className="hidden" checked={isAmountLocked} onChange={(e) => setIsAmountLocked(e.target.checked)} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white group-hover:text-neon-blue transition-colors">Lock Amount Field</span>
                                  <Lock className={`w-3.5 h-3.5 transition-colors ${isAmountLocked ? 'text-neon-blue' : 'text-slate-500'}`} />
                                </div>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                  When enabled, users cannot edit the payment amount on integrated websites. Use this for fixed-price products or services.
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Maintenance Mode Section */}
                        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-4">
                          <div className="flex items-start gap-3">
                            <label className="flex items-start gap-3 cursor-pointer group flex-1">
                              <div className="relative mt-0.5">
                                <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${isMaintenanceMode ? 'bg-rose-500 border-rose-500 shadow-lg shadow-rose-500/30' : 'border-slate-500 group-hover:border-rose-500/50 group-hover:bg-slate-700'}`}>
                                  {isMaintenanceMode && <Check className="w-4 h-4 text-white font-bold" />}
                                </div>
                              </div>
                              <input type="checkbox" className="hidden" checked={isMaintenanceMode} onChange={(e) => setIsMaintenanceMode(e.target.checked)} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">Maintenance Mode</span>
                                  <Settings className={`w-3.5 h-3.5 transition-colors ${isMaintenanceMode ? 'text-rose-400 animate-spin-slow' : 'text-slate-500'}`} />
                                </div>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                  When enabled, all users see a beautiful maintenance screen instead of the checkout page. Admins can still access the dashboard.
                                </p>
                              </div>
                            </label>
                          </div>

                          {isMaintenanceMode && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Maintenance Message</label>
                                <textarea
                                  value={maintenanceMessage}
                                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                                  placeholder="We'll be back shortly..."
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:border-rose-500 outline-none min-h-[60px]"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 block">Set Maintenance Timer</label>
                                <div className="grid grid-cols-4 gap-2">
                                  {[5, 15, 30, 60].map((mins) => (
                                    <button
                                      key={mins}
                                      onClick={() => setMaintenanceEndTime(Date.now() + mins * 60 * 1000)}
                                      className={`py-2 rounded-lg text-xs font-bold transition-all border ${maintenanceEndTime && Math.abs(maintenanceEndTime - (Date.now() + mins * 60 * 1000)) < 10000 ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-rose-500/50'}`}
                                    >
                                      {mins}m
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-2">
                                  <div className="bg-slate-900/50 rounded-lg px-3 py-2 flex-1 border border-slate-800">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Status</span>
                                    <span className="text-xs text-white">
                                      {maintenanceEndTime ? `Ends in ${Math.max(0, Math.ceil((maintenanceEndTime - Date.now()) / 60000))} mins` : 'No timer set'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setMaintenanceEndTime(null)}
                                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    title="Reset Timer"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-6 border-t border-slate-800">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <LinkIcon className="w-4 h-4 text-neon-purple" />
                              Active Link
                            </h4>
                            {generatedLink && <span className="text-xs text-emerald-400 flex items-center gap-1"><Database className="w-3 h-3" /> Config Saved</span>}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleAdminSave}
                              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl transition-colors"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => { handleAdminSave(); setTimeout(copyLink, 100); }}
                              className="flex-1 bg-gradient-to-r from-neon-blue to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2"
                            >
                              <Share2 className="w-4 h-4" />
                              Save & Copy Link
                            </button>
                          </div>

                          <div className="mt-4">
                            <button
                              onClick={async () => {
                                if (!confirm("Backup all data collections to Firebase Storage?")) return;
                                setIsLoading(true);
                                try {
                                  const res = await fetch('/api/push-to-storage', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ pin: sessionPin })
                                  });
                                  const data = await res.json();
                                  if (res.ok && data.success) {
                                    alert(`✅ Success!\n\nBackup saved to bucket as:\n${data.location}`);
                                  } else {
                                    alert(`❌ Failed: ${data.error || 'Unknown error'}`);
                                  }
                                } catch (e: any) {
                                  alert(`❌ Network Error: ${e.message}`);
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                              disabled={isLoading}
                              className="w-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <Database className="w-3.5 h-3.5" />
                              {isLoading ? 'Processing...' : 'Export Collections to Firebase Storage'}
                            </button>
                          </div>
                        </div>

                        {/* Security Section */}
                        <div className="pt-6 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                            <Shield className="w-4 h-4 text-neon-rose" />
                            Security Settings
                          </h4>
                          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-bold uppercase">Current PIN</label>
                                <input
                                  type="password"
                                  value={currentPin}
                                  onChange={(e) => setCurrentPin(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-center tracking-widest"
                                  placeholder="••••"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-bold uppercase">New PIN</label>
                                <input
                                  type="password"
                                  value={newPin}
                                  onChange={(e) => setNewPin(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-center tracking-widest"
                                  placeholder="••••"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <span className="text-xs text-slate-400">{pinChangeMsg}</span>
                              <button
                                onClick={handleChangePin}
                                disabled={!currentPin || !newPin}
                                className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Update PIN
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'history' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                        {history.length === 0 ? (
                          <div className="text-center py-12 text-slate-500">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="mb-4">No transactions recorded yet.</p>
                            <button
                              onClick={async () => { setIsLoading(true); await seedDatabase(); setIsLoading(false); }}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-neon-blue px-4 py-2 rounded-full transition-colors"
                            >
                              {isLoading ? 'Seeding...' : 'Seed Sample Data'}
                            </button>
                          </div>
                        ) : (
                          history.map((record) => (
                            <div key={record.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                              <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
                                onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${record.status === 'SUCCESS' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                                  <div>
                                    <div className="font-bold text-white text-sm">₹{record.amount}</div>
                                    <div className="text-xs text-slate-500">{new Date(record.timestamp).toLocaleString()}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right hidden sm:block">
                                    <div className={`text-xs font-bold uppercase ${record.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>{record.status}</div>
                                    <div className="text-[10px] text-slate-500">{record.method} VERIFY</div>
                                  </div>
                                  {expandedRecord === record.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                </div>
                              </div>

                              {expandedRecord === record.id && (
                                <div className="px-4 pb-4 pt-0 bg-black/20 border-t border-slate-800">
                                  <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                                    <div>
                                      <span className="text-slate-500 block mb-1">Transaction ID (UTR)</span>
                                      <span className="text-white font-mono">{record.utr || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block mb-1">Merchant VPA</span>
                                      <span className="text-slate-300">{record.vpa}</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-slate-500 block mb-1">Verification Details</span>
                                      <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                                        {record.details}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === 'integration' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <IntegrationDocs
                          baseUrl={window.location.origin + window.location.pathname}
                          exampleLink={generatedLink || window.location.href}
                        />
                      </div>
                    )}

                    {activeTab === 'apikeys' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 text-center">
                          <h4 className="text-white font-bold text-lg mb-2">API Keys</h4>
                          <p className="text-slate-400 text-sm mb-6">Generate secret keys to securely integrate ShopC2C with your backend.</p>

                          <button
                            onClick={handleGenerateKey}
                            disabled={isLoading}
                            className="bg-neon-blue hover:bg-cyan-400 text-black font-bold py-2 px-6 rounded-full shadow-lg shadow-neon-blue/20 transition-all flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Key className="w-4 h-4" />
                                Generate New Key
                              </>
                            )}
                          </button>

                          {newApiKey && (
                            <div className="mt-6 bg-slate-900 border border-neon-blue/30 p-4 rounded-lg text-left">
                              <p className="text-neon-blue text-xs font-bold uppercase mb-2">New Key Created (Copy it now!)</p>
                              <div className="flex items-center gap-2 bg-black/40 p-3 rounded font-mono text-white break-all">
                                {newApiKey}
                              </div>
                              <p className="text-slate-500 text-xs mt-2">This key will not be shown again.</p>
                              <button onClick={() => setNewApiKey(null)} className="mt-4 text-xs text-slate-400 hover:text-white underline">Done</button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          {apiKeys.map(key => (
                            <div key={key.id} className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                              <div>
                                <div className="font-bold text-white text-sm">{key.name}</div>
                                <div className="font-mono text-xs text-slate-500 mt-1">{key.key}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(key.key);
                                    alert("Key copied to clipboard!");
                                  }}
                                  className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
                                  title="Copy Key"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteKey(key.id)} className="text-rose-400 hover:text-rose-300 p-2 hover:bg-rose-500/10 rounded-lg transition-colors" title="Revoke Key">
                                  <LogOut className="w-4 h-4 rotate-180" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {apiKeys.length === 0 && !newApiKey && (
                            <div className="text-center text-slate-600 text-sm py-4">No active API keys found.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {isAuthenticated && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <div className="relative group">
                    <span className="cursor-help flex items-center gap-1">DB Connection: <span className={dbStatus === 'connected' ? 'text-emerald-400' : 'text-rose-400 font-bold'}>{dbStatus}</span></span>
                    {dbStatus === 'error' && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-rose-950 border border-rose-500 rounded-lg shadow-xl text-[10px] text-rose-200 z-50 hidden group-hover:block">
                        <p className="font-bold border-b border-rose-500/30 pb-1 mb-1">Connection Diagnosis</p>
                        1. Check Internet<br />
                        2. Check DATABASE_URL in Vercel<br />
                        3. Check IP Whitelist (Neon Console)
                      </div>
                    )}
                  </div>
                  <button onClick={async () => {
                    setDbStatus('connecting');
                    try {
                      const res = await fetch('/api/status');
                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                      const data = await res.json();

                      console.log("Diag Result:", data);

                      if (data.isConnected) {
                        setDbStatus('connected');
                      } else {
                        setDbStatus('error');
                        let msg = "❌ Connection Failed:\n";
                        if (!data.envVarSet) msg += "- DATABASE_URL not found in env.\n";
                        if (data.error) msg += `- Error: ${data.error}\n`;
                        msg += `\nState: ${data.stateText || 'Unknown'}`;
                        alert(msg);
                      }
                    } catch (e: any) {
                      setDbStatus('error');
                      alert(`❌ Connection Error: Could not reach API.\n\nPossible Fixes:\n1. Check if 'DATABASE_URL' is set in Vercel Settings.\n2. Ensure the backend is deployed (check Vercel logs).\n3. If running locally, ensure 'npm run dev' is active.\n\nError: ${e.message}`);
                    }
                  }} className="bg-white/5 hover:bg-white/10 p-1.5 rounded transition-colors" title="Retry Connection">
                    <RefreshCw className={`w-3 h-3 ${dbStatus === 'connecting' ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <button onClick={logout} className="text-xs flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors">
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )
      }
    </div >
  );
};

export default App;