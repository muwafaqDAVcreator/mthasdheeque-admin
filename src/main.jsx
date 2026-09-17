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
    const [blogs, setBlogs] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [skills, setSkills] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [token, setToken] = useState('');
    const [formType, setFormType] = useState('');

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
    };

    const handleSaveItem = async (e, type) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = type === 'project' ? 'projects' : type === 'blog' ? 'blog' : type === 'testimonial' ? 'testimonials' : 'skills';
            const method = editingId ? 'PATCH' : 'POST';
            const url = editingId ? `${API_URL}/${endpoint}/${editingId}` : `${API_URL}/${endpoint}`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSuccess(`${type} ${editingId ? 'updated' : 'created'}!`);
                setShowForm(false);
                setFormData({});
                setEditingId(null);
                fetchAllData(token);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(`Delete this ${type}?`)) return;

        try {
            const endpoint = type === 'project' ? 'projects' : type === 'blog' ? 'blog' : type === 'testimonial' ? 'testimonials' : type === 'contact' ? 'contact' : type === 'subscriber' ? 'newsletter' : 'skills';

            const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setSuccess(`${type} deleted!`);
                fetchAllData(token);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to delete');
        }
    };

    const renderTable = (items, type, columns) => {
        if (items.length === 0) return <p className="empty-state">No {type}s yet.</p>;

        return (
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col, i) => <th key={i}>{col}</th>)}
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item._id}>
                            {columns.map((col, i) => {
                                const value = item[col.toLowerCase()] || item[col] || '-';
                                return <td key={i}>{typeof value === 'boolean' ? (value ? '✅' : '⏳') : String(value).substring(0, 50)}</td>;
                            })}
                            <td>
                                <button className="btn-edit" onClick={() => {
                                    setFormData(item);
                                    setEditingId(item._id);
                                    setFormType(type);
                                    setShowForm(true);
                                }}>Edit</button>
                                <button className="btn-delete" onClick={() => handleDelete(type, item._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    if (!isLoggedIn) {
        return (
            <div className="login-container">
                <div className="login-box">
                    <h1>🔐 Admin Panel</h1>
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                        </div>
                        {error && <div className="error">{error}</div>}
                        <button type="submit" className="btn" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Admin</h2>
                </div>
                <nav className="sidebar-nav">
                    <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setShowForm(false); }}>📊 Dashboard</button>
                    <button className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => { setActiveTab('projects'); setShowForm(false); }}>📁 Projects</button>
                    <button className={`nav-item ${activeTab === 'blog' ? 'active' : ''}`} onClick={() => { setActiveTab('blog'); setShowForm(false); }}>📝 Blog</button>
                    <button className={`nav-item ${activeTab === 'testimonials' ? 'active' : ''}`} onClick={() => { setActiveTab('testimonials'); setShowForm(false); }}>⭐ Testimonials</button>
                    <button className={`nav-item ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => { setActiveTab('skills'); setShowForm(false); }}>🎯 Skills</button>
                    <button className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => { setActiveTab('contacts'); setShowForm(false); }}>💬 Messages</button>
                    <button className={`nav-item ${activeTab === 'subscribers' ? 'active' : ''}`} onClick={() => { setActiveTab('subscribers'); setShowForm(false); }}>📧 Subscribers</button>
                    <hr />
                    <button className="nav-item logout" onClick={handleLogout}>🚪 Logout</button>
                </nav>
            </div>

            <div className="main-content">
                <div className="content-header">
                    <h1>{activeTab.toUpperCase()}</h1>
                    {success && <div className="success">{success}</div>}
                    {error && <div className="error">{error}</div>}
                </div>

                {activeTab === 'dashboard' && (
                    <div className="dashboard-content">
                        <div className="stats-grid">
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
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div className="content-section">
                        <div className="section-header">
                            <button className="btn-primary" onClick={() => {
                                setShowForm(!showForm);
                                setEditingId(null);
                                setFormData({});
                                setFormType('project');
                            }}>+ Add Project</button>
                        </div>
                        {showForm && (
                            <form onSubmit={(e) => handleSaveItem(e, 'project')} className="form-container">
                                <input type="text" placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                <input type="text" placeholder="Location" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} required />
                                <input type="text" placeholder="Value" value={formData.value || ''} onChange={(e) => setFormData({...formData, value: e.target.value})} />
                                <textarea placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                                <label><input type="checkbox" checked={formData.published || false} onChange={(e) => setFormData({...formData, published: e.target.checked})} /> Publish</label>
                                <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
                            </form>
                        )}
                        {renderTable(projects, 'project', ['Name', 'Location', 'Value', 'Published'])}
                    </div>
                )}

                {activeTab === 'blog' && (
                    <div className="content-section">
                        <div className="section-header">
                            <button className="btn-primary" onClick={() => {
                                setShowForm(!showForm);
                                setEditingId(null);
                                setFormData({});
                                setFormType('blog');
                            }}>+ Add Blog</button>
                        </div>
                        {showForm && (
                            <form onSubmit={(e) => handleSaveItem(e, 'blog')} className="form-container">
                                <input type="text" placeholder="Title" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                                <input type="text" placeholder="Slug" value={formData.slug || ''} onChange={(e) => setFormData({...formData, slug: e.target.value})} />
                                <textarea placeholder="Content" value={formData.content || ''} onChange={(e) => setFormData({...formData, content: e.target.value})}></textarea>
                                <input type="text" placeholder="Author" value={formData.author || ''} onChange={(e) => setFormData({...formData, author: e.target.value})} />
                                <label><input type="checkbox" checked={formData.published || false} onChange={(e) => setFormData({...formData, published: e.target.checked})} /> Publish</label>
                                <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
                            </form>
                        )}
                        {renderTable(blogs, 'blog', ['Title', 'Author', 'Published'])}
                    </div>
                )}

                {activeTab === 'testimonials' && (
                    <div className="content-section">
                        <div className="section-header">
                            <button className="btn-primary" onClick={() => {
                                setShowForm(!showForm);
                                setEditingId(null);
                                setFormData({});
                                setFormType('testimonial');
                            }}>+ Add Testimonial</button>
                        </div>
                        {showForm && (
                            <form onSubmit={(e) => handleSaveItem(e, 'testimonial')} className="form-container">
                                <input type="text" placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                <input type="text" placeholder="Company" value={formData.company || ''} onChange={(e) => setFormData({...formData, company: e.target.value})} />
                                <textarea placeholder="Message" value={formData.message || ''} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
                                <input type="number" placeholder="Rating (1-5)" min="1" max="5" value={formData.rating || ''} onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})} />
                                <label><input type="checkbox" checked={formData.published || false} onChange={(e) => setFormData({...formData, published: e.target.checked})} /> Publish</label>
                                <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
                            </form>
                        )}
                        {renderTable(testimonials, 'testimonial', ['Name', 'Company', 'Rating', 'Published'])}
                    </div>
                )}

                {activeTab === 'skills' && (
                    <div className="content-section">
                        <div className="section-header">
                            <button className="btn-primary" onClick={() => {
                                setShowForm(!showForm);
                                setEditingId(null);
                                setFormData({});
                                setFormType('skill');
                            }}>+ Add Skill</button>
                        </div>
                        {showForm && (
                            <form onSubmit={(e) => handleSaveItem(e, 'skill')} className="form-container">
                                <input type="text" placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                <input type="number" placeholder="Level (0-100)" min="0" max="100" value={formData.level || ''} onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})} />
                                <input type="text" placeholder="Category" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                                <label><input type="checkbox" checked={formData.published || false} onChange={(e) => setFormData({...formData, published: e.target.checked})} /> Publish</label>
                                <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
                            </form>
                        )}
                        {renderTable(skills, 'skill', ['Name', 'Level', 'Category', 'Published'])}
                    </div>
                )}

                {activeTab === 'contacts' && (
                    <div className="content-section">
                        {renderTable(contacts, 'contact', ['Name', 'Email', 'Subject', 'Status'])}
                    </div>
                )}

                {activeTab === 'subscribers' && (
                    <div className="content-section">
                        {renderTable(subscribers, 'subscriber', ['Email', 'Name', 'Status'])}
                    </div>
                )}
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
