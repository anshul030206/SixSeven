import React from 'react';
import NetflixRow from './NetflixRow';

const NetflixDashboard = ({ recommendations }) => {
    return (
        <div className="flex-col" style={{ gap: '0' }}>
            {recommendations.map((row, index) => (
                <NetflixRow
                    key={index}
                    title={row.title}
                    subtitle={row.subtitle}
                    items={row.items}
                />
            ))}
        </div>
    );
};

export default NetflixDashboard;
