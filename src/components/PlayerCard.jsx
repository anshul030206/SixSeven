import React, { useMemo } from 'react';
import { calculateStats } from '../logic/scoringEngine';

const RadarChart = ({ scores }) => {
    const size = 260; // Increased from 200
    const center = size / 2;
    const radius = 70; // Decreased from 80
    const skillIds = ['s1', 's2', 's3', 's4', 's5', 's6'];

    const points = useMemo(() => {
        return skillIds.map((id, index) => {
            const score = scores[id] || 0;
            const angle = (Math.PI / 3) * index - Math.PI / 2; // Start at top
            const r = (score / 100) * radius;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    }, [scores]);

    // Background web
    const webPoints = [100, 75, 50, 25].map(p => {
        return skillIds.map((_, index) => {
            const angle = (Math.PI / 3) * index - Math.PI / 2;
            const r = (p / 100) * radius;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
                <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.6" />
                </linearGradient>
            </defs>

            {/* Background Web */}
            {webPoints.map((pts, i) => (
                <polygon key={i} points={pts} fill="none" stroke="var(--glass-border)" strokeWidth="1" />
            ))}
            <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--glass-border)" />

            {/* Data Polygon */}
            <polygon points={points} fill="url(#radarGradient)" stroke="var(--color-solid)" strokeWidth="2" />

            {/* Labels (Simplified dots) */}
            {skillIds.map((id, index) => {
                const angle = (Math.PI / 3) * index - Math.PI / 2;
                // Label pos
                const lx = center + (radius + 25) * Math.cos(angle); // Increased padding
                const ly = center + (radius + 25) * Math.sin(angle);
                return (
                    <text key={id} x={lx} y={ly} fill="var(--text-secondary)" fontSize="10" textAnchor="middle" alignmentBaseline="middle">
                        {['Tech', 'Deliv', 'Comm', 'Lead', 'Strat', 'Adapt'][index]}
                    </text>
                );
            })}
        </svg>
    );
};

const PlayerCard = ({ employee, scores }) => {
    const { level, average, pointsToNextLevel, progressPercent } = calculateStats(scores);

    return (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px' }}>

            {/* 1. Profile Section */}
            <div className="flex-row" style={{ gap: '24px' }}>
                <div style={{ position: 'relative' }}>
                    {/* Level Badge - Star Shape */}
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '-12px',
                        width: '44px',
                        height: '44px',
                        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                        background: 'linear-gradient(135deg, #d4af37 0%, #c5a028 100%)',
                        border: '2px solid var(--bg-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.4)',
                        zIndex: 10
                    }}>
                        <span style={{
                            fontSize: '0.85rem',
                            fontWeight: '800',
                            color: 'white',
                            letterSpacing: '0.5px',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                        }}>
                            {level}
                        </span>
                    </div>

                    <img
                        src={employee.avatar}
                        alt="avatar"
                        style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--text-accent)' }}
                    />
                </div>
                <div>
                    <h2 style={{ marginBottom: '4px', fontSize: '1.8rem' }}>{employee.name}</h2>
                    <div className="text-muted" style={{ fontSize: '1.1rem' }}>{employee.role}</div>
                    <div style={{ marginTop: '8px', display: 'inline-block', padding: '4px 12px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '20px', color: 'var(--text-accent)', fontSize: '0.9rem', fontWeight: 500 }}>
                        Software Engineering
                    </div>
                </div>
            </div>

            {/* 2. Stats Section (Center) */}
            <div className="flex-row" style={{ gap: '48px', minWidth: '300px' }}>
                {/* Level with Progress Bar */}
                <div style={{ textAlign: 'center', width: '100%' }}>
                    <div className="flex-row" style={{ justifyContent: 'center', gap: '8px', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-accent)', lineHeight: 1 }}>{level}</div>
                        <div className="text-sm text-muted" style={{ fontWeight: 600 }}>LEVEL</div>
                    </div>

                    {/* Progress Bar Container */}
                    <div style={{ marginTop: '12px', width: '100%', maxWidth: '200px', margin: '12px auto 0' }}>
                        <div style={{ height: '6px', width: '100%', background: 'var(--bg-card-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--text-accent)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                        </div>
                        <div className="text-sm text-muted" style={{ marginTop: '6px', fontSize: '0.75rem' }}>
                            {Math.round(pointsToNextLevel)} XP to next level
                        </div>
                    </div>
                </div>

                <div style={{ width: 1, height: 60, background: 'var(--glass-border)' }} />

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>{average}</div>
                    <div className="text-sm text-muted" style={{ marginTop: '4px', letterSpacing: '0.1em' }}>AVG SCORE</div>
                </div>
            </div>

            {/* 3. Radar Chart (Right) */}
            <div style={{ marginRight: '16px' }}>
                <RadarChart scores={scores} />
            </div>
        </div>
    );
};

export default PlayerCard;
