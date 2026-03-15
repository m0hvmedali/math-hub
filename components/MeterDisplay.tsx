import React from 'react';

interface MeterDisplayProps {
  angle: number; // 0 to 180 (0 is left, 90 is center, 180 is right)
  label: string;
  unit: string;
  isZeroCenter?: boolean;
  maxVal: number;
  customScale?: boolean; // If true, rendering might differ slightly (used for Ohmmeter logic visualization)
}

export const MeterDisplay: React.FC<MeterDisplayProps> = ({ angle, label, unit, isZeroCenter = false, maxVal, customScale = false }) => {
  // SVG drawing logic
  // Center of rotation
  const cx = 150;
  const cy = 130;
  const r = 100;

  // Convert angle to radians for needle tip
  const normalizedAngle = Math.min(Math.max(angle, 0), 180) / 180; 
  const visualAngleStart = -60;
  const visualAngleEnd = 60;
  const currentVisualAngle = visualAngleStart + (normalizedAngle * (visualAngleEnd - visualAngleStart));
  
  const angleRad = (currentVisualAngle - 90) * (Math.PI / 180); // -90 adjustment because 0deg is 3 o'clock in SVG
  
  const needleLen = 90;
  const x2 = cx + needleLen * Math.cos(angleRad);
  const y2 = cy + needleLen * Math.sin(angleRad);

  return (
    <div className="relative w-full max-w-xs mx-auto bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-xl">
      <div className="text-center font-bold text-white/50 text-xs mb-2 uppercase tracking-widest">{label}</div>
      <svg viewBox="0 0 300 160" className="w-full">
        {/* Scale Background */}
        <path d="M 50 130 A 100 100 0 0 1 250 130" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20" />
        <path d="M 50 130 A 100 100 0 0 1 250 130" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

        {/* Ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const tickAngle = visualAngleStart + (tick * (visualAngleEnd - visualAngleStart));
            const rad = (tickAngle - 90) * (Math.PI / 180);
            const tx1 = cx + 80 * Math.cos(rad);
            const ty1 = cy + 80 * Math.sin(rad);
            const tx2 = cx + 100 * Math.cos(rad);
            const ty2 = cy + 100 * Math.sin(rad);
            
            // Calculate label value
            let valLabel = '';
            if (isZeroCenter) {
                // if maxVal is 10, range is -10 to 10
                const v = -maxVal + (tick * (maxVal * 2));
                valLabel = Math.abs(v) < 0.001 ? '0' : v.toLocaleString(undefined, { maximumFractionDigits: 1 });
            } else {
                if (customScale) {
                     const v = tick * maxVal;
                     valLabel = v.toLocaleString(undefined, { maximumFractionDigits: 1 });
                } else {
                    const v = tick * maxVal;
                    // Format large numbers or small numbers nicely
                    if (v >= 1000) valLabel = (v/1000).toFixed(1) + 'k';
                    else if (v < 1 && v > 0) valLabel = v.toFixed(3);
                    else valLabel = v.toLocaleString(undefined, { maximumFractionDigits: 2 });
                }
            }

            return (
                <g key={tick}>
                    <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                    <text x={cx + 115 * Math.cos(rad)} y={cy + 115 * Math.sin(rad)} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)" className="font-mono">{valLabel}</text>
                </g>
            )
        })}

        {/* Needle */}
        <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
        <circle cx={cx} cy={cy} r="6" fill="#1e293b" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        
        {/* Unit */}
        <text x={cx} y={100} textAnchor="middle" fontSize="14" fontWeight="black" fill="#3b82f6" className="tracking-tighter">{unit}</text>
      </svg>
    </div>
  );
};
