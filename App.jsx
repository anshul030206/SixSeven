import React, { useState, useEffect, useRef } from 'react';
import Groq from "groq-sdk";

// ==========================================
// LIB: STORE (State Management)
// ==========================================
const STORE_KEY_REQUESTS = 'hr_bot_requests';
const STORE_KEY_MESSAGES = 'hr_bot_messages';

// User Database (Mock)
export const USERS = [
    { id: 'u1', email: 'alice@company.com', name: 'Alice', password: 'password' },
    { id: 'u2', email: 'bob@company.com', name: 'Bob', password: 'password' },
    { id: 'u3', email: 'charlie@company.com', name: 'Charlie', password: 'password' }
];

export function authenticateUser(email, password) {
    return USERS.find(u => u.email === email && u.password === password) || null;
}

export function getAllRequests() {
    const stored = localStorage.getItem(STORE_KEY_REQUESTS);
    return stored ? JSON.parse(stored) : [];
}

export function saveRequest(request, user) {
    const requests = getAllRequests();
    const newRequest = {
        ...request,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        status: 'pending',
        userId: user.id, // Link to user
        userName: user.name, // Snapshot name
        messages: []
    };

    // If it's harassment, auto-escalate
    if (newRequest.type === 'Harassment Reporting') {
        newRequest.escalated = true;
    }

    requests.unshift(newRequest);
    localStorage.setItem(STORE_KEY_REQUESTS, JSON.stringify(requests));
    return newRequest;
}

export function updateRequestStatus(requestId, status) {
    const requests = getAllRequests();
    const request = requests.find(r => r.id === requestId);
    if (request) {
        request.status = status;
        localStorage.setItem(STORE_KEY_REQUESTS, JSON.stringify(requests));

        const autoMsg = status === 'approved'
            ? "Your request has been approved."
            : "Your request has been rejected.";
        sendHRMessage(requestId, autoMsg, request.userId);
    }
}

export function sendHRMessage(requestId, messageText, userId) {
    const messages = getHRMessages();
    const newMessage = {
        id: Date.now(),
        requestId,
        userId, // Target specific user
        from: 'HR',
        message: messageText,
        timestamp: new Date().toISOString(),
        read: false
    };
    messages.push(newMessage);
    localStorage.setItem(STORE_KEY_MESSAGES, JSON.stringify(messages));
    return newMessage;
}

export function getHRMessages() {
    const stored = localStorage.getItem(STORE_KEY_MESSAGES);
    return stored ? JSON.parse(stored) : [];
}

export function getUnreadMessagesForUser(userId) {
    const messages = getHRMessages();
    // Filter by User ID to ensure privacy
    return messages.filter(m => m.userId === userId && !m.read);
}

export function markMessagesAsRead(messageIds) {
    const messages = getHRMessages();
    let changed = false;
    messages.forEach(m => {
        if (messageIds.includes(m.id)) {
            m.read = true;
            changed = true;
        }
    });
    if (changed) {
        localStorage.setItem(STORE_KEY_MESSAGES, JSON.stringify(messages));
    }
}

export function getStats() {
    const requests = getAllRequests();
    return {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        escalated: requests.filter(r => r.escalated).length,
        leave: requests.filter(r => r.type === 'Leave Request').length,
        harassment: requests.filter(r => r.type === 'Harassment Reporting').length,
        issues: requests.filter(r => r.type === 'Personal/Professional Issue').length
    };
}

export function clearStore() {
    localStorage.removeItem(STORE_KEY_REQUESTS);
    localStorage.removeItem(STORE_KEY_MESSAGES);
    return true;
}

// ==========================================
// LIB: GROQ (AI Integration)
// ==========================================
const SYSTEM_INSTRUCTION = `
You are an HR Assistant for InnoTech, a forward-thinking technology company.
Your goal is to assist employees with common HR questions (benefits, leave, payroll, workplace culture) professionally, empathetically, and concisely.

RULES:
1. Be helpful and polite. Use the employee's name if known.
2. Keep answers short (under 3 sentences) unless a detailed explanation is required.
3. If the user asks about a serious issue (harassment, legal dispute, severe conflict), or if you do not know the answer, you MUST append the tag "[ESCALATE]" to the end of your response.
4. Do not make up specific policy details (like exact dollar amounts) if you don't know them. Instead, say "I can check the policy manual for you, or you can escalate this to a specialist."

CONTEXT:
- Company: InnoTech
- Payroll Cutoff: 25th of the month
- Insurance Provider: BlueCross (Group ID: 554433)
`;

