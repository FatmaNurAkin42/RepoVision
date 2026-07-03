import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { LanguageStat } from '../App';
import './LanguageChart.css';

type Props = {
  languages: LanguageStat[];
};

const LanguageChart = ({ languages }: Props) => {
  // İlk 8 dili göster, kalanı "Diğer" olarak topla
  const top = languages.slice(0, 8);
  const rest = languages.slice(8);
  const chartData = [...top];

  if (rest.length > 0) {
    chartData.push({
      language: 'Diğer',
      files: rest.reduce((s, l) => s + l.files, 0),
      lines: rest.reduce((s, l) => s + l.lines, 0),
      code_lines: rest.reduce((s, l) => s + l.code_lines, 0),
      blank_lines: rest.reduce((s, l) => s + l.blank_lines, 0),
      comment_lines: rest.reduce((s, l) => s + l.comment_lines, 0),
      bytes: rest.reduce((s, l) => s + l.bytes, 0),
      color: '#555566',
      percentage: rest.reduce((s, l) => s + l.percentage, 0),
    });
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: LanguageStat }> }) => {
    if (!active || !payload || !payload[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-header">
          <span className="chart-tooltip-dot" style={{ background: data.color }} />
          <strong>{data.language}</strong>
        </div>
        <div className="chart-tooltip-rows">
          <div><span className="text-secondary">Satır:</span> <span className="font-mono">{data.lines.toLocaleString()}</span></div>
          <div><span className="text-secondary">Dosya:</span> <span className="font-mono">{data.files}</span></div>
          <div><span className="text-secondary">Oran:</span> <span className="font-mono">{data.percentage}%</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card language-chart-card">
      <div className="section-header">
        <div className="section-icon" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}>
          <BarChart3 size={20} />
        </div>
        <h3>Dil Dağılımı</h3>
      </div>

      <div className="language-chart-layout">
        {/* Pie Chart */}
        <div className="language-chart-pie">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="lines"
                stroke="none"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="language-legend">
          {chartData.map((lang, i) => (
            <div key={i} className="language-legend-item">
              <div className="language-legend-left">
                <span className="language-legend-dot" style={{ background: lang.color }} />
                <span className="language-legend-name">{lang.language}</span>
              </div>
              <div className="language-legend-right">
                <span className="language-legend-pct font-mono">{lang.percentage}%</span>
                <span className="language-legend-lines font-mono text-secondary">
                  {lang.lines.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Language Bar */}
      <div className="language-bar">
        {chartData.map((lang, i) => (
          <div
            key={i}
            className="language-bar-segment"
            style={{
              width: `${Math.max(lang.percentage, 1)}%`,
              backgroundColor: lang.color,
            }}
            title={`${lang.language}: ${lang.percentage}%`}
          />
        ))}
      </div>
    </div>
  );
};

export default LanguageChart;
