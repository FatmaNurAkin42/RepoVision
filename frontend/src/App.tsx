import { useState } from 'react';
import { Eye, Scan, Key } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import './index.css';

// Analiz sonucu tipi
export type AnalysisResult = {
  project_name: string;
  project_intro?: string;
  summary: {
    total_files: number;
    total_lines: number;
    total_size: number;
    total_languages: number;
    total_dependencies: number;
  };
  file_tree: FileNode[];
  languages: LanguageStat[];
  tech_stack: TechStack;
  dependencies: Dependencies;
  quality: QualityResult;
  security?: SecurityResult;
};

export type SecurityResult = {
  score: number;
  grade: string;
  findings: SecurityFinding[];
  summary: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
};

export type SecurityFinding = {
  file: string;
  line: number;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  name: string;
  description: string;
  snippet: string;
};

export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  language?: string | null;
  extension?: string;
  children?: FileNode[];
  content?: string;
  summary?: string;
};

export type LanguageStat = {
  language: string;
  files: number;
  lines: number;
  code_lines: number;
  blank_lines: number;
  comment_lines: number;
  bytes: number;
  color: string;
  percentage: number;
};

export type TechStack = {
  frontend: TechItem[];
  backend: TechItem[];
  database: TechItem[];
  devops: TechItem[];
  testing: TechItem[];
  other: TechItem[];
};

export type TechItem = {
  name: string;
  category: string;
};

export type Dependencies = {
  production: DepItem[];
  development: DepItem[];
  python: DepItem[];
  php?: DepItem[];
  dart?: DepItem[];
  total_count: number;
};

export type DepItem = {
  name: string;
  version: string;
};

export type QualityResult = {
  score: number;
  max_score: number;
  grade: string;
  criteria: QualityCriterion[];
};

export type QualityCriterion = {
  name: string;
  passed: boolean;
  points: number;
};

type AppState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

function App() {
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [provider, setProvider] = useState(() => localStorage.getItem('repovision_ai_provider') || 'gemini');
  const [apiKey, setApiKey] = useState(() => {
    const p = localStorage.getItem('repovision_ai_provider') || 'gemini';
    return localStorage.getItem(`repovision_${p}_api_key`) || '';
  });

  const handleProviderChange = (newProvider: string) => {
    localStorage.setItem('repovision_ai_provider', newProvider);
    setProvider(newProvider);
    setApiKey(localStorage.getItem(`repovision_${newProvider}_api_key`) || '');
  };

  const handleSaveApiKey = (val: string) => {
    localStorage.setItem(`repovision_${provider}_api_key`, val);
    setApiKey(val);
  };

  const handleUpload = async (file: File) => {
    setState('uploading');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setState('analyzing');

      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Analiz başarısız oldu');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setState('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
      setError(message);
      setState('error');
    }
  };

  const handleUrlAnalyze = async (url: string) => {
    setState('analyzing');
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'GitHub repo analizi başarısız oldu');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setState('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
      setError(message);
      setState('error');
    }
  };


  const handleReset = () => {
    setState('idle');
    setResult(null);
    setError('');
  };

  return (
    <div className="app-container">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-logo">
          <Scan size={28} strokeWidth={2.5} />
          <h1>RepoVision</h1>
        </div>

        <div className="top-bar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="api-key-config" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setShowApiSettings(!showApiSettings)}
              title="Gemini API Anahtarı Ayarları"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid var(--border-default)',
                background: showApiSettings ? 'var(--accent-cyan-dim)' : 'transparent',
                color: apiKey ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
              }}
            >
              <Key size={18} />
            </button>
            
            {showApiSettings && (
              <div 
                className="glass-card" 
                style={{
                  position: 'absolute',
                  top: '130%',
                  right: 0,
                  width: '320px',
                  zIndex: 100,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Key size={16} className="text-cyan" /> Yapay Zeka Ayarları
                  </h4>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Ajanların çalışabilmesi için model sağlayıcısını seçin ve API anahtarınızı girin. Anahtarlarınız tarayıcınızda yerel olarak saklanır.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Model Sağlayıcı</label>
                  <select
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="gemini">Gemini (Google)</option>
                    <option value="openai">OpenAI (ChatGPT)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>API Anahtarı</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => handleSaveApiKey(e.target.value)}
                    placeholder={`${provider.toUpperCase()} API Key`}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                {apiKey ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>✓ Anahtar kaydedildi</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-orange)' }}>⚠ Anahtar girilmedi</span>
                )}
              </div>
            )}
          </div>

          {state === 'done' && (
            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all var(--transition-normal)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                e.currentTarget.style.color = 'var(--accent-cyan)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Eye size={16} /> Yeni Analiz
            </button>
          )}

          {state !== 'done' && (
            <div className="top-bar-badge">
              <span className="dot" />
              Hazır
            </div>
          )}
        </div>
      </header>

      {(state === 'idle' || state === 'error') && (
        <FileUpload onUpload={handleUpload} onUrlAnalyze={handleUrlAnalyze} error={error} />
      )}

      {(state === 'uploading' || state === 'analyzing') && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p className="loading-text">
            {state === 'uploading' ? 'Dosya yükleniyor...' : 'Repo analiz ediliyor...'}
          </p>
        </div>
      )}

      {state === 'done' && result && (
        <Dashboard data={result} />
      )}
    </div>
  );
}

export default App;
