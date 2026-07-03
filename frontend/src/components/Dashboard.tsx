import { useState } from 'react';
import type { AnalysisResult } from '../App';
import { BookOpen, Download, FileText, ChevronDown } from 'lucide-react';
import StatCards from './StatCards';
import LanguageChart from './LanguageChart';
import TechStack from './TechStack';
import FileTree from './FileTree';
import DependencyList from './DependencyList';
import QualityScore from './QualityScore';
import SecurityScan from './SecurityScan';
import CodeTreemap from './CodeTreemap';
import './Dashboard.css';

type Props = {
  data: AnalysisResult;
};

const Dashboard = ({ data }: Props) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const handleExportMarkdown = () => {
    const s = data.summary;
    const q = data.quality;
    const sec = data.security;
    
    let md = `# 📊 RepoVision Analiz Raporu - ${data.project_name}\n\n`;
    md += `*Analiz Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}*\n\n`;
    
    md += `## 📈 Proje Özeti\n`;
    md += `* **Toplam Dosya:** ${s.total_files}\n`;
    md += `* **Toplam Satır Sayısı:** ${s.total_lines}\n`;
    md += `* **Toplam Dosya Boyutu:** ${(s.total_size / 1024).toFixed(1)} KB\n`;
    md += `* **Kullanılan Farklı Diller:** ${s.total_languages}\n`;
    md += `* **Toplam Bağımlılık Sayısı:** ${s.total_dependencies}\n\n`;
    
    if (data.project_intro) {
      md += `## 📝 Proje Tanıtımı\n`;
      md += `${data.project_intro}\n\n`;
    }
    
    md += `## 🎯 Kod Kalitesi\n`;
    md += `* **Kalite Skoru:** ${q.score}/100\n`;
    md += `* **Derece:** ${q.grade}\n\n`;
    
    md += `### Kalite Bulguları\n`;
    q.criteria.forEach((f) => {
      md += `* [${f.passed ? '✔' : '✖'}] **${f.name}:** (+${f.points} Puan)\n`;
    });
    md += `\n`;
    
    if (sec) {
      md += `## 🛡️ Güvenlik Durumu (SAST)\n`;
      md += `* **Güvenlik Skoru:** ${sec.score}/100\n`;
      md += `* **Derece:** ${sec.grade}\n`;
      md += `* **Bulgu Dağılımı:** ${sec.summary.high} Yüksek, ${sec.summary.medium} Orta, ${sec.summary.low} Düşük (Toplam ${sec.summary.total})\n\n`;
      
      if (sec.findings.length > 0) {
        md += `### Güvenlik Bulguları Listesi\n`;
        md += `| Seviye | Bulgu Adı | Dosya ve Satır | Açıklama |\n`;
        md += `| --- | --- | --- | --- |\n`;
        sec.findings.forEach(f => {
          md += `| **${f.severity}** | ${f.name} | \`${f.file}:${f.line}\` | ${f.description.replace(/\n/g, ' ')} |\n`;
        });
        md += `\n`;
      } else {
        md += `*Tebrikler! Projede herhangi bir sızdırılmış kimlik bilgisi veya güvenlik zaafiyeti bulunamadı.*\n\n`;
      }
    }
    
    md += `## 📦 Bağımlılıklar (${data.dependencies.total_count})\n`;
    if (data.dependencies.production.length > 0) {
      md += `### Production Bağımlılıkları\n`;
      data.dependencies.production.forEach(d => {
        md += `* \`${d.name}\`: ${d.version}\n`;
      });
      md += `\n`;
    }
    if (data.dependencies.development.length > 0) {
      md += `### Development Bağımlılıkları\n`;
      data.dependencies.development.forEach(d => {
        md += `* \`${d.name}\`: ${d.version}\n`;
      });
      md += `\n`;
    }
    if (data.dependencies.python.length > 0) {
      md += `### Python Bağımlılıkları\n`;
      data.dependencies.python.forEach(d => {
        md += `* \`${d.name}\`: ${d.version}\n`;
      });
      md += `\n`;
    }
    if (data.dependencies.php && data.dependencies.php.length > 0) {
      md += `### PHP (Composer) Bağımlılıkları\n`;
      data.dependencies.php.forEach(d => {
        md += `* \`${d.name}\`: ${d.version}\n`;
      });
      md += `\n`;
    }
    if (data.dependencies.dart && data.dependencies.dart.length > 0) {
      md += `### Flutter/Dart (Pubspec) Bağımlılıkları\n`;
      data.dependencies.dart.forEach(d => {
        md += `* \`${d.name}\`: ${d.version}\n`;
      });
      md += `\n`;
    }
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `repovision_rapor_${data.project_name.toLowerCase().replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `repovision_data_${data.project_name.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard">
      {/* Project Header */}
      <div className="dashboard-header animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 20 }}>
        <div className="dashboard-header-left">
          <h2 className="dashboard-project-name">
            {data.project_name}
            <span className="text-cyan">.</span>
          </h2>
          <p className="dashboard-subtitle text-secondary font-mono">
            Analiz tamamlandı • {data.summary.total_files} dosya tarandı
          </p>
        </div>

        {/* Action Buttons */}
        <div className="dashboard-header-right" style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
          <button 
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="btn-primary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'var(--accent-purple-dim)', 
              color: 'var(--accent-purple)', 
              border: '1px solid rgba(121, 40, 202, 0.3)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <Download size={16} /> Raporu İndir <ChevronDown size={14} />
          </button>
          
          {showExportDropdown && (
            <div style={{ 
              position: 'absolute', 
              top: '120%', 
              right: 0, 
              zIndex: 100, 
              minWidth: '200px',
              padding: '0.5rem 0',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#161622',
              borderRadius: 'var(--radius-md)'
            }}>
              <button 
                onClick={() => {
                  handleExportMarkdown();
                  setShowExportDropdown(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.65rem 1.2rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <FileText size={14} className="text-purple" /> Markdown Raporu (.md)
              </button>
              <button 
                onClick={() => {
                  handleExportJSON();
                  setShowExportDropdown(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.65rem 1.2rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <FileText size={14} className="text-cyan" /> Ham Veri (JSON)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project Introduction */}
      {data.project_intro && (
        <div className="glass-card animate-fade-in-up animate-delay-1" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <div className="section-icon" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}>
              <BookOpen size={20} />
            </div>
            <h3>Proje Tanıtımı</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {data.project_intro}
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <StatCards summary={data.summary} grade={data.quality.grade} />

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Language Chart — Left */}
        <div className="dashboard-col-left animate-fade-in-up animate-delay-3">
          <LanguageChart languages={data.languages} />
        </div>

        {/* Quality Score — Right */}
        <div className="dashboard-col-right animate-fade-in-up animate-delay-4">
          <QualityScore quality={data.quality} />
        </div>
      </div>

      {/* Code Treemap — Full Width */}
      <div className="animate-fade-in-up animate-delay-5">
        <CodeTreemap fileTree={data.file_tree} />
      </div>

      {/* Tech Stack — Full Width */}
      <div className="animate-fade-in-up animate-delay-5">
        <TechStack techStack={data.tech_stack} />
      </div>

      {/* Security Scan — Full Width */}
      <div className="animate-fade-in-up animate-delay-5">
        <SecurityScan security={data.security} />
      </div>

      {/* Bottom Grid */}
      <div className="dashboard-grid">
        {/* File Tree */}
        <div className="dashboard-col-left animate-fade-in-up animate-delay-3">
          <FileTree tree={data.file_tree} />
        </div>

        {/* Dependencies */}
        <div className="dashboard-col-right animate-fade-in-up animate-delay-4">
          <DependencyList dependencies={data.dependencies} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
