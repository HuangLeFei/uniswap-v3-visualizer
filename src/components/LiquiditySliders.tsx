import React from 'react';
import type { LiquidityBin } from '../logic/uniswap-math';
import './LiquiditySliders.css';

interface SlidersProps {
  bins: LiquidityBin[];
  onBinChange: (id: string, newK: number) => void;
}

export const LiquiditySliders = ({ bins, onBinChange }: SlidersProps) => {
  // Split into two columns for the 2x3 grid
  const half = Math.ceil(bins.length / 2);
  const col1 = bins.slice(0, half);
  const col2 = bins.slice(half);

  const renderSlider = (bin: LiquidityBin) => (
    <div key={bin.id} className="slider-row">
      <span className="slider-label">k{bin.id}:</span>
      <input
        type="range"
        min="0"
        max="30"
        step="1"
        value={bin.k}
        onChange={(e) => onBinChange(bin.id, Number(e.target.value))}
        className="slider-input"
        style={{ '--thumb-color': '#0d6efd' } as React.CSSProperties}
      />
      <span className="slider-value">{bin.k}</span>
      <div className="slider-color-box" style={{ backgroundColor: bin.color }}></div>
    </div>
  );

  return (
    <div className="sliders-container">
      <div className="sliders-column">
        {col1.map(bin => renderSlider(bin))}
      </div>
      <div className="sliders-column">
        {col2.map(bin => renderSlider(bin))}
      </div>
    </div>
  );
};
