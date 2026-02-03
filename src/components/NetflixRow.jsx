import React from 'react';
import { getSkillLevel } from '../logic/scoringEngine';

const NetflixRow = ({ title, subtitle, items, courseProgress, onCourseClick, onUploadCertificate }) => {
    return (
        <div className="netflix-row" style={{ marginBottom: '40px' }}>
            <div style={{ marginBottom: '16px', paddingLeft: '4px' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</h3>
                {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
            </div>

            <div className="row-scroller" style={{
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                paddingBottom: '32px', // Space for hover expansion
                paddingTop: '8px',
                paddingLeft: '4px'
            }}>
                {items.map(item => {
                    const stats = courseProgress && courseProgress[item.id] ? courseProgress[item.id] : { level: 1, xp: 0 };

                    return (
                        <div key={item.id} className="netflix-card" style={{
                            minWidth: '240px',
                            height: '140px',
                            borderRadius: '8px',
                            position: 'relative',
                            cursor: 'pointer',
                            background: item.gradient || 'var(--bg-card)',
                            border: '1px solid var(--glass-border)',
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
                            overflow: 'hidden'
                        }}>
                            {/* Stats Badge */}
                            {stats.xp > 0 && (
                                <div style={{
                                    position: 'absolute', top: '8px', right: '8px',
                                    background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px',
                                    fontSize: '0.7rem', color: 'var(--accent)', border: '1px solid var(--accent)',
                                    zIndex: 5
                                }}>
                                    Lvl {stats.level}
                                </div>
                            )}

                            {/* Content Overlay */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '12px',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0))',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end'
                            }}>
                                <div style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: 'rgba(255,255,255,0.7)',
                                    textTransform: 'uppercase',
                                    marginBottom: '4px'
                                }}>
                                    {item.type} • {item.duration || '2h'}
                                </div>
                                <div style={{
                                    fontWeight: 600,
                                    lineHeight: 1.2,
                                    fontSize: '0.95rem',
                                    color: 'white'
                                }}>
                                    {item.title}
                                </div>

                                <div className="hover-details" style={{ marginTop: '8px', opacity: 0, transition: 'opacity 0.2s' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-accent)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>+{item.xp} XP Reward</span>
                                        <span>{stats.xp} XP</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '8px' }}>
                                        <button className="btn-play"
                                            onClick={(e) => { e.stopPropagation(); onCourseClick && onCourseClick(item); }}
                                            style={{
                                                flex: 1,
                                                padding: '6px',
                                                background: 'white',
                                                color: 'black',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontWeight: 700,
                                                fontSize: '0.8rem',
                                                cursor: 'pointer'
                                            }}>
                                            ▶ Start
                                        </button>

                                        {/* Certificate Upload Button */}
                                        {item.type === 'Cert' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onUploadCertificate && onUploadCertificate(item); }}
                                                style={{
                                                    padding: '6px',
                                                    background: 'rgba(255,255,255,0.2)',
                                                    color: 'white',
                                                    border: '1px solid white',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                                title="Upload Certificate"
                                            >
                                                📜
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NetflixRow;