export async function getGroqResponse(apiKey, userMessage, history = []) {
    try {
        const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

        const messages = [
            { role: "system", content: SYSTEM_INSTRUCTION },
            ...history.map(msg => ({
                role: msg.sender === 'bot' ? 'assistant' : 'user',
                content: msg.text
            })),
            { role: "user", content: userMessage }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 250,
        });

        return chatCompletion.choices[0]?.message?.content || "I couldn't generate a response.";
    } catch (error) {
        console.error("Groq Error:", error);
        return `Connection Error: ${error.message || error}. Please check your API Key.`;
    }
}

// ==========================================
// COMPONENT: ChatInterface
// ==========================================
const INTENTS = [
    { id: 'leave', label: '🏖️ Request Leave' },
    { id: 'issue', label: '💼 Personal/Professional Issue' },
    { id: 'harassment', label: '⚠️ Report Harassment', danger: true },
    { id: 'escalate', label: '🔔 Escalate to HR', danger: false },
];

const BOT_AVATAR = "🤖";
const USER_AVATAR = "👤";

const ChatInterface = ({ currentUser }) => {
    // Initial State
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [inputText, setInputText] = useState("");
    const [viewState, setViewState] = useState('idle'); // idle, date_picker, awaiting_input, offering_solution, settings
    const [activeIntent, setActiveIntent] = useState(null);
    const [dates, setDates] = useState({ start: '', end: '' });

    // API Key State
    const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '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');
    const [showSettings, setShowSettings] = useState(false);

    const messagesEndRef = useRef(null);

    // Initialize chat
    useEffect(() => {
        setMessages([
            {
                id: 'welcome',
                sender: 'bot',
                text: `Hi ${currentUser.name}! I'm your HR assistant. How can I help you today? Choose an option from the sidebar or type your request.`,
                timestamp: new Date().toISOString()
            },
        ]);
        setViewState('idle');
        setActiveIntent(null);
    }, [currentUser]);

    // Polling
    useEffect(() => {
        const pollInterval = setInterval(() => {
            const unread = getUnreadMessagesForUser(currentUser.id);
            if (unread.length > 0) {
                const newMsgs = unread.map(m => ({
                    id: m.id,
                    sender: 'bot',
                    text: `📨 Message from HR: ${m.message}`,
                    timestamp: m.timestamp,
                    isSystem: true
                }));
                setMessages(prev => [...prev, ...newMsgs]);
                markMessagesAsRead(unread.map(m => m.id));
            }
        }, 3000);
        return () => clearInterval(pollInterval);
    }, [currentUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages, isTyping, viewState]);

    const addMessage = (sender, text, extra = {}) => {
        const msg = {
            id: Date.now(),
            sender,
            text,
            timestamp: new Date().toISOString(),
            ...extra
        };
        setMessages(prev => [...prev, msg]);
        return msg;
    };

    const handleBotResponse = (text, delay = 1000, callback) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            addMessage('bot', text);
            if (callback) callback();
        }, delay);
    };

    const handleIntentClick = (intent) => {
        if (viewState !== 'idle') return;

        setActiveIntent(intent.id);
        addMessage('user', intent.label);

        switch (intent.id) {
            case 'leave':
                handleBotResponse("I'll help you request time off. Please select your leave dates below.", 800, () => {
                    setViewState('date_picker');
                });
                break;
            case 'issue':
                // Gemini check
                if (!apiKey) {
                    handleBotResponse("To provide smart assistance, I need a Gemini API Key. Please click the Settings (⚙️) icon to add it, or I can just escalate this request directly.");
                    setViewState('awaiting_input');
                } else {
                    handleBotResponse("I'm connected to the AI knowledge base. Please describe your issue, and I'll do my best to help!");
                    setViewState('awaiting_gemini');
                }
                break;
            case 'harassment':
                handleBotResponse("I'm sorry you're experiencing this. Your safety is our priority. Please provide details about the incident. This will be escalated immediately and handled with complete confidentiality.");
                setViewState('awaiting_input');
                break;
            case 'escalate':
                handleBotResponse("I'll escalate your request to the HR team. Please describe what you need help with.");
                setViewState('awaiting_input');
                break;
            default:
                setViewState('idle');
        }
    };

    const handleGeminiInteraction = async (text) => {
        setIsTyping(true);
        const response = await getGroqResponse(apiKey, text, messages.filter(m => !m.isSystem));
        setIsTyping(false);

        // Check for escalation tag
        if (response.includes("[ESCALATE]")) {
            const cleanResponse = response.replace("[ESCALATE]", "").trim();
            addMessage('bot', cleanResponse || "I think this is best handled by a human specialist.");

            handleBotResponse("Would you like me to escalate this ticket to HR now?", 500, () => {
                setViewState('offering_solution');
            });
        } else {
            addMessage('bot', response);
            // stay in awaiting_gemini state to allow continued conversation
        }
    };

    const handleTextSubmit = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText("");
        addMessage('user', text);

        if (viewState === 'awaiting_gemini') {
            handleGeminiInteraction(text);
            return;
        }

        if (viewState === 'awaiting_input') {
            const req = saveRequest({
                type: INTENTS.find(i => i.id === activeIntent)?.label || 'General Inquiry',
                message: text,
                escalated: activeIntent === 'escalate' || activeIntent === 'harassment'
            }, currentUser);

            handleBotResponse(`Thank you. Your request has been submitted to HR. Reference: #${req.id.toString().slice(-6)}`);
            setViewState('idle');
            setActiveIntent(null);
        } else {
            handleBotResponse("Please choose an option from the sidebar to start a specific request.");
        }
    };

    const handleSolutionResponse = (solved) => {
        if (solved) {
            addMessage('user', "Yes, that helped.");
            handleBotResponse("Great! I'm glad I could help. Let me know if you need anything else.");
        } else {
            addMessage('user', "No, I need to talk to someone.");
            const req = saveRequest({
                type: 'Personal/Professional Issue',
                message: "Escalated: AI could not resolve issue.",
                escalated: true
            }, currentUser);
            handleBotResponse(`Understood. I've escalated this to HR immediately. Reference: #${req.id.toString().slice(-6)}`);
        }
        setViewState('idle');
        setActiveIntent(null);
    };

    const handleDateSubmit = () => {
        if (!dates.start || !dates.end) return;

        const start = new Date(dates.start);
        const end = new Date(dates.end);

        if (end < start) {
            handleBotResponse("The end date cannot be before the start date. Please try again.");
            return;
        }

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const req = saveRequest({
            type: 'Leave Request',
            message: `Leave Requested: ${dates.start} to ${dates.end} (${diffDays} days)`,
            escalated: false,
            dates: { start: dates.start, end: dates.end }
        }, currentUser);

        setViewState('idle');
        setDates({ start: '', end: '' });
        setActiveIntent(null);

        handleBotResponse(`Your leave request has been submitted for ${diffDays} days. HR will review and respond within 24 hours. Reference: #${req.id.toString().slice(-6)}`);
    };

    const calculateDays = () => {
        if (!dates.start || !dates.end) return null;
        const start = new Date(dates.start);
        const end = new Date(dates.end);
        if (end < start) return "Invalid Range";
        return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    };

    const saveApiKey = (key) => {
        setApiKey(key);
        localStorage.setItem('groq_api_key', key);
        setShowSettings(false);
    };

    return (
        <div style={{ display: 'flex', gap: '2rem', height: '600px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            {/* Quick Actions Sidebar */}
            <div className="card glass hide-mobile" style={{ width: '300px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        Quick Actions
                    </h3>
                    <button onClick={() => setShowSettings(true)} className="btn btn-ghost" style={{ padding: '4px' }} title="AI Settings">
                        ⚙️
                    </button>
                </div>
                {INTENTS.map(intent => (
                    <button
                        key={intent.id}
                        onClick={() => handleIntentClick(intent)}
                        disabled={viewState !== 'idle'}
                        className="btn"
                        style={{
                            justifyContent: 'flex-start',
                            background: activeIntent === intent.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)',
                            border: intent.danger ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                            color: intent.danger && activeIntent !== intent.id ? 'var(--color-danger)' : 'var(--color-text)',
                            opacity: viewState !== 'idle' && activeIntent !== intent.id ? 0.5 : 1
                        }}
                    >
                        {intent.label}
                    </button>
                ))}

                {viewState === 'awaiting_gemini' && (
                    <button
                        onClick={() => {
                            setViewState('idle');
                            setActiveIntent(null);
                            addMessage('bot', "Conversation ended. How else can I help?");
                        }}
                        className="btn btn-ghost"
                        style={{ marginTop: 'auto', border: '1px solid var(--color-border)', justifyContent: 'center' }}
                    >
                        End Chat
                    </button>
                )}
            </div>

            {/* Main Chat Area */}
            <div className="card glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`animate-slide-up`} style={{
                            alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                            maxWidth: '75%',
                            display: 'flex',
                            gap: '1rem',
                            flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                        }}>
                            <div style={{
                                width: '36px', height: '36px',
                                borderRadius: '50%',
                                background: msg.sender === 'bot' ? 'var(--color-primary)' : 'var(--color-surface-light)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem',
                                flexShrink: 0,
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                {msg.sender === 'bot' ? BOT_AVATAR : USER_AVATAR}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{
                                    background: msg.sender === 'bot' ? 'var(--color-surface-light)' : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                                    padding: '1rem 1.5rem',
                                    borderRadius: '18px',
                                    borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '18px',
                                    borderTopRightRadius: msg.sender === 'user' ? '4px' : '18px',
                                    color: 'var(--color-text)',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-wrap',
                                    boxShadow: 'var(--shadow-sm)',
                                    position: 'relative'
                                }}>
                                    {msg.text}
                                </div>
                                <span style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--color-text-muted)',
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    padding: '0 0.5rem'
                                }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* INTERACTION ZONES */}
                    {viewState === 'date_picker' && (
                        <div className="animate-slide-up" style={{ alignSelf: 'flex-start', marginLeft: '3.5rem', width: '300px' }}>
                            <div style={{
                                background: 'var(--color-surface)',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                display: 'flex', flexDirection: 'column', gap: '1rem'
                            }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Start Date</label>
                                    <input
                                        type="date"
                                        value={dates.start}
                                        onChange={(e) => setDates({ ...dates, start: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>End Date</label>
                                    <input
                                        type="date"
                                        value={dates.end}
                                        onChange={(e) => setDates({ ...dates, end: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'white' }}
                                    />
                                </div>

                                {calculateDays() && (
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-accent)', textAlign: 'center' }}>
                                        Duration: <strong>{calculateDays()} days</strong>
                                    </div>
                                )}

                                <button
                                    onClick={handleDateSubmit}
                                    className="btn btn-primary"
                                    disabled={!dates.start || !dates.end || calculateDays() === "Invalid Range"}
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                >
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    )}

                    {viewState === 'offering_solution' && (
                        <div className="animate-slide-up" style={{ alignSelf: 'flex-start', marginLeft: '3.5rem', display: 'flex', gap: '1rem' }}>
                            <button onClick={() => handleSolutionResponse(true)} className="btn" style={{ background: 'var(--color-success)', color: 'black' }}>
                                ✓ Yes, Issue Solved
                            </button>
                            <button onClick={() => handleSolutionResponse(false)} className="btn" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}>
                                ⚠️ No, Escalate to HR
                            </button>
                        </div>
                    )}

                    {isTyping && (
                        <div className="animate-fade-in" style={{ alignSelf: 'flex-start', marginLeft: '3.5rem', display: 'flex', gap: '4px', padding: '1rem' }}>
                            <span className="dot" style={{ animationDelay: '0s' }}>•</span>
                            <span className="dot" style={{ animationDelay: '0.2s' }}>•</span>
                            <span className="dot" style={{ animationDelay: '0.4s' }}>•</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleTextSubmit} style={{ padding: '1.5rem', background: 'var(--color-surface-light)', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleTextSubmit(e);
                                }
                            }}
                            placeholder={viewState === 'awaiting_input' || viewState === 'awaiting_gemini' ? "Type here..." : "Type your message here..."}
                            disabled={viewState === 'date_picker' || viewState === 'offering_solution'}
                            style={{
                                flex: 1,
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px',
                                padding: '1rem',
                                color: 'white',
                                resize: 'none',
                                height: '24px',
                                fontFamily: 'inherit',
                                fontSize: '0.95rem'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim() || (viewState !== 'awaiting_input' && viewState !== 'awaiting_gemini')}
                            className="btn btn-primary"
                            style={{
                                borderRadius: '12px',
                                width: '50px',
                                opacity: (!inputText.trim() || (viewState !== 'awaiting_input' && viewState !== 'awaiting_gemini')) ? 0.5 : 1
                            }}
                        >
                            ➤
                        </button>
                    </div>
                </form>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card glass" style={{ width: '400px', padding: '2rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>AI Settings</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Enter your Groq API Key to enable smart AI responses.
                        </p>
                        <input
                            type="password"
                            placeholder="Groq API Key (gsk_...)"
                            defaultValue={apiKey}
                            onChange={(e) => setApiKey(e.target.value)} // Temporary
                            style={{ width: '100%', padding: '0.8rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'white', marginBottom: '1rem' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setShowSettings(false)} className="btn btn-ghost">Cancel</button>
                            <button onClick={(e) => saveApiKey(e.target.previousSibling.previousSibling.value)} className="btn btn-primary">Save Key</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// COMPONENT: Dashboard
// ==========================================
const Dashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginData, setLoginData] = useState({ email: '', password: '' });

    // Auth State
    if (!isAuthenticated) {
        return (
            <div style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
                <div className="card glass">
                    <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>HR Portal Login</h2>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (loginData.email === 'hr@company.com' && loginData.password === 'hr123') {
                            setIsAuthenticated(true);
                        } else {
                            alert('Invalid Credentials');
                        }
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'white' }}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'white' }}
                        />
                        <button type="submit" className="btn btn-primary">Sign In to Dashboard</button>
                    </form>
                    <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <p>Demo Credentials:</p>
                        <code>hr@company.com</code> / <code>hr123</code>
                    </div>
                </div>
            </div>
        );
    }

    return <DashboardContent onLogout={() => setIsAuthenticated(false)} />;
};

