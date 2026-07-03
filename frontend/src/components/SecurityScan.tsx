import { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { SecurityResult } from '../App';
import './SecurityScan.css';

type Props = {
  security?: SecurityResult;
};

const SecurityScan = ({ security }: Props) => {
  if (!security) return null;

  const { score, grade, findings, summary } = security;
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});
  const [showFindings, setShowFindings] = useState(false);

  const toggleExpand = (index: number) => {
    setExpandedIndices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Get Risk level properties
  const getRiskDetails = (s: number) => {
    if (s >= 90) return { label: 'DÜŞÜK RİSK / GÜVENLİ', class: 'risk-low', icon: <ShieldCheck size={20} /> };
    if (s >= 75) return { label: 'DÜŞÜK RİSK', class: 'risk-low-medium', icon: <ShieldCheck size={20} /> };
    if (s >= 60) return { label: 'ORTA RİSK', class: 'risk-medium', icon: <Shield size={20} /> };
    return { label: 'YÜKSEK RİSK', class: 'risk-high', icon: <ShieldAlert size={20} /> };
  };

  const risk = getRiskDetails(score);

  return (
    <div className="glass-card security-card">
      {/* Header */}
      <div className="section-header">
        <div className={`section-icon ${risk.class}-bg`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {score === 100 ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
        </div>
        <h3>Güvenlik Taraması (SAST)</h3>
      </div>

      {/* Main Score Board */}
      <div className="security-dashboard">
        <div className="security-score-circle">
          <div className={`score-radial-progress ${risk.class}-border`}>
            <div className="score-inner">
              <span className="score-num font-mono">{score}</span>
              <span className="score-label">SKOR</span>
            </div>
          </div>
        </div>

        <div className="security-summary-info">
          <div className="security-status-header">
            <h4>Güvenlik Derecesi: <span className={`grade-badge ${risk.class}-bg`}>{grade}</span></h4>
            <span className={`risk-badge ${risk.class}-text`}>{risk.label}</span>
          </div>

          <p className="security-desc text-secondary">
            Proje kaynak kodları sızdırılmış kimlik bilgileri (API Key, şifre, token vb.) ve yaygın güvenlik açıkları (SQL Injection, RCE vb.) açısından taranmıştır.
          </p>

          {/* Counts */}
          <div className="security-stats-grid">
            <div className="stat-pill border-red">
              <span className="pill-count text-red font-mono">{summary.high}</span>
              <span className="pill-label">Yüksek</span>
            </div>
            <div className="stat-pill border-orange">
              <span className="pill-count text-orange font-mono">{summary.medium}</span>
              <span className="pill-label">Orta</span>
            </div>
            <div className="stat-pill border-yellow">
              <span className="pill-count text-yellow font-mono">{summary.low}</span>
              <span className="pill-label">Düşük</span>
            </div>
            <div className="stat-pill border-muted">
              <span className="pill-count text-secondary font-mono">{summary.total}</span>
              <span className="pill-label">Toplam Bulgular</span>
            </div>
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="findings-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFindings ? '1rem' : '0' }}>
          <h4 className="findings-title" style={{ margin: 0 }}>Bulgu Detayları ({findings.length})</h4>
          <button 
            onClick={() => setShowFindings(!showFindings)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
          >
            {showFindings ? (
              <>Ayrıntıları Gizle <ChevronUp size={15} /></>
            ) : (
              <>Ayrıntıları Göster <ChevronDown size={15} /></>
            )}
          </button>
        </div>

        {showFindings && (
          findings.length === 0 ? (
            <div className="no-findings-card animate-fade-in">
              <ShieldCheck className="text-green icon-large animate-float" size={40} />
              <h5>Temiz Proje!</h5>
              <p className="text-muted">
                Tebrikler, bu projede herhangi bir sızdırılmış kimlik bilgisi (API anahtarı, şifre vb.) veya kritik kod güvenliği zaafiyeti tespit edilmedi.
              </p>
            </div>
          ) : (
            <div className="findings-list animate-fade-in">
              {findings.map((finding, idx) => {
                const isExpanded = !!expandedIndices[idx];
                const sevClass = finding.severity.toLowerCase();

                return (
                  <div key={idx} className={`finding-item border-${sevClass}`}>
                    {/* Summary Bar */}
                    <div className="finding-header" onClick={() => toggleExpand(idx)}>
                      <div className="finding-header-left">
                        <span className={`severity-tag bg-${sevClass}`}>{finding.severity}</span>
                        <div className="finding-title-group">
                          <span className="finding-name">{finding.name}</span>
                          <span className="finding-location font-mono text-muted">
                            {finding.file}:{finding.line}
                          </span>
                        </div>
                      </div>
                      <button className="finding-toggle-btn">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                    {/* Expanded Body */}
                    {isExpanded && (
                      <div className="finding-body animate-fade-in">
                        <div className="finding-meta">
                          <strong>Tür:</strong> <span className="text-primary">{finding.type}</span>
                        </div>
                        
                        <div className="finding-description">
                          <AlertTriangle size={14} className="text-orange" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <p>{finding.description}</p>
                        </div>

                        {/* Code Snippet Box */}
                        {finding.snippet && (
                          <div className="finding-snippet-box">
                            <span className="snippet-title font-mono">{finding.file} - Satır {finding.line}</span>
                            <pre className="code-snippet font-mono">
                              <code>{finding.snippet}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SecurityScan;
