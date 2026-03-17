import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Scatter, Bar } from 'react-chartjs-2';
import { getPointAtPrice } from '../logic/uniswap-math';
import type { LiquidityBin, BinCurve } from '../logic/uniswap-math';
import './ConsolidatedViz.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VizProps {
  bins: LiquidityBin[];
  curves: BinCurve[];
  sweepPrice: number | null;
  sweepProgress: number | null;
}

export const ConsolidatedViz = ({ bins, curves, sweepPrice, sweepProgress }: VizProps) => {
  // --- Left Chart: Curve ---
  const scatterData = useMemo(() => {
    const datasets = curves.map(curve => ({
      label: `k${curve.binId}`,
      data: curve.points.map(p => ({ x: p.x, y: p.y })),
      borderColor: curve.color,
      backgroundColor: curve.color,
      showLine: true,
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0,
    }));

    if (sweepPrice !== null) {
      const match = getPointAtPrice(bins, sweepPrice);
      if (match && match.x <= 10 && match.y <= 10) {
        // Red tracking line from origin
        datasets.push({
          label: 'Tracking Line',
          data: [{ x: 0, y: 0 }, { x: match.x, y: match.y }],
          borderColor: '#ff0000',
          backgroundColor: 'transparent',
          showLine: true,
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
        });

        // Red point
        datasets.push({
          label: 'Current Point',
          data: [{ x: match.x, y: match.y }],
          borderColor: '#ff0000',
          backgroundColor: '#ff0000',
          showLine: false,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 4,
          tension: 0,
        });
      }
    }

    return { datasets };
  }, [curves, bins, sweepPrice]);

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: {
        type: 'linear' as const,
        min: 0,
        max: 10,
        grid: { color: '#f3f4f6' },
        ticks: { stepSize: 1, color: '#9ca3af' }
      },
      y: {
        type: 'linear' as const,
        min: 0,
        max: 10,
        grid: { color: '#f3f4f6' },
        ticks: { stepSize: 1, color: '#9ca3af' }
      }
    },
    animation: {
      duration: 0 
    }
  };

  // --- Right Chart: Bar ---
  const barData = useMemo(() => {
    return {
      labels: bins.map(() => ''), // empty labels on x-axis
      datasets: [
        {
          label: 'Liquidity',
          data: bins.map(b => b.k),
          backgroundColor: bins.map(b => b.color),
          borderRadius: 0, 
          barPercentage: 1.0,
          categoryPercentage: 1.0, 
        }
      ]
    };
  }, [bins]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 20,
        bottom: 20
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: true, borderColor: '#000' },
        ticks: { display: false },
        border: { display: true, color: '#000' }
      },
      y: {
        beginAtZero: true,
        max: 30,
        grid: { display: false, drawBorder: true, borderColor: '#000' },
        ticks: { display: false },
        border: { display: true, color: '#000' }
      }
    },
    animation: {
      duration: 0
    }
  };

  return (
    <div className="viz-container">
      <div className="chart-wrapper">
        <div className="canvas-container">
          <Scatter data={scatterData} options={scatterOptions as any} />
          {/* Simple custom tooltip for the sweeping point */}
          {sweepPrice !== null && (() => {
             const match = getPointAtPrice(bins, sweepPrice);
             if (!match || match.x > 10 || match.y > 10) return null;
             // Approximate mapping for pure CSS tooltip over the scatter. 
             // Canvas uses internal padding, so we just stick with the dot.
             return null;
          })()}
        </div>
      </div>
      
      <div className="chart-wrapper right-chart">
        <div className="y-axis-label">↑ 流动性深度 (Liquidity)</div>
        <div className="canvas-container relative">
          <Bar data={barData} options={barOptions as any} />
          
          <div className="x-axis-label">→ 价格 (Price)</div>

          {sweepProgress !== null && (
             <div 
               className="sweep-point"
               style={{ 
                  left: `calc(20px + ${sweepProgress} * (100% - 20px))` 
               }} 
             >
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
