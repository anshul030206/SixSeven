import React from 'react';
import { getSkillLevel } from '../logic/scoringEngine';

const SkillList = ({ skills, scores }) => {
    return (
        <div className="card flex-col" style={{ height: '100%', justifyContent: 'space-between' }}>
            <div>
                <h3>Skill Mastery</h3>
                <div className="flex-col" style={{ gap: '24px' }}>
                    {skills.map(skill => {
                        const score = scores[skill.id] || 0;
                        const { label } = getSkillLevel(score);
                        const color = skill.color || '#38bdf8'; // Use specific color

                        return (
                            <div key={skill.id} className="skill-row">
                                <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 500 }}>{skill.name}</span>
                                    <span className="text-sm" style={{ color: color }}>{score} / 100</span>
                                </div>

                                {/* Progress Track */}
                                <div style={{
                                    height: '8px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Progress Fill */}
                                    <div style={{
                                        width: `${score}%`,
                                        height: '100%',
                                        background: color,
                                        borderRadius: '4px',
                                        boxShadow: `0 0 12px ${color}`,
                                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }} />
                                </div>

                                <div className="flex-row" style={{ justifyContent: 'space-between', marginTop: '4px' }}>
                                    <span className="text-sm text-muted">{skill.description}</span>
                                    <span className="text-sm" style={{ color: color, opacity: 0.8 }}>{label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SkillList;
