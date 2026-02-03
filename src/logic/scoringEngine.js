import { SKILLS, CONTENT_DB, COMPANY_NEEDS } from '../data/mockData';

export function calculateStats(scores) {
    const values = Object.values(scores);
    const total = values.reduce((a, b) => a + b, 0);
    const average = Math.round(total / values.length);

    // Custom "Level" logic: weighted by high scores
    // If avg is 50, level is 5.
    const level = Math.floor(average / 10);
    const nextLevelScore = (level + 1) * 10;
    // If at 46, need 4 to reach 50.
    const pointsToNextLevel = nextLevelScore - average;
    // Progress in current band (e.g. 46 -> 60%)
    const progressPercent = ((average - (level * 10)) / 10) * 100;

    return { average, level, pointsToNextLevel, progressPercent };
}

export function getSkillLevel(score) {
    if (score >= 76) return { label: 'Master', color: 'var(--color-master)', glow: true };
    if (score >= 41) return { label: 'Contributor', color: 'var(--color-solid)', glow: false };
    if (score >= 20) return { label: 'Apprentice', color: 'var(--color-basic)', glow: false };
    return { label: 'Novice', color: 'var(--text-secondary)', glow: false };
}

export function getRecommendations(scores, employeeName = 'Alex') {
    const rows = [];

    // 1. "Top Picks for [Name]" (Strength-based)
    const sortedByScore = Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .map(([id]) => id);
    const topSkillId = sortedByScore[0];
    const topSkillName = SKILLS.find(s => s.id === topSkillId).name;

    const topPicks = CONTENT_DB.filter(c => c.skillId === topSkillId && scores[c.skillId] >= c.minLevel);
    if (topPicks.length > 0) {
        rows.push({
            title: `Top Picks for ${employeeName}`,
            subtitle: `Because you're strong in ${topSkillName}`,
            items: topPicks
        });
    }

    // 2. "Trending Now" (Company Needs)
    const trendingItems = [];
    COMPANY_NEEDS.forEach(need => {
        // Show all need-based content, regardless of current score (Netflix style "Popular")
        const matches = CONTENT_DB.filter(c => c.skillId === need.skillId);
        trendingItems.push(...matches);
    });

    if (trendingItems.length > 0) {
        // Unique items
        const unique = [...new Map(trendingItems.map(item => [item.id, item])).values()];
        rows.push({
            title: 'Company Priorities & Trending',
            subtitle: 'Highly requested skills across the org',
            items: unique
        });
    }

    // 3. "Quick Wins" (Short duration)
    // Updated to "Under 4 hours" per requirements
    const quickWins = CONTENT_DB.filter(c => {
        if (!c.duration) return false;
        if (c.duration === '4h' || c.duration === '5h') return false; // Exclude 4h/5h explicitly if needed, but logic below covers most
        // Simple heuristic: contains 'm' (minutes) OR '1h', '2h', '3h'
        return c.duration.includes('m') || c.duration === '1h' || c.duration === '2h' || c.duration === '3h';
    });
    if (quickWins.length > 0) {
        rows.push({
            title: 'Quick Wins (< 4 Hours)',
            subtitle: 'Learn something new in an afternoon',
            items: quickWins
        });
    }

    // 4. "New Releases" (Everything else)
    // Just a random shuffle of remaining items for demo
    const others = CONTENT_DB.filter(c => !quickWins.includes(c));
    if (others.length > 0) {
        rows.push({
            title: 'New Releases',
            items: others
        });
    }

    return rows;
}
