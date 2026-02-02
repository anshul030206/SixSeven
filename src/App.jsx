import React, { useState, useEffect } from 'react';
import PlayerCard from './components/PlayerCard';
import SkillList from './components/SkillList';
import NetflixDashboard from './components/NetflixDashboard';
import { EMPLOYEE, SKILLS, INITIAL_SCORES } from './data/mockData';
import { getRecommendations } from './logic/scoringEngine';

function App() {
  const [scores, setScores] = useState(INITIAL_SCORES);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    // Calculate recommendations based on current scores
    setRows(getRecommendations(scores));
  }, [scores]);

  return (
    <div className="animate-enter">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: 'var(--text-accent)' }}>SKILL GRAPH OS</h3>
          <h1>Performance Dashboard</h1>
        </div>
        <button className="btn" onClick={() => alert('Add Certificate Flow Placeholder')}>
          + Add Certificate
        </button>
      </header>

      {/* Top Section: Player Stats */}
      <div style={{ marginBottom: '32px' }}>
        <PlayerCard employee={EMPLOYEE} scores={scores} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '32px' }}>
        {/* Left Column: Skills */}
        <div className="flex-col">
          <SkillList skills={SKILLS} scores={scores} />
        </div>

        {/* Right Column: Netflix Recommendation Engine */}
        <div className="flex-col">
          <div style={{ marginBottom: '16px' }}>
            <h2>🚀 Growth TV</h2>
            <p className="text-muted">Curated learning paths just for you.</p>
          </div>

          <NetflixDashboard recommendations={rows} />
        </div>
      </div>
    </div>
  );
}

export default App;
