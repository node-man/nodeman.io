"use client";

export default function NoiseOverlay() {
  return (
    <>
      {/* Noise texture */}
      <div className="noise-overlay" aria-hidden="true" />
      
      {/* Scanlines */}
      <div className="scanline-overlay" aria-hidden="true" />
      
      {/* SVG Filter Definition */}
      <svg className="hidden">
        <defs>
          <filter id="noise-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>
    </>
  );
}
