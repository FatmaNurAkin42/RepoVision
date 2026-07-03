import { useCallback, useState, useRef } from 'react';
import { Upload, FileArchive, AlertCircle, Sparkles, GitBranch } from 'lucide-react';
import './FileUpload.css';

type Props = {
  onUpload: (file: File) => void;
  onUrlAnalyze: (url: string) => void;
  error?: string;
};

const FileUpload = ({ onUpload, onUrlAnalyze, error }: Props) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.zip')) {
      setSelectedFile(files[0]);
      setRepoUrl(''); // Clear URL input when file is chosen
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setRepoUrl(''); // Clear URL input when file is chosen
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleUrlAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim() && !selectedFile) {
      onUrlAnalyze(repoUrl.trim());
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="upload-page">
      {/* Hero Section */}
      <div className="upload-hero">
        <div className="upload-hero-glow" />
        <div className="upload-hero-icon animate-fade-in-up">
          <Sparkles size={40} />
        </div>
        <h2 className="upload-hero-title animate-fade-in-up animate-delay-1">
          Repo'nuzu <span className="gradient-text">Analiz Edin</span>
        </h2>
        <p className="upload-hero-desc animate-fade-in-up animate-delay-2">
          GitHub'dan indirdiğiniz ZIP dosyasını yükleyin veya doğrudan deponun bağlantısını yapıştırın — dil dağılımı, teknoloji yığını, kalite skoru ve detaylı kod metrikleri anında karşınızda.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone animate-fade-in-up animate-delay-3 ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {!selectedFile ? (
          <>
            <div className="drop-zone-icon">
              <Upload size={32} />
            </div>
            <h3 className="drop-zone-title">
              ZIP dosyasını sürükleyip bırakın
            </h3>
            <p className="drop-zone-subtitle">
              veya <span className="drop-zone-browse">dosya seçin</span>
            </p>
            <p className="drop-zone-hint font-mono">
              Maksimum 100MB • Sadece .zip
            </p>
          </>
        ) : (
          <div className="selected-file">
            <div className="selected-file-icon">
              <FileArchive size={28} />
            </div>
            <div className="selected-file-info">
              <h4 className="selected-file-name font-mono">{selectedFile.name}</h4>
              <p className="selected-file-size">{formatSize(selectedFile.size)}</p>
            </div>
            <button
              className="selected-file-remove"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* OR Divider — Only show if no file is selected */}
      {!selectedFile && (
        <div className="upload-divider animate-fade-in-up animate-delay-3">
          <span className="divider-line" />
          <span className="divider-text font-mono">VEYA</span>
          <span className="divider-line" />
        </div>
      )}

      {/* GitHub URL Section — Only show if no file is selected */}
      {!selectedFile && (
        <form 
          className="github-url-section glass-card animate-fade-in-up animate-delay-3"
          onSubmit={handleUrlAnalyzeSubmit}
        >
          <div className="github-url-header">
            <GitBranch size={20} className="text-cyan" />
            <h3>GitHub Repo Linki ile Analiz</h3>
          </div>
          
          <div className="github-url-input-wrapper">
            <input
              type="url"
              placeholder="Örn: https://github.com/kullanici/proje"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="github-url-input font-mono"
            />
            <button 
              type="submit" 
              className="github-url-btn" 
              disabled={!repoUrl.trim()}
            >
              <Sparkles size={16} />
              Analiz Et
            </button>
          </div>
          <p className="github-url-hint">
            Şu an sadece <strong>public (açık)</strong> GitHub depoları desteklenmektedir.
          </p>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="upload-error animate-fade-in-up">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Analyze Button (for ZIP upload) */}
      {selectedFile && (
        <button
          className="analyze-btn animate-fade-in-up"
          onClick={handleAnalyze}
        >
          <Sparkles size={20} />
          Analiz Et
        </button>
      )}

      {/* Features */}
      <div className="upload-features animate-fade-in-up animate-delay-4">
        {[
          { emoji: '📊', title: 'Dil Analizi', desc: 'LOC, yorum oranı, dosya dağılımı' },
          { emoji: '🔧', title: 'Tech Stack', desc: 'Framework ve araç tespiti' },
          { emoji: '📁', title: 'Dosya Yapısı', desc: 'İnteraktif ağaç görünümü' },
          { emoji: '⭐', title: 'Kalite Skoru', desc: '9 kriter bazlı puanlama' },
        ].map((f, i) => (
          <div key={i} className="feature-card glass-card">
            <span className="feature-emoji">{f.emoji}</span>
            <h4>{f.title}</h4>
            <p className="text-secondary">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUpload;
