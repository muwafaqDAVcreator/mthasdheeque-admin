import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const API_URL = 'https://mthasdheeque.com/api';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [projects, setProjects] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [skills, setSkills] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [subscribers, setSubscribers] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            setIsLoggedIn(true);
            fetchAllData(token);
        }
    }, []);

    const fetchAllData = async (token) => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            const [projRes, blogRes, testRes, skillRes, contactRes, subRes] = await Promise.all([
                fetch(`${API_URL}/projects`, { headers }),
                fetch(`${API_URL}/blog`, { headers }),
                fetch(`${API_URL}/testimonials`, { headers }),
                fetch(`${API_URL}/skills`, { headers }),
                fetch(`${API_URL}/contact`, { headers }),
                fetch(`${API_URL}/newsletter`, { headers })
            ]);

            if (projRes.ok) setProjects(await projRes.json());
            if (blogRes.ok) setBlogs(await blogRes.json());
            if (testRes.ok) setTestimonials(await testRes.json());
            if (skillRes.ok) setSkills(await skillRes.json());
            if (contactRes.ok) setContacts(await contactRes.json());
            if (subRes.ok) setSubscribers(await subRes.json());
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                setIsLoggedIn(true);
                fetchAllData(data.token);
                setUsername('');
                setPassword('');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Connection error. Check if backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setIsLoggedIn(false);
        setUsername('');
        setPassword('');
    };

    if (!isLoggedIn) {
        return (
            <div className="login-container">
                <div className="login-box">
                    <h1>🔐 Admin Panel</h1>
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {error && <div className="error">{error}</div>}
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>📊 Admin Dashboard</h1>
                    <p className="subtitle">Manage your portfolio content</p>
                </div>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    Dashboard
                </button>
                <button
                    className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
                    onClick={() => setActiveTab('projects')}
                >
                    Projects ({projects.length})
                </button>
                <button
                    className={`tab ${activeTab === 'blog' ? 'active' : ''}`}
                    onClick={() => setActiveTab('blog')}
                >
                    Blog ({blogs.length})
                </button>
                <button
                    className={`tab ${activeTab === 'testimonials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('testimonials')}
                >
                    Testimonials ({testimonials.length})
                </button>
                <button
                    className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
                    onClick={() => setActiveTab('skills')}
                >
                    Skills ({skills.length})
                </button>
                <button
                    className={`tab ${activeTab === 'contacts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contacts')}
                >
                    Messages ({contacts.length})
                </button>
                <button
                    className={`tab ${activeTab === 'subscribers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('subscribers')}
                >
                    Subscribers ({subscribers.length})
                </button>
            </div>

            <div className="content">
                {activeTab === 'dashboard' && (
                    <div className="dashboard-stats">
                        <div className="stat-card">
                            <h3>📁 Projects</h3>
                            <p className="stat-number">{projects.length}</p>
                        </div>
                        <div className="stat-card">
                            <h3>📝 Blog Posts</h3>
                            <p className="stat-number">{blogs.length}</p>
                        </div>
                        <div className="stat-card">
                            <h3>⭐ Testimonials</h3>
                            <p className="stat-number">{testimonials.length}</p>
                        </div>
                        <div className="stat-card">
                            <h3>🎯 Skills</h3>
                            <p className="stat-number">{skills.length}</p>
                        </div>
                        <div className="stat-card">
                            <h3>💬 Messages</h3>
                            <p className="stat-number">{contacts.length}</p>
                        </div>
                        <div className="stat-card">
                            <h3>📧 Subscribers</h3>
                            <p className="stat-number">{subscribers.length}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div className="list-container">
                        <h2>Projects</h2>
                        {projects.length === 0 ? (
                            <p>No projects yet. Create one from your backend.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Location</th>
                                        <th>Value</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map(p => (
                                        <tr key={p._id}>
                                            <td>{p.name}</td>
                                            <td>{p.location}</td>
                                            <td>{p.value}</td>
                                            <td>{p.published ? '✅ Published' : '⏳ Draft'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'contacts' && (
                    <div className="list-container">
                        <h2>Contact Messages</h2>
                        {contacts.length === 0 ? (
                            <p>No messages yet.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Subject</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contacts.map(c => (
                                        <tr key={c._id}>
                                            <td>{c.name}</td>
                                            <td>{c.email}</td>
                                            <td>{c.subject}</td>
                                            <td><span className={`status ${c.status}`}>{c.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'subscribers' && (
                    <div className="list-container">
                        <h2>Newsletter Subscribers</h2>
                        {subscribers.length === 0 ? (
                            <p>No subscribers yet.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscribers.map(s => (
                                        <tr key={s._id}>
                                            <td>{s.email}</td>
                                            <td>{s.name || '-'}</td>
                                            <td>{s.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {['blog', 'testimonials', 'skills'].includes(activeTab) && (
                    <div className="list-container">
                        <h2 style={{ textTransform: 'capitalize' }}>{activeTab}</h2>
                        <p>Content management features coming soon. Use your backend API to manage these items.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
