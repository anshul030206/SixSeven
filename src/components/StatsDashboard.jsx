import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SKILLS, CONTENT_DB } from '../data/mockData';

const StatsDashboard = ({ scores, onCourseClick }) => {
    // Use passed scores or default to ID based lookups if not available immediately
    const data = SKILLS.map(skill => ({
        id: skill.id,
        subject: skill.name,
        A: scores ? scores[skill.id] : 0, // Dynamic Score
        fullMark: 100,
        hex: skill.color
    }));

    const sortedSkills = [...data].sort((a, b) => b.A - a.A);
    const strengths = sortedSkills.slice(0, 3);
    // Filter for weaknesses (e.g., score < 70) or just take bottom 3
    const weaknesses = sortedSkills.filter(s => s.A < 80).slice(0, 4);

    const getSuggestions = (skillId) => {
        // Return top 5 courses for this skill
        return CONTENT_DB.filter(c => c.skillId === skillId).slice(0, 10);
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)' }}>My Skills Profile</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Chart Section */}
                <div className="card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="var(--border)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-muted)' }} axisLine={false} />
                            <Radar name="Skill Level" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.5} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: 'var(--surface-light)', color: 'var(--text)' }} itemStyle={{ color: 'var(--text)' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Analysis Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Strengths */}
                    <div className="card">
                        <h3 style={{ color: 'var(--success)', marginBottom: '1rem', fontSize: '1.1rem' }}>💪 Top Strengths</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {strengths.map(skill => (
                                <div key={skill.subject} style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--success)', fontSize: '0.9rem' }}>
                                    {skill.subject} <span style={{ fontWeight: 'bold' }}>{skill.A}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Areas for Growth -> NOW LARGER AND SCROLLABLE */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px' }}>
                        <h3 style={{ color: 'var(--warning)', marginBottom: '1rem', fontSize: '1.1rem' }}>📈 Recommended Learning Paths</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', maxHeight: '400px', paddingRight: '1rem' }} className="custom-scrollbar">
                            {weaknesses.map(skill => {
                                const suggestions = getSuggestions(skill.id);
                                if (suggestions.length === 0) return null;

                                return (
                                    <div key={skill.subject}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: '600' }}>{skill.subject}</span>
                                            <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>{skill.A}/100</span>
                                        </div>

                                        <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '0.75rem', border: '1px solid var(--border)' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>+10 XP when completed:</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {suggestions.map(course => (
                                                    <div
                                                        key={course.id}
                                                        onClick={() => onCourseClick && onCourseClick(course)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
                                                            cursor: 'pointer', padding: '8px', borderRadius: '6px',
                                                            background: 'var(--surface)',
                                                            border: '1px solid transparent',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'var(--surface-light)';
                                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'var(--surface)';
                                                            e.currentTarget.style.borderColor = 'transparent';
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '1.2rem' }}>▶️</span>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: '500' }}>{course.title}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{course.duration} • {course.type}</div>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                                            +10 XP
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {weaknesses.length === 0 && <p style={{ color: 'var(--text-muted)' }}>You are doing great! Keep up the good work.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsDashboard;
