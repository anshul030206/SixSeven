import React from 'react';
import NetflixRow from './NetflixRow';

const NetflixDashboard = ({ recommendations, courseProgress, onCourseClick, onUploadCertificate }) => {
    return (
        <div className="flex-col" style={{ gap: '0' }}>
            {recommendations.map((row, index) => (
                <NetflixRow
                    key={index}
                    title={row.title}
                    subtitle={row.subtitle}
                    items={row.items}
                    courseProgress={courseProgress}
                    onCourseClick={onCourseClick}
                    onUploadCertificate={onUploadCertificate}
                />
            ))}
        </div>
    );
};

export default NetflixDashboard;
