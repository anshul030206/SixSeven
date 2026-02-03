import React, { useState } from 'react';

const HRDashboard = ({ requests, onAction, onLogout }) => {
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyText, setReplyText] = useState('');

    // Calculate stats
    const stats = {
        total: requests.length,
        leave: requests.filter(r => r.type === 'leave').length,
        issues: requests.filter(r => r.type === 'issue').length,
        harassment: requests.filter(r => r.type === 'harassment').length,
        escalated: requests.filter(r => r.escalated).length,
        pending: requests.filter(r => r.status === 'pending').length
    };

    const handleAction = (id, action, payload = null) => {
        onAction(id, action, payload);
        if (action === 'reply') {
            setActiveReplyId(null);
            setReplyText('');
        }
    };

    return (
        <div style={{ padding: '2rem', background: 'var(--bg)', minHeight: '100vh' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ color: 'var(--text)' }}>HR Dashboard</h1>
                    <button className="btn" style={{ background: 'var(--surface-light)', color: 'var(--text)' }} onClick={onLogout}>
                        Log Out
                    </button>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <StatCard title="Total Requests" value={stats.total} color="var(--primary)" />
                    <StatCard title="Leave Requests" value={stats.leave} color="var(--accent)" />
                    <StatCard title="General Issues" value={stats.issues} color="var(--text-muted)" />
                    <StatCard title="Harassment" value={stats.harassment} color="var(--danger)" />
                    <StatCard title="Escalated" value={stats.escalated} color="var(--warning)" />
                    <StatCard title="Pending" value={stats.pending} color="var(--success)" />
                </div>

                {/* Requests List */}
                <h2 style={{ color: 'var(--text)', marginBottom: '1.5rem' }}>Recent Requests</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[...requests].reverse().map(req => (
                        <div key={req.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <span style={{
                                        display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '20px',
                                        background: getTagColor(req.type), fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem'
                                    }}>
                                        {req.type}
                                    </span>
                                    {req.escalated && (
                                        <span style={{
                                            display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '20px',
                                            background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginLeft: '0.5rem'
                                        }}>
                                            ESCALATED
                                        </span>
                                    )}
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {new Date(req.timestamp).toLocaleString()}
                                </span>
                            </div>

                            <div>
                                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{req.message}</p>
                                {req.dates && (
                                    <div style={{ fontSize: '0.9rem', color: 'var(--accent)', background: 'rgba(255, 107, 53, 0.1)', padding: '0.5rem', borderRadius: '8px', display: 'inline-block' }}>
                                        📅 {req.dates.start} to {req.dates.end}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                <div>
                                    Status: <span style={{ fontWeight: 'bold', color: getStatusColor(req.status), textTransform: 'capitalize' }}>{req.status}</span>
                                </div>

                                {req.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn" style={{ padding: '0.5rem 1rem', background: 'var(--success)', color: '#000' }} onClick={() => handleAction(req.id, 'approve')}>
                                            ✓ Approve
                                        </button>
                                        <button className="btn" style={{ padding: '0.5rem 1rem', background: 'var(--danger)', color: '#fff' }} onClick={() => handleAction(req.id, 'reject')}>
                                            ✗ Reject
                                        </button>
                                        <button className="btn" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff' }} onClick={() => setActiveReplyId(req.id)}>
                                            📨 Message
                                        </button>
                                    </div>
                                )}

                                {req.status === 'replied' && (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>You replied to this request.</span>
                                        <button className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: 'var(--surface-light)', color: 'var(--text)' }} onClick={() => setActiveReplyId(req.id)}>
                                            Reply Again
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Reply Modal/Inline Area */}
                            {activeReplyId === req.id && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-light)', borderRadius: '8px', animation: 'fadeIn 0.3s' }}>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type a message to the user..."
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: '0.5rem', resize: 'vertical' }}
                                        rows={3}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button className="btn" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-muted)' }} onClick={() => setActiveReplyId(null)}>Cancel</button>
                                        <button className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }} onClick={() => handleAction(req.id, 'reply', replyText)}>Send Message</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {requests.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No requests found.</p>}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, color }) => (
    <div className="card" style={{ textAlign: 'center', borderTop: `4px solid ${color}`, transition: 'transform 0.2s', cursor: 'default' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text)' }}>{value}</p>
    </div>
);

const getTagColor = (type) => {
    switch (type) {
        case 'leave': return 'var(--accent)';
        case 'harassment': return 'var(--danger)';
        case 'escalate': return 'var(--warning)';
        default: return 'var(--primary)';
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case 'approved': return 'var(--success)';
        case 'rejected': return 'var(--danger)';
        case 'replied': return 'var(--primary)';
        default: return 'var(--warning)';
    }
};

export default HRDashboard;
