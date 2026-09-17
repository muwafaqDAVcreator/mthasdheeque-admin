import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const API_URL = 'https://mthasdheeque.com/api';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [projects, setProjects] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [token, setToken] = useState('');

    useEffect(() => {
        const savedToken = localStorage.getItem('adminToken');
        if (savedToken) {
            setToken(savedToken);
            setIsLoggedIn(true);
            fetchAllData(savedToken);
        }
    }, []);

    const fetchAllData = async (authToken) => {
        try {
            const headers = { 'Authorization': `Bearer ${authToken}` };

            const [projRes, contactRes, subRes] = await Promise.all([
                fetch(`${API_URL}/projects`, { headers }),
                fetch(`${API_URL}/contact`, { headers }),
                fetch(`${API_URL}/newsletter`, { headers })
            ]);

            if (projRes.ok) setProjects(await projRes.json());
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
                setToken(data.token);
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
        setToken('');
        setUsername('');
        setPassword('');
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const method = editingId ? 'PATCH' : 'POST';
            const url = editingId ? `${API_URL}/projects/${editingId}` : `${API_URL}/projects`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    category: formData.category,
                    location: formData.location,
                    value: formData.value,
                    published: formData.published || false,
                    tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
                })
            });

            if (response.ok) {
                setSuccess(editingId ? 'Project updated!' : 'Project created!');
                setShowForm(false);
                setFormData({});
                setEditingId(null);
                fetchAllData(token);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to save project');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm('Delete this project?')) return;

        try {
            const response = await fetch(`${API_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setSuccess('Project deleted!');
                fetchAllData(token);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to delete project');
        }
    };

    const handleDeleteContact = async (id) => {
        if (!window.confirm('Delete this message?')) return;

        try {
            const response = await fetch(`${API_URL}/contact/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setSuccess('Message deleted!');
                fetchAllData(token);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to delete message');
        }
    };

    const handleDeleteSubscriber = async (id) => {
        if (!window.confirm('Delete this subscriber?')) return;

        try {
            const response = await fetch(`${API_URL}/newsletter/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setSuccess('Subscriber deleted!');
                fetchAllData(token);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to delete subscriber');
        }
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

            {success && <div className="success">{success}</div>}
            {error && <div className="error">{error}</div>}

            <div className="tabs">
                <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                <button className={`tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>Projects ({projects.length})</button>
                <button className={`tab ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>Messages ({contacts.length})</button>
                <button className={`tab ${activeTab === 'subscribers' ? 'active' : ''}`} onClick={() => setActiveTab('subscribers')}>Subscribers ({subscribers.length})</button>
            </div>

            <div className="content">
                {activeTab === 'dashboard' && (
                    <div className="dashboard-stats">
                        <div className="stat-card">
                            <h3>📁 Projects</h3>
                            <p className="stat-number">{projects.length}</p>
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
                        <div className="list-header">
                            <h2>Projects</h2>
                            <button className="btn-add" onClick={() => {
                                setShowForm(!showForm);
                                setEditingId(null);
                                setFormData({});
                            }}>
                                {showForm ? '✕ Cancel' : '+ Add Project'}
                            </button>
                        </div>

                        {showForm && (
                            <form onSubmit={handleAddProject} className="form-container">
                                <div className="form-row">
                                    <input type="text" placeholder="Project Name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                    <input type="text" placeholder="Location" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} required />
                                </div>
                                <div className="form-row">
                                    <input type="text" placeholder="Category" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                                    <input type="text" placeholder="Value (e.g. QR 50M)" value={formData.value || ''} onChange={(e) => setFormData({...formData, value: e.target.value})} />
                                </div>
                                <textarea placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                                <input type="text" placeholder="Tags (comma separated)" value={formData.tags || ''} onChange={(e) => setFormData({...formData, tags: e.target.value})} />
                                <div className="checkbox-group">
                                    <input type="checkbox" id="published" checked={formData.published || false} onChange={(e) => setFormData({...formData, published: e.target.checked})} />
                                    <label htmlFor="published">Publish immediately</label>
                                </div>
                                <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update Project' : 'Create Project')}</button>
                            </form>
                        )}

                        {projects.length === 0 ? (
                            <p>No projects yet.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Location</th>
                                        <th>Value</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map(p => (
                                        <tr key={p._id}>
                                            <td>{p.name}</td>
                                            <td>{p.location}</td>
                                            <td>{p.value}</td>
                                            <td>{p.published ? '✅ Published' : '⏳ Draft'}</td>
                                            <td>
                                                <button className="btn-small" onClick={() => {
                                                    setFormData(p);
                                                    setEditingId(p._id);
                                                    setShowForm(true);
                                                }}>Edit</button>
                                                <button className="btn-small btn-danger" onClick={() => handleDeleteProject(p._id)}>Delete</button>
                                            </td>
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
                                        <th>Message</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contacts.map(c => (
                                        <tr key={c._id}>
                                            <td>{c.name}</td>
                                            <td>{c.email}</td>
                                            <td>{c.subject}</td>
                                            <td className="message-preview">{c.message.substring(0, 50)}...</td>
                                            <td><span className={`status ${c.status}`}>{c.status}</span></td>
                                            <td>
                                                <button className="btn-small btn-danger" onClick={() => handleDeleteContact(c._id)}>Delete</button>
                                            </td>
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
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscribers.map(s => (
                                        <tr key={s._id}>
                                            <td>{s.email}</td>
                                            <td>{s.name || '-'}</td>
                                            <td>{s.status}</td>
                                            <td>
                                                <button className="btn-small btn-danger" onClick={() => handleDeleteSubscriber(s._id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