const DashboardContent = ({ onLogout }) => {
    const [stats, setStats] = useState(getStats());
    const [requests, setRequests] = useState(getAllRequests());
    const [messageModal, setMessageModal] = useState({ open: false, requestId: null, text: '' });

    const refreshData = () => {
        setStats(getStats());
        setRequests(getAllRequests());
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = (id, action) => {
        if (action === 'approve') {
            updateRequestStatus(id, 'approved');
        } else if (action === 'reject') {
            updateRequestStatus(id, 'rejected');
        }
        refreshData();
    };

    const handleSendMessage = () => {
        if (messageModal.text.trim()) {
            sendHRMessage(messageModal.requestId, messageModal.text);
            setMessageModal({ open: false, requestId: null, text: '' });
            alert("Message sent to user.");
        }
    };

    const handleClearSystem = () => {
        if (confirm("Are you sure you want to wipe all system data? This cannot be undone.")) {
            clearStore();
            refreshData();
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header / Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Overview</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Welcome back, HR Admin.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-ghost" onClick={handleClearSystem} style={{ color: 'var(--color-danger)' }}>⚠ Reset System</button>
                    <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard label="Total Requests" value={stats.total} icon="📊" />
                <StatCard label="Pending" value={stats.pending} icon="⏳" color="var(--color-warning)" />
                <StatCard label="Escalated" value={stats.escalated} icon="⚠️" color="var(--color-danger)" />
                <StatCard label="Leave" value={stats.leave} icon="🏖️" />
                <StatCard label="Issues" value={stats.issues} icon="💼" />
                <StatCard label="Harassment" value={stats.harassment} icon="🛑" color="var(--color-danger)" />
            </div>

            {/* Request List */}
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>Recent Requests</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>
                        No requests found.
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className="card" style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderLeft: req.escalated ? '4px solid var(--color-danger)' : '4px solid var(--color-primary)',
                            padding: '1.5rem'
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px',
                                        color: req.escalated ? 'var(--color-danger)' : 'var(--color-accent)'
                                    }}>
                                        {req.type}
                                    </span>
                                    {req.status === 'pending' && <span style={{ fontSize: '0.7rem', background: 'var(--color-warning)', color: 'black', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>PENDING</span>}
                                    {req.status === 'approved' && <span style={{ fontSize: '0.7rem', background: 'var(--color-success)', color: 'black', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>APPROVED</span>}
                                    {req.status === 'rejected' && <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>REJECTED</span>}
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        from <strong style={{ color: 'white' }}>{req.userName || 'Anonymous'}</strong> (#{req.id.toString().slice(-4)})
                                    </span>
                                </div>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{req.message}</p>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    {new Date(req.timestamp).toLocaleString()}
                                </div>
                            </div>

                            {req.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '2rem' }}>
                                    <button onClick={() => handleAction(req.id, 'approve')} className="btn" style={{ background: 'var(--color-success)', color: '#002200', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                                        ✓ Approve
                                    </button>
                                    <button onClick={() => handleAction(req.id, 'reject')} className="btn" style={{ background: 'rgba(255,50,50,0.2)', color: 'var(--color-danger)', padding: '0.5rem 1rem', fontSize: '0.8rem', border: '1px solid var(--color-danger)' }}>
                                        ✗ Reject
                                    </button>
                                    <button onClick={() => setMessageModal({ open: true, requestId: req.id, text: '' })} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
                                        📨 Message
                                    </button>
                                </div>
                            )}
                            {req.status !== 'pending' && (
                                <button onClick={() => setMessageModal({ open: true, requestId: req.id, text: '' })} className="btn btn-ghost" style={{ marginLeft: '2rem', fontSize: '0.8rem' }}>
                                    📨 Follow up
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Message Modal */}
            {messageModal.open && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px', background: 'var(--color-surface)' }}>
                        <h3>Send Message to User</h3>
                        <textarea
                            value={messageModal.text}
                            onChange={(e) => setMessageModal({ ...messageModal, text: e.target.value })}
                            placeholder="Type a message..."
                            style={{ width: '100%', height: '120px', padding: '1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'white', marginBottom: '1rem' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setMessageModal({ open: false, requestId: null, text: '' })} className="btn btn-ghost">Cancel</button>
                            <button onClick={handleSendMessage} className="btn btn-primary">Send Message</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon, color }) => (
    <div className="card" style={{
        padding: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        borderTop: color ? `4px solid ${color}` : `4px solid var(--color-primary)`,
        background: 'var(--color-surface)'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem' }}>
            <span style={{ fontWeight: 'bold' }}>{value}</span>
            <span>{icon}</span>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    </div>
);

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function App() {
    const [view, setView] = useState('employee'); // 'employee' | 'hr'
    const [currentUser, setCurrentUser] = useState(null);
    const [empLogin, setEmpLogin] = useState({ email: '', password: '' });

    const handleEmployeeLogin = (e) => {
        e.preventDefault();
        const user = authenticateUser(empLogin.email, empLogin.password);
        if (user) {
            setCurrentUser(user);
        } else {
            alert("Invalid credentials. Try alice@company.com / password");
        }
    };

    return (
        <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header / Nav */}
            <header style={{
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--color-border)',
                background: 'rgba(10, 14, 23, 0.8)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', boxShadow: 'var(--shadow-glow)'
                    }}>
                        🤖
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
                            InnoTech <span style={{ color: 'var(--color-primary)' }}>HR Bot</span>
                        </h1>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Automated Employee Assistant</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface)', padding: '6px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setView('employee')}
                        className="btn"
                        style={{
                            padding: '0.5rem 1.2rem',
                            fontSize: '0.9rem',
                            background: view === 'employee' ? 'var(--color-surface-hover)' : 'transparent',
                            color: view === 'employee' ? 'white' : 'var(--color-text-muted)',
                            borderRadius: '14px',
                            boxShadow: view === 'employee' ? 'var(--shadow-sm)' : 'none'
                        }}
                    >
                        User View
                    </button>
                    <button
                        onClick={() => setView('hr')}
                        className="btn"
                        style={{
                            padding: '0.5rem 1.2rem',
                            fontSize: '0.9rem',
                            background: view === 'hr' ? 'var(--color-surface-hover)' : 'transparent',
                            color: view === 'hr' ? 'white' : 'var(--color-text-muted)',
                            borderRadius: '14px',
                            boxShadow: view === 'hr' ? 'var(--shadow-sm)' : 'none'
                        }}
                    >
                        HR Dashboard
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {view === 'employee' ? (
                    currentUser ? (
                        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <p style={{ color: 'var(--color-text-muted)' }}>Logged in as: <strong style={{ color: 'white' }}>{currentUser.name}</strong> <button onClick={() => setCurrentUser(null)} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', textDecoration: 'underline', marginLeft: '0.5rem' }}>Logout</button></p>
                            </div>
                            <ChatInterface currentUser={currentUser} />
                        </div>
                    ) : (
                        <div style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }} className="animate-fade-in">
                            <div className="card glass">
                                <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>Employee Login</h2>
                                <form onSubmit={handleEmployeeLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={empLogin.email}
                                        onChange={(e) => setEmpLogin({ ...empLogin, email: e.target.value })}
                                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'white' }}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={empLogin.password}
                                        onChange={(e) => setEmpLogin({ ...empLogin, password: e.target.value })}
                                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'white' }}
                                    />
                                    <button type="submit" className="btn btn-primary">Sign In</button>
                                </form>
                                <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    <p>Demo Accounts:</p>
                                    <code>alice@company.com</code> / <code>password</code><br />
                                    <code>bob@company.com</code> / <code>password</code>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <Dashboard />
                )}
            </main>
        </div>
    );
}

export default App;
