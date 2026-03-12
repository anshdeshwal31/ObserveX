"use client";

type BeamsProps = {
  beamWidth?: number;
  beamHeight?: number;
  beamNumber?: number;
  lightColor?: string;
  speed?: number;
  noiseIntensity?: number;
  scale?: number;
  rotation?: number;
  className?: string;
};

export function Beams({
  beamWidth = 2,
  beamHeight = 24,
  beamNumber = 18,
  lightColor = "#ffffff",
  speed = 2,
  noiseIntensity = 1.75,
  scale = 0.2,
  rotation = 30,
  className = "",
}: BeamsProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0" style={{ transform: `rotate(${rotation}deg)` }}>
        {Array.from({ length: beamNumber }).map((_, index) => {
          const left = (index / beamNumber) * 100;
          const opacity = 0.08 + (index % 5) * 0.03;

          return (
            <span
              key={`beam-${index}`}
              className="absolute top-[-10%] animate-pulse rounded-full"
              style={{
                left: `${left}%`,
                width: `${beamWidth + (index % 3)}px`,
                height: `${beamHeight + (index % 5) * 8}rem`,
                opacity,
                animationDuration: `${Math.max(1, speed + (index % 4) * 0.5)}s`,
                background: `linear-gradient(180deg, ${lightColor}, transparent 70%)`,
                filter: "blur(0.4px)",
              }}
            />
          );
        })}
      </div>

      <div
        className="absolute inset-0"
        style={{
          opacity: Math.min(0.22, noiseIntensity * 0.08),
          backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 0.7px, transparent 0.8px)",
          backgroundSize: `${Math.max(2, 12 * scale)}px ${Math.max(2, 12 * scale)}px`,
        }}
      />
    </div>
  );
}
