import { useState } from 'react';
import { FolderOpen, FolderClosed, FileCode, ChevronRight, ChevronDown, ChevronUp, X, Code2, Sparkles, Send, Key } from 'lucide-react';
import type { FileNode } from '../App';
import './FileTree.css';

type Props = {
  tree: FileNode[];
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const LANG_COLORS: Record<string, string> = {
  'TypeScript': '#3178c6',
  'TypeScript (TSX)': '#3178c6',
  'JavaScript': '#f1e05a',
  'JavaScript (JSX)': '#f1e05a',
  'Python': '#3572A5',
  'CSS': '#563d7c',
  'HTML': '#e34c26',
  'JSON': '#5d5d5d',
  'Markdown': '#083fa1',
  'YAML': '#cb171e',
  'PHP': '#4F5D95',
  'Dart': '#00B4AB',
  'Java': '#b07219',
};

type TreeItemProps = {
  node: FileNode;
  depth?: number;
  onSelectFile: (node: FileNode) => void;
  selectedFilePath?: string;
};

const TreeItem = ({ node, depth = 0, onSelectFile, selectedFilePath }: TreeItemProps) => {
  const [isOpen, setIsOpen] = useState(depth < 1);

  if (node.type === 'directory') {
    return (
      <div className="tree-dir">
        <div
          className="tree-row tree-dir-row"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronRight
            size={14}
            className={`tree-chevron ${isOpen ? 'open' : ''}`}
          />
          {isOpen ? <FolderOpen size={16} className="tree-folder-icon" /> : <FolderClosed size={16} className="tree-folder-icon" />}
          <span className="tree-name">{node.name}</span>
          <span className="tree-size font-mono text-muted">{formatSize(node.size)}</span>
        </div>
        {isOpen && node.children && (
          <div className="tree-children">
            {node.children.map((child, i) => (
              <TreeItem
                key={i}
                node={child}
                depth={depth + 1}
                onSelectFile={onSelectFile}
                selectedFilePath={selectedFilePath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const langColor = node.language ? LANG_COLORS[node.language] || '#858585' : '#555';
  const isSelected = selectedFilePath === node.path;

  return (
    <div
      className={`tree-row tree-file-row ${isSelected ? 'selected' : ''}`}
      style={{ paddingLeft: `${depth * 20 + 28}px` }}
      onClick={() => onSelectFile(node)}
    >
      <FileCode size={14} style={{ color: langColor, flexShrink: 0 }} />
      <span className="tree-name">{node.name}</span>
      {node.language && (
        <span className="tree-lang font-mono" style={{ color: langColor }}>
          {node.language}
        </span>
      )}
      <span className="tree-size font-mono text-muted">{formatSize(node.size)}</span>
    </div>
  );
};

const FilePreviewPane = ({ file, onClose }: { file: FileNode; onClose: () => void }) => {
  const lines = file.content ? file.content.split('\n') : [];
  
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [provider, setProvider] = useState(() => localStorage.getItem('repovision_ai_provider') || 'gemini');
  const [hasKey, setHasKey] = useState(() => {
    const p = localStorage.getItem('repovision_ai_provider') || 'gemini';
    return !!localStorage.getItem(`repovision_${p}_api_key`);
  });
  const [tempKey, setTempKey] = useState('');
  const [isAiCollapsed, setIsAiCollapsed] = useState(false);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !file.content) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputValue('');
    setIsLoading(true);

    const activeProvider = localStorage.getItem('repovision_ai_provider') || 'gemini';
    const localKey = localStorage.getItem(`repovision_${activeProvider}_api_key`) || '';

    try {
      const response = await fetch('http://localhost:8000/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: file.path,
          content: file.content,
          question: userMsg,
          provider: activeProvider,
          api_key: localKey || null
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.answer || "Bir hata oluştu." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "API'ye ulaşılamadı. Lütfen backend'in çalıştığından emin olun." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="file-preview-pane">
      <div className="preview-header">
        <div className="preview-title-info">
          <FileCode size={18} className="preview-file-icon" />
          <div className="preview-meta-details">
            <span className="preview-filename">{file.name}</span>
            <span className="preview-filepath font-mono">{file.path}</span>
          </div>
        </div>
        <div className="preview-header-actions">
          {file.language && (
            <span className="preview-lang-badge font-mono" style={{ color: LANG_COLORS[file.language] || '#aaa', borderColor: LANG_COLORS[file.language] || '#444' }}>
              {file.language}
            </span>
          )}
          <button className="preview-close-btn" onClick={onClose} aria-label="Kapat">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="preview-body">
        {/* Objective Analysis Card */}
        {file.summary && (
          <div className="preview-summary-card">
            <div className="summary-card-header">
              <Code2 size={16} className="summary-icon" />
              <h4>Dosya Yapısı & Analiz</h4>
            </div>
            <p className="summary-text">{file.summary}</p>
          </div>
        )}

        {/* Code Content Container */}
        <div className="preview-code-container" style={{ flex: 1, maxHeight: isAiCollapsed ? '480px' : '280px', overflowY: 'auto', marginBottom: '1rem', transition: 'max-height var(--transition-normal)' }}>
          {file.content !== undefined && file.content !== "" ? (
            <div className="code-editor-mock">
              <div className="line-numbers font-mono">
                {lines.map((_, i) => (
                  <span key={i} className="line-num">{i + 1}</span>
                ))}
              </div>
              <pre className="code-content font-mono">
                <code>
                  {lines.map((line, i) => (
                    <div key={i} className="code-line">{line || '\n'}</div>
                  ))}
                </code>
              </pre>
            </div>
          ) : (
            <div className="preview-no-content font-mono">
              <p className="text-muted">
                {file.summary || "Bu dosyanın önizleme içeriği mevcut değil."}
              </p>
            </div>
          )}
        </div>

        {/* AI Assistant Chat */}
        {file.content && (
          isAiCollapsed ? (
            <div className="ai-chat-container collapsed" onClick={() => setIsAiCollapsed(false)} style={{ cursor: 'pointer', padding: '0.75rem 1rem', background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} className="text-purple" />
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>AI Kod Asistanını Aç</h4>
                </div>
                <ChevronUp size={16} className="text-purple" />
              </div>
            </div>
          ) : (
            <div className="ai-chat-container">
              <div className="ai-chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <Sparkles size={16} className="text-purple" />
                   <h4>AI Kod Asistanı</h4>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   {hasKey && (
                     <button 
                       onClick={() => {
                         localStorage.removeItem(`repovision_${provider}_api_key`);
                         setHasKey(false);
                       }}
                       title="API Anahtarını Temizle"
                       style={{
                         background: 'transparent',
                         border: 'none',
                         color: 'var(--text-muted)',
                         cursor: 'pointer',
                         fontSize: '0.75rem',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '0.25rem'
                       }}
                     >
                       <Key size={12} /> Temizle
                     </button>
                   )}
                   <button 
                     onClick={() => setIsAiCollapsed(true)}
                     title="Asistanı Gizle"
                     style={{
                       background: 'transparent',
                       border: 'none',
                       color: 'var(--text-muted)',
                       cursor: 'pointer',
                       fontSize: '0.75rem',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '0.25rem'
                     }}
                   >
                     <ChevronDown size={14} /> Gizle
                   </button>
                 </div>
              </div>

              {!hasKey ? (
                <div className="ai-chat-messages" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                   <Key size={28} className="text-cyan" />
                   <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                     Yapay zeka asistanını kullanabilmek için bir API Anahtarı girmeniz gerekmektedir.
                   </p>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '280px', textAlign: 'left' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                       <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Model Sağlayıcı</label>
                       <select
                         value={provider}
                         onChange={e => {
                           const newP = e.target.value;
                           setProvider(newP);
                           setHasKey(!!localStorage.getItem(`repovision_${newP}_api_key`));
                         }}
                         style={{
                           width: '100%',
                           padding: '0.35rem 0.5rem',
                           borderRadius: 'var(--radius-sm)',
                           border: '1px solid var(--border-default)',
                           background: 'var(--bg-secondary)',
                           color: 'var(--text-primary)',
                           fontSize: '0.8rem',
                         }}
                       >
                         <option value="gemini">Gemini (Google)</option>
                         <option value="openai">OpenAI (ChatGPT)</option>
                         <option value="anthropic">Anthropic (Claude)</option>
                       </select>
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                       <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>API Anahtarı</label>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                         <input
                           type="password"
                           placeholder={`${provider.toUpperCase()} API Key`}
                           value={tempKey}
                           onChange={e => setTempKey(e.target.value)}
                           style={{
                             flex: 1,
                             padding: '0.4rem 0.6rem',
                             borderRadius: 'var(--radius-sm)',
                             border: '1px solid var(--border-default)',
                             background: 'var(--bg-secondary)',
                             color: 'var(--text-primary)',
                             fontSize: '0.8rem',
                           }}
                         />
                         <button
                           onClick={() => {
                             if (tempKey.trim()) {
                               localStorage.setItem('repovision_ai_provider', provider);
                               localStorage.setItem(`repovision_${provider}_api_key`, tempKey.trim());
                               setHasKey(true);
                               setTempKey('');
                             }
                           }}
                           style={{
                             padding: '0.4rem 0.8rem',
                             borderRadius: 'var(--radius-sm)',
                             border: 'none',
                             background: 'var(--accent-cyan)',
                             color: 'var(--bg-primary)',
                             fontSize: '0.8rem',
                             fontWeight: 'bold',
                             cursor: 'pointer',
                           }}
                         >
                           Kaydet
                         </button>
                       </div>
                     </div>
                   </div>
                </div>
              ) : (
                <>
                  <div className="ai-chat-messages">
                     {messages.length === 0 ? (
                       <p className="ai-chat-empty text-muted">Bu dosya hakkında merak ettiğiniz bir şeyi sorun. (Örn: Bu dosya ne işe yarıyor?)</p>
                     ) : (
                       messages.map((msg, i) => (
                         <div key={i} className={`ai-message ${msg.role}`}>
                           {msg.text}
                         </div>
                       ))
                     )}
                     {isLoading && <div className="ai-message ai loading">Düşünüyor...</div>}
                  </div>
                  <form onSubmit={handleAskAI} className="ai-chat-input-form">
                    <input 
                      type="text" 
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      placeholder="Bu dosya hakkında bir şey sor..."
                      disabled={isLoading}
                      className="ai-chat-input"
                    />
                    <button type="submit" disabled={isLoading || !inputValue.trim()} className="ai-chat-send">
                      <Send size={16} />
                    </button>
                  </form>
                </>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

const FileTree = ({ tree }: Props) => {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  return (
    <div className={`glass-card file-tree-card ${selectedFile ? 'has-preview' : ''}`}>
      <div className="section-header">
        <div className="section-icon" style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)' }}>
          <FolderOpen size={20} />
        </div>
        <h3>Dosya Yapısı</h3>
      </div>

      <div className="file-tree-layout">
        <div className="file-tree-container">
          {tree.map((node, i) => (
            <TreeItem
              key={i}
              node={node}
              depth={0}
              onSelectFile={setSelectedFile}
              selectedFilePath={selectedFile?.path}
            />
          ))}
        </div>

        {selectedFile && (
          <FilePreviewPane
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
          />
        )}
      </div>
    </div>
  );
};

export default FileTree;
