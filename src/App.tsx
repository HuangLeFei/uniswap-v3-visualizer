import { useState, useMemo, useRef, useEffect } from 'react';
import { LiquiditySliders } from './components/LiquiditySliders';
import { ConsolidatedViz } from './components/ConsolidatedViz';
import { generateDisjointCurves } from './logic/uniswap-math';
import type { LiquidityBin } from './logic/uniswap-math';
import './App.css';

const INITIAL_BINS: LiquidityBin[] = [
  { id: '1', minPrice: 0.125, maxPrice: 0.25, color: '#3ba0ff', k: 10 },
  { id: '2', minPrice: 0.25, maxPrice: 0.5, color: '#ff6b9e', k: 10 },
  { id: '3', minPrice: 0.5, maxPrice: 1, color: '#40c4aa', k: 14 },
  { id: '4', minPrice: 1, maxPrice: 2, color: '#ffcc4d', k: 12 },
  { id: '5', minPrice: 2, maxPrice: 4, color: '#ab72ff', k: 13 },
  { id: '6', minPrice: 4, maxPrice: 8, color: '#ff994d', k: 11 },
];

function App() {
  const [bins, setBins] = useState<LiquidityBin[]>(INITIAL_BINS);
  const [isV2Mode, setIsV2Mode] = useState(false);
  const [savedV3Bins, setSavedV3Bins] = useState<LiquidityBin[] | null>(null);
  const [sweepProgress, setSweepProgress] = useState<number | null>(null);
  const animationRef = useRef<number>(0);

  const curves = useMemo(() => generateDisjointCurves(bins, 30), [bins]);

  const sweepPrice = useMemo(() => {
    if (sweepProgress === null) return null;
    const minLog = Math.log2(INITIAL_BINS[0].minPrice);
    const maxLog = Math.log2(INITIAL_BINS[INITIAL_BINS.length - 1].maxPrice);
    const currentLog = minLog + (maxLog - minLog) * sweepProgress;
    return Math.pow(2, currentLog);
  }, [sweepProgress]);

  const handleBinChange = (id: string, newK: number) => {
    if (isV2Mode) setIsV2Mode(false); // Entering custom mode breaks V2
    setBins(prev => prev.map(b => b.id === id ? { ...b, k: newK } : b));
  };

  const handleSweepPrice = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    const duration = 5000;
    const startTime = performance.now();

    const animate = (time: number) => {
      let progress = (time - startTime) / duration;
      if (progress > 1) progress = 1;
      
      setSweepProgress(progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => setSweepProgress(null), 1500);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const toggleV2V3Mode = () => {
    if (isV2Mode) {
      // Restore V3
      setIsV2Mode(false);
      if (savedV3Bins) {
        setBins(savedV3Bins);
      }
    } else {
      // Save current V3 state and Switch to V2
      setSavedV3Bins(bins);
      setIsV2Mode(true);
      setBins(prev => prev.map(b => ({ ...b, k: 15 })));
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Uniswap V3 集中流动性 (Concentrated Liquidity) 可视化</h1>
        <p className="app-description">
          Uniswap V3 允许流动性提供者 (LP) 将资金集中在特定的价格区间内（即“虚拟流动性”）。<br />
          在这个演示中，你可以通过滑动 <strong>k1 到 k6</strong> 的滑块，来调整不同价格区间内的资金深度。
        </p>
      </header>

      <main className="app-main">
        <div className="sliders-section">
          <div className="sliders-header">
            <div>
              <h3>调整各区间流动性深度 (k = L²)</h3>
              <p className="section-desc">滑块代表在特定价格区间内注入的资金量。数值越大，说明该区间的流动性越充足，价格曲线越平缓（即滑点越低）。</p>
            </div>
            <button 
              className={`v2-sim-btn ${isV2Mode ? 'v2-active' : ''}`} 
              onClick={toggleV2V3Mode}
            >
              {isV2Mode ? '恢复 V3 集中流动性' : '模拟 V2 连续流动性'}
            </button>
          </div>
          <LiquiditySliders bins={bins} onBinChange={handleBinChange} />
        </div>
        
        <div className="viz-section">
          <div className="viz-header">
            <div className="viz-title-col">
              <h3>资产储备曲线 (代币 Y vs 代币 X)</h3>
              <p className="section-desc">展示 <code>x * y = k</code> 在不同区间内的实际生效片段。断开的曲线段完美展示了 V3 中“分段虚拟储备”的特性。红色射线代表当前价格点。</p>
            </div>
            <div className="viz-title-col">
              <h3>流动性深度分布 (柱状图)</h3>
              <p className="section-desc">横轴为价格，纵轴为流动性深度。这直观地展示了资金是如何“集中”在特定区间的。底部的红点追踪当前的市场价格。</p>
            </div>
          </div>
          <ConsolidatedViz bins={bins} curves={curves} sweepPrice={sweepPrice} sweepProgress={sweepProgress} />
        </div>
        
        <div className="action-area">
          <button className="sweep-btn" onClick={handleSweepPrice}>
            ▶ 模拟价格波动 (Sweep Price)
          </button>
          <p className="btn-desc">点击此按钮，观看市场价格扫过这些流动性区间时，资产储备是如何被消耗的。</p>
        </div>

        {/* --- FAQ / Detailed Explanation Section at the bottom --- */}
        <div className="explanation-section">
          <h2>如何理解这里的 K1 - K6 以及数值变化？</h2>
          <div className="explanation-grid">
            <div className="explanation-card">
              <h4>k1 - k6 分别代表什么？</h4>
              <p>在 Uniswap V3 的流动性模型中，整个价格范围从 0 到无穷大被切分成了无数细小的“格子（Ticks）”。这里的 <code>k1</code> 到 <code>k6</code> 代表了我们在这个模型中截取的 6 个连续但独立的<strong>价格区间</strong>（价格范围从低到高排列）。</p>
            </div>
            <div className="explanation-card">
              <h4>滑块的值代表什么？</h4>
              <p>在数学模型中，滑块的值就是公式中的 k 值（在 V3 白皮书中更常表示为流动性深度 L<sup>2</sup>）。它代表了 LP（流动性提供者）真金白银注入到这个特定价格格子里的<strong>真实资金总量（即流动性深度）</strong>。</p>
            </div>
            <div className="explanation-card">
              <h4>为什么调整滑块后，曲线形状和柱子会变化？</h4>
              <p>资金量 <code>k</code> 越大，代表该区间资金池的“水”越深（右侧柱状图变高）。当市场价格处于这个资金充足的区间时，即使有大额交易，价格也极难被撼动。反映在左侧代币储备图表上，该区间对应的双曲线段就会变得非常<strong>平缓且延展更长</strong>，这意味着在此路段交易的<strong>滑点极低</strong>。</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
