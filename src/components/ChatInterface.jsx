import React, { useState, useEffect, useRef } from 'react';

const ChatInterface = ({ userMessages, onSendMessage, onResetChat }) => {
    const [inputText, setInputText] = useState('');
    const [activeIntent, setActiveIntent] = useState(null);
    const [leaveDates, setLeaveDates] = useState({ start: '', end: '', context: '' });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [userMessages]);

    const handleSend = () => {
        if (!inputText.trim() && !activeIntent) return;

        if (activeIntent === 'leave') {
            if (!leaveDates.start || !leaveDates.end) return; // Validation
            onSendMessage(null, 'leave', leaveDates);
            setActiveIntent(null);
            setLeaveDates({ start: '', end: '', context: '' });
        } else {
            onSendMessage(inputText, activeIntent); // intent might be null
            setInputText('');
            if (activeIntent) setActiveIntent(null); // Reset intent after sending related message
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleIntentClick = (intent) => {
        setActiveIntent(intent);

        // Immediate bot prompt based on intent
        let botPrompt = "";
        if (intent === 'leave') botPrompt = "I'll help you request time off. Please select your leave dates below.";
        else if (intent === 'issue') botPrompt = "I'm here to help. Please describe your issue in detail, and I'll make sure it reaches the right person.";
        else if (intent === 'harassment') botPrompt = "I'm sorry you're experiencing this. Your safety is our priority. Please provide details about the incident. This will be escalated immediately and handled with complete confidentiality.";

        // We simulate a bot message for the UI state (or handle it in parent)
        onSendMessage(null, 'system_prompt', { text: botPrompt, intent });
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
            {/* Sidebar */}
            <div style={{
                width: '320px',
                padding: '2rem',
                background: 'var(--surface)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h1 style={{ color: 'var(--primary)', marginBottom: '2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '2rem' }}>🤖</span> HR Bot
                </h1>

                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Actions</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button className="btn" style={{ justifyContent: 'flex-start', background: 'var(--surface-light)', color: 'var(--text)' }} onClick={() => handleIntentClick('leave')}>
                        <span style={{ marginRight: '10px' }}>🏖️</span> Request Leave
                    </button>
                    <button className="btn" style={{ justifyContent: 'flex-start', background: 'var(--surface-light)', color: 'var(--text)' }} onClick={() => handleIntentClick('issue')}>
                        <span style={{ marginRight: '10px' }}>💼</span> Report Issue
                    </button>
                    <button className="btn" style={{ justifyContent: 'flex-start', background: 'var(--surface-light)', color: 'var(--text)' }} onClick={() => handleIntentClick('harassment')}>
                        <span style={{ marginRight: '10px' }}>⚠️</span> Report Harassment
                    </button>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => { setActiveIntent(null); setInputText(''); }}>
                        Start New Chat
                    </button>
                    <button className="btn" style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }} onClick={onResetChat}>
                        Reset Conversation
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Messages */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    {userMessages.map((msg, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            marginBottom: '1.5rem',
                            justifyContent: msg.from === 'bot' || msg.from === 'HR' ? 'flex-start' : 'flex-end',
                            animation: 'slideIn 0.3s ease'
                        }}>
                            {/* Avatar for Bot */}
                            {(msg.from === 'bot' || msg.from === 'HR') && (
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: msg.from === 'HR' ? 'var(--accent)' : 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginRight: '1rem', fontSize: '1.2rem'
                                }}>
                                    {msg.from === 'HR' ? '👤' : '🤖'}
                                </div>
                            )}

                            <div style={{ maxWidth: '70%' }}>
                                <div style={{
                                    padding: '1rem 1.5rem',
                                    borderRadius: '16px',
                                    borderTopLeftRadius: (msg.from === 'bot' || msg.from === 'HR') ? '4px' : '16px',
                                    borderTopRightRadius: (msg.from === 'bot' || msg.from === 'HR') ? '16px' : '4px',
                                    background: (msg.from === 'bot' || msg.from === 'HR') ? 'var(--surface-light)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                    color: 'var(--text)'
                                }}>
                                    {msg.from === 'HR' && <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.5rem' }}>📨 Message from HR:</div>}
                                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                                </div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: (msg.from === 'bot' || msg.from === 'HR') ? 'left' : 'right' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Avatar for User */}
                            {msg.from === 'user' && (
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'var(--surface-light)',
                                    border: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginLeft: '1rem', fontSize: '1.2rem'
                                }}>
                                    😊
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: '2rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                    {activeIntent === 'leave' ? (
                        <div style={{ background: 'var(--bg)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', paddingBottom: '0.5rem', color: 'var(--text-muted)' }}>Start Date</label>
                                    <input type="date" value={leaveDates.start} onChange={(e) => setLeaveDates({ ...leaveDates, start: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', paddingBottom: '0.5rem', color: 'var(--text-muted)' }}>End Date</label>
                                    <input type="date" value={leaveDates.end} onChange={(e) => setLeaveDates({ ...leaveDates, end: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', paddingBottom: '0.5rem', color: 'var(--text-muted)' }}>Reason / Context (Optional)</label>
                                <textarea
                                    value={leaveDates.context}
                                    onChange={(e) => setLeaveDates({ ...leaveDates, context: e.target.value })}
                                    placeholder="e.g. Taking a family trip"
                                    rows={2}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', resize: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-primary" onClick={handleSend} disabled={!leaveDates.start || !leaveDates.end}>
                                    Submit Request
                                </button>
                                <button className="btn" style={{ background: 'transparent', color: 'var(--text-muted)' }} onClick={() => setActiveIntent(null)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={activeIntent ? `Replying about ${activeIntent}...` : "Type your message or ask about company policies..."}
                                rows={1}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg)',
                                    color: 'var(--text)',
                                    resize: 'none',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <button
                                className={`btn ${inputText.trim() ? 'btn-primary' : ''}`}
                                style={{ width: '60px', borderRadius: '12px', background: inputText.trim() ? '' : 'var(--surface-light)', cursor: inputText.trim() ? 'pointer' : 'default' }}
                                disabled={!inputText.trim()}
                                onClick={handleSend}
                            >
                                ➤
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
