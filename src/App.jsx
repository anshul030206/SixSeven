import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import HRDashboard from './components/HRDashboard';
import Login from './components/Login';
import StatsDashboard from './components/StatsDashboard';

// Recommendation System Imports
import NetflixDashboard from './components/NetflixDashboard';
import { INITIAL_SCORES, EMPLOYEE, SKILLS } from './data/mockData';
import { getRecommendations } from './logic/scoringEngine';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'emp-login', 'recommendation', 'stats', 'hr-login', 'hr-bot', 'hr-dashboard'

  // HR Bot State (Preserved across toggles)
  const [userMessages, setUserMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) return JSON.parse(saved);
    return [{
      id: Date.now(),
      from: 'bot',
      text: "Hi! I'm your HR assistant. How can I help you today? Choose an option from the sidebar or type your request.",
      timestamp: new Date().toISOString()
    }];
  });

  const [hrRequests, setHrRequests] = useState(() => {
    const saved = localStorage.getItem('hrRequests');
    return saved ? JSON.parse(saved) : [];
  });

  // Recommendation State
  const [skillScores, setSkillScores] = useState(() => {
    return { ...INITIAL_SCORES };
  });

  // NEW: Course Progress State { courseId: { level: 1, xp: 0 } }
  const [courseProgress, setCourseProgress] = useState({});

  const [recommendations, setRecommendations] = useState([]);

  // Initialization
  useEffect(() => {
    // Load Recommendation Data based on current scores
    const recs = getRecommendations(skillScores, EMPLOYEE.name);
    setRecommendations(recs);
  }, [skillScores]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(userMessages));
  }, [userMessages]);

  useEffect(() => {
    localStorage.setItem('hrRequests', JSON.stringify(hrRequests));
  }, [hrRequests]);

  // Cross-Tab Synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'chatHistory') {
        setUserMessages(e.newValue ? JSON.parse(e.newValue) : []);
      }
      if (e.key === 'hrRequests') {
        setHrRequests(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handler for HR Bot Messages
  const handleUserMessage = (text, intent, payload = null) => {
    const userMsg = {
      id: Date.now(),
      from: 'user',
      text: intent === 'leave' ? `Requesting leave from ${payload.start} to ${payload.end}` : (text || `Selected: ${intent}`),
      timestamp: new Date().toISOString()
    };

    let newMessages = [...userMessages, userMsg];
    let newRequests = [...hrRequests];
    let botResponseText = "";

    if (intent === 'leave') {
      const start = new Date(payload.start);
      const end = new Date(payload.end);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const requestId = Math.floor(Math.random() * 100000);

      const context = payload.context ? `Reason: ${payload.context}` : '';
      const message = `Leave Request: ${payload.start} to ${payload.end} (${diffDays} days). ${context}`;

      newRequests.push({
        id: requestId, type: 'leave', message: message,
        dates: payload, escalated: false, status: 'pending', timestamp: new Date().toISOString()
      });
      botResponseText = `Your leave request has been submitted for ${diffDays} days. HR will review and respond within 24 hours. Reference: #${requestId}`;
    }
    else if (intent === 'issue') {
      const requestId = Math.floor(Math.random() * 100000);
      newRequests.push({
        id: requestId, type: 'issue', message: text, escalated: false, status: 'pending', timestamp: new Date().toISOString()
      });
      botResponseText = "Thank you for sharing. Your request has been submitted to HR. You should hear back within 2-3 business days.";
    }
    else if (intent === 'harassment') {
      const requestId = Math.floor(Math.random() * 100000);
      newRequests.push({
        id: requestId, type: 'harassment', message: text, escalated: true, status: 'pending', timestamp: new Date().toISOString()
      });
      botResponseText = `Thank you. Your request has been escalated to HR immediately. They will reach out within 24 hours. Reference: #${requestId}`;
    }
    else if (intent === 'system_prompt') {
      botResponseText = payload.text;
      if (!text) newMessages = userMessages;
    }
    else {
      // Simple Keyword-based Policy KB
      const lowerText = text.toLowerCase();
      if (lowerText.includes('policy') || lowerText.includes('rule')) {
        if (lowerText.includes('leave') || lowerText.includes('vacation')) {
          botResponseText = "Our Leave Policy: Employees are entitled to 20 days of paid leave per year. Requests > 3 days need manager approval.";
        } else if (lowerText.includes('remote') || lowerText.includes('wfh') || lowerText.includes('home')) {
          botResponseText = "Remote Work Policy: We embrace a hybrid model. Employees can work from home up to 3 days a week with manager coordination.";
        } else if (lowerText.includes('sick')) {
          botResponseText = "Sick Leave: You have 10 sick days annually. A medical certificate is required for absences longer than 2 consecutive days.";
        }
        else {
          botResponseText = "I can answer questions about Leave, Remote Work, and Sick policies. What would you like to know?";
        }
      } else {
        botResponseText = "I'm not sure how to handle that. Please use the buttons in the sidebar to start a specific request, or ask me about company policies.";
      }
    }

    if (botResponseText && intent !== 'system_prompt') {
      setTimeout(() => {
        setUserMessages(prev => [...prev, {
          id: Date.now() + 1, from: 'bot', text: botResponseText, timestamp: new Date().toISOString()
        }]);
      }, 600);
    }

    if (intent !== 'system_prompt') {
      setUserMessages(newMessages);
      setHrRequests(newRequests);
    } else {
      setUserMessages(prev => [...prev, {
        id: Date.now() + 1, from: 'bot', text: botResponseText, timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleHRAction = (id, action, payload) => {
    const updatedRequests = hrRequests.map(req => {
      if (req.id === id) {
        if (action === 'approve') return { ...req, status: 'approved' };
        if (action === 'reject') return { ...req, status: 'rejected' };
        if (action === 'reply') return { ...req, status: 'replied' }; // Mark as replied
      }
      return req;
    });
    setHrRequests(updatedRequests);

    let messageText = "";
    if (action === 'approve') messageText = `Your request #${id} has been APPROVED.`;
    if (action === 'reject') messageText = `Your request #${id} has been REJECTED.`;
    if (action === 'reply') messageText = `HR Reply regarding request #${id}: ${payload}`;

    if (messageText) {
      setUserMessages(prev => [...prev, {
        id: Date.now(), from: 'HR', text: messageText, timestamp: new Date().toISOString()
      }]);
    }
  };

  const resetSystem = () => {
    if (window.confirm("Are you sure you want to completely reset the demo system? All chats and requests will be deleted.")) {
      localStorage.removeItem('chatHistory');
      localStorage.removeItem('hrRequests');
      setUserMessages([{
        id: Date.now(),
        from: 'bot',
        text: "Hi! I'm your HR assistant. How can I help you today? Choose an option from the sidebar or type your request.",
        timestamp: new Date().toISOString()
      }]);
      setHrRequests([]);
      setSkillScores({ ...INITIAL_SCORES });
      setCourseProgress({});
      alert("System has been reset!");
    }
  };

  const handleCourseComplete = (course) => {
    if (course && course.skillId) {
      // 1. Update Global Skill Score
      setSkillScores(prev => ({
        ...prev,
        [course.skillId]: Math.min((prev[course.skillId] || 0) + 10, 100)
      }));

      // 2. Update Course-Specific Progress
      setCourseProgress(prev => {
        const current = prev[course.id] || { level: 1, xp: 0 };
        const newXP = current.xp + 10;
        const newLevel = Math.floor(newXP / 50) + 1; // Example: Level up every 50 XP

        if (newLevel > current.level) {
          alert(`LEVEL UP! You reached Level ${newLevel} in ${course.title}!`);
        } else {
          alert(`+10 XP to ${course.title}\nTotal XP: ${newXP} (Level ${newLevel})`);
        }

        return {
          ...prev,
          [course.id]: { level: newLevel, xp: newXP }
        };
      });
    }
  };

  const handleUploadCertificate = (course) => {
    alert(`Certificate for "${course.title}" has been uploaded and sent to HR for verification.`);
  };


  return (
    <div className="app-container">

      {/* Landing Page */}
      {currentView === 'landing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'radial-gradient(circle at center, var(--surface-light), var(--bg))', gap: '2rem' }}>
          <h1 style={{ fontSize: '3rem', color: 'var(--primary)', fontWeight: 'bold' }}>SixSeven</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '-1rem' }}>Employee Growth & Support Platform</p>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <div
              className="card"
              onClick={() => setCurrentView('emp-login')}
              style={{ cursor: 'pointer', textAlign: 'center', width: '250px', transition: 'all 0.3s ease' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍💻</div>
              <h3>Employee Portal</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Access your skills, learning, and HR support.</p>
            </div>

            <div
              className="card"
              onClick={() => setCurrentView('hr-login')}
              style={{ cursor: 'pointer', textAlign: 'center', width: '250px', transition: 'all 0.3s ease' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
              <h3>HR Admin</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage requests and view platform analytics.</p>
            </div>
          </div>

          <button
            onClick={resetSystem}
            style={{ position: 'absolute', bottom: '2rem', right: '2rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Reset Demo System
          </button>
        </div>
      )}

      {/* Employee Login */}
      {currentView === 'emp-login' && (
        <Login
          title="Employee Sign In"
          demoEmail="alex@company.com"
          demoPassword="emp123"
          onLogin={() => setCurrentView('recommendation')}
          onBack={() => setCurrentView('landing')}
        />
      )}

      {/* HR Login */}
      {currentView === 'hr-login' && (
        <Login
          title="HR Admin Login"
          demoEmail="hr@company.com"
          demoPassword="hr123"
          onLogin={() => setCurrentView('hr-dashboard')}
          onBack={() => setCurrentView('landing')}
        />
      )}

      {/* View Switcher Overlay (Only for Employee Logic Side) */}
      {(currentView === 'recommendation' || currentView === 'hr-bot' || currentView === 'stats') && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000, display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn"
            style={{
              background: currentView === 'recommendation' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid var(--border)'
            }}
            onClick={() => setCurrentView('recommendation')}
          >
            Skills
          </button>
          <button
            className="btn"
            style={{
              background: currentView === 'stats' ? 'var(--warning)' : 'rgba(255,255,255,0.1)',
              color: currentView === 'stats' ? 'black' : 'white',
              border: '1px solid var(--border)'
            }}
            onClick={() => setCurrentView('stats')}
          >
            My Stats 📊
          </button>
          <button
            className="btn"
            style={{
              background: currentView === 'hr-bot' ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid var(--border)'
            }}
            onClick={() => setCurrentView('hr-bot')}
          >
            HR Bot 🤖
          </button>
          <button
            className="btn"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              border: '1px solid var(--border)'
            }}
            onClick={() => setCurrentView('landing')}
          >
            Log Out
          </button>
        </div>
      )}

      {/* 1. Recommendation System View */}
      {currentView === 'recommendation' && (
        <div className="recommendation-view" style={{ padding: '2rem', paddingBottom: '10rem', minHeight: '100vh', overflowY: 'auto' }}>
          <div className="container">
            <header style={{ marginBottom: '3rem', textAlign: 'left', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={EMPLOYEE.avatar} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--primary)' }} />
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Welcome back, {EMPLOYEE.name}</h1>
                  <p style={{ color: 'var(--text-muted)' }}>Ready to level up your skills today?</p>
                </div>
              </div>
            </header>

            <NetflixDashboard
              recommendations={recommendations}
              courseProgress={courseProgress}
              onCourseClick={handleCourseComplete}
              onUploadCertificate={handleUploadCertificate}
            />
          </div>
        </div>
      )}

      {/* 2. Stats View */}
      {currentView === 'stats' && (
        <div style={{ paddingTop: '2rem' }}>
          <div className="container" style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Performance Analytics</h1>
          </div>
          <StatsDashboard
            scores={skillScores}
            courseProgress={courseProgress}
            onCourseClick={handleCourseComplete}
            onUploadCertificate={handleUploadCertificate}
          />
        </div>
      )}

      {/* 3. HR Bot View */}
      {currentView === 'hr-bot' && (
        <div style={{ paddingTop: '0' }}> {/* Helper to avoid padding clash if using generic layout */}
          <ChatInterface
            userMessages={userMessages}
            onSendMessage={handleUserMessage}
            onResetChat={() => setUserMessages([])}
          />
        </div>
      )}

      {/* 4. HR Admin Dashboard */}
      {currentView === 'hr-dashboard' && (
        <HRDashboard
          requests={hrRequests}
          onAction={handleHRAction}
          onLogout={() => setCurrentView('landing')}
        />
      )}
    </div>
  );
}

export default App;
