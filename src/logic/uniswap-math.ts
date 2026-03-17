export interface LiquidityBin {
  id: string;
  minPrice: number;
  maxPrice: number;
  color: string;
  k: number; // L^2 value
}

export interface CurvePoint {
  price: number;
  x: number;
  y: number;
}

export interface BinCurve {
  binId: string;
  color: string;
  points: CurvePoint[];
}

/**
 * Generate discrete points for the x*y = k segments
 * representing the AMM virtual reserves curve for Concentrated Liquidity.
 */
export function generateDisjointCurves(bins: LiquidityBin[], numPointsPerBin: number = 30): BinCurve[] {
  const result: BinCurve[] = [];
  
  for (const bin of bins) {
    const k = Math.max(0.001, bin.k);
    const minP = bin.minPrice;
    const maxP = bin.maxPrice;
    
    // P = y/x and xy = k => y = k/x => P = k/x^2 => x = sqrt(k/P)
    // As P increases from minP to maxP, x decreases from maxX to minX.
    const maxX = Math.sqrt(k / minP);
    const minX = Math.sqrt(k / maxP);
    
    const points: CurvePoint[] = [];
    const step = (maxX - minX) / numPointsPerBin;

    for (let i = 0; i <= numPointsPerBin; i++) {
       const x = minX + i * step;
       const y = k / x;
       const p = y / x; // which is k / x^2
       
       points.push({
         price: p,
         x,
         y,
       });
    }

    result.push({
      binId: bin.id,
      color: bin.color,
      points
    });
  }
  
  return result;
}

/**
 * Given a target price, find the exact (X, Y) coordinate corresponding to 
 * the virtual curve active in that price's bin.
 */
export function getPointAtPrice(bins: LiquidityBin[], targetPrice: number): { x: number, y: number } | null {
  for (const bin of bins) {
    if (targetPrice >= bin.minPrice && targetPrice <= bin.maxPrice) {
      if (bin.k === 0) return null;
      return {
        x: Math.sqrt(bin.k / targetPrice),
        y: Math.sqrt(bin.k * targetPrice)
      };
    }
  }
  return null;
}
