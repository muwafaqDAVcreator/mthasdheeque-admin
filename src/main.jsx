import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [projects, setProjects] = useState([]);
    const [skills, setSkills] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [tools, setTools] = useState([]);
    const [shuraItems, setShuraItems] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [settings, setSettings] = useState({ hero: {}, about: '', contact: {} });
    const [settingsForm, setSettingsForm] = useState({ hero: {}, about: '', contact: {} });
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [token, setToken] = useState('');
    const [formType, setFormType] = useState('');
    const [photoUploading, setPhotoUploading] = useState(false);
    const [cvUploading, setCvUploading] = useState(false);

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

            const [projRes, skillRes, contactRes, toolRes, shuraRes, expRes, certRes, settingsRes] = await Promise.all([
                fetch(`${API_URL}/projects`, { headers }),
                fetch(`${API_URL}/skills`, { headers }),
                fetch(`${API_URL}/contact`, { headers }),
                fetch(`${API_URL}/tools`, { headers }),
                fetch(`${API_URL}/shura`, { headers }),
                fetch(`${API_URL}/experience`, { headers }),
                fetch(`${API_URL}/certificates`, { headers }),
                fetch(`${API_URL}/settings`, { headers })
            ]);

            if (projRes.ok) setProjects(await projRes.json());
            if (skillRes.ok) setSkills(await skillRes.json());
            if (contactRes.ok) setContacts(await contactRes.json());
            if (toolRes.ok) setTools(await toolRes.json());
            if (shuraRes.ok) setShuraItems(await shuraRes.json());
            if (expRes.ok) setExperiences(await expRes.json());
            if (certRes.ok) setCertificates(await certRes.json());
            if (settingsRes.ok) {
                const s = await settingsRes.json();
                setSettings(s);
                setSettingsForm(s);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    const uploadPhoto = async (file) => {
        setPhotoUploading(true);
        setError('');
        try {
            const body = new FormData();
            body.append('image', file);
            body.append('maxWidth', '900');
            body.append('maxHeight', '1200');
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body
            });
            const data = await response.json();
            if (response.ok) {
                const absoluteUrl = data.url.startsWith('http') ? data.url : `${BACKEND_ORIGIN}${data.url}`;
                setSettingsForm((prev) => ({ ...prev, hero: { ...prev.hero, photo: absoluteUrl } }));
            } else {
                setError(data.message || 'Upload failed');
            }
        } catch (err) {
            setError('Upload failed. Check if backend is running.');
        } finally {
            setPhotoUploading(false);
        }
    };

    const uploadCv = async (file) => {
        setCvUploading(true);
        setError('');
        try {
            const body = new FormData();
            body.append('document', file);
            const response = await fetch(`${API_URL}/upload/document`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body
            });
            const data = await response.json();
            if (response.ok) {
                const absoluteUrl = data.url.startsWith('http') ? data.url : `${BACKEND_ORIGIN}${data.url}`;
                setSettingsForm((prev) => ({ ...prev, hero: { ...prev.hero, cvFile: absoluteUrl } }));
            } else {
                setError(data.message || 'Upload failed');
            }
        } catch (err) {
            setError('Upload failed. Check if backend is running.');
        } finally {
            setCvUploading(false);
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

    const ENDPOINTS = {
        project: 'projects',
        skill: 'skills',
        contact: 'contact',
        tool: 'tools',
        shura: 'shura',
        experience: 'experience',
        certificate: 'certificates'
    };

    const handleSaveItem = async (e, type) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = ENDPOINTS[type];
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

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settingsForm)
            });

            if (response.ok) {
                const updated = await response.json();
                setSettings(updated);
                setSettingsForm(updated);
                setSuccess('Settings updated!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(`Delete this ${type}?`)) return;

        try {
            const endpoint = ENDPOINTS[type];

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
                    <button className={`nav-item ${activeTab === 'hero' ? 'active' : ''}`} onClick={() => { setActiveTab('hero'); setShowForm(false); }}>🧑 Hero / About / Contact</button>
                    <button className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => { setActiveTab('projects'); setShowForm(false); }}>📁 Projects</button>
                    <button className={`nav-item ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => { setActiveTab('tools'); setShowForm(false); }}>🛠️ Tools</button>
                    <button className={`nav-item ${activeTab === 'shura' ? 'active' : ''}`} onClick={() => { setActiveTab('shura'); setShowForm(false); }}>🏝️ Shura Island</button>
                    <button className={`nav-item ${activeTab === 'experience' ? 'active' : ''}`} onClick={() => { setActiveTab('experience'); setShowForm(false); }}>💼 Experience</button>
                    <button className={`nav-item ${activeTab === 'certificates' ? 'active' : ''}`} onClick={() => { setActiveTab('certificates'); setShowForm(false); }}>🎓 Certificates</button>
                    <button className={`nav-item ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => { setActiveTab('skills'); setShowForm(false); }}>🎯 Skills</button>
                    <button className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => { setActiveTab('contacts'); setShowForm(false); }}>💬 Messages</button>
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
                                <h3>🎯 Skills</h3>
                                <p className="stat-number">{skills.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>🛠️ Tools</h3>
                                <p className="stat-number">{tools.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>🏝️ Shura Items</h3>
                                <p className="stat-number">{shuraItems.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>💼 Experience</h3>
                                <p className="stat-number">{experiences.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>🎓 Certificates</h3>
                                <p className="stat-number">{certificates.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>💬 Messages</h3>
                                <p className="stat-number">{contacts.length}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'hero' && (
                    <div className="content-section">
                        <form onSubmit={handleSaveSettings} className="form-container">
                            <h3 style={{marginTop: 0}}>Hero Section</h3>
                            <input type="text" placeholder="Full Name" value={settingsForm.hero?.name || ''} onChange={(e) => setSettingsForm({...settingsForm, hero: {...settingsForm.hero, name: e.target.value}})} />
                            <input type="text" placeholder="Title" value={settingsForm.hero?.title || ''} onChange={(e) => setSettingsForm({...settingsForm, hero: {...settingsForm.hero, title: e.target.value}})} />
                            <textarea placeholder="Summary" value={settingsForm.hero?.summary || ''} onChange={(e) => setSettingsForm({...settingsForm, hero: {...settingsForm.hero, summary: e.target.value}})}></textarea>

                            <label className="field-label">Profile Photo</label>
                            <div className="photo-upload">
                                {settingsForm.hero?.photo && (
                                    <img className="photo-preview" src={settingsForm.hero.photo} alt="Profile preview" />
                                )}
                                <div className="photo-upload-controls">
                                    <label className="btn-upload">
                                        {photoUploading ? 'Uploading...' : '📤 Upload Photo'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            disabled={photoUploading}
                                            onChange={(e) => { if (e.target.files[0]) uploadPhoto(e.target.files[0]); e.target.value = ''; }}
                                        />
                                    </label>
                                    <small>Auto-resized to fit within 900×1200px. JPG/PNG, up to 8MB.</small>
                                    <input type="text" placeholder="Or paste a photo URL" value={settingsForm.hero?.photo || ''} onChange={(e) => setSettingsForm({...settingsForm, hero: {...settingsForm.hero, photo: e.target.value}})} />
                                </div>
                            </div>

                            <input type="text" placeholder="Primary CTA text" value={settingsForm.hero?.primaryCta || ''} onChange={(e) => setSettingsForm({...settingsForm, hero: {...settingsForm.hero, primaryCta: e.target.value}})} />
                            <input type="text" placeholder="Secondary CTA text" value={settingsForm.hero?.secondaryCta || ''} onChange={(e) => setSettingsForm({...settingsForm, hero: {...settingsForm.hero, secondaryCta: e.target.value}})} />

                            <label className="field-label">CV / Resume (PDF)</label>
                            <div className="photo-upload">
                                <div className="cv-preview">
                                    📄
                                    <span>{settingsForm.hero?.cvFile ? 'CV uploaded' : 'No CV uploaded'}</span>
                                </div>
                                <div className="photo-upload-controls">
                                    <label className="btn-upload">
                                        {cvUploading ? 'Uploading...' : '📤 Upload CV'}
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            hidden
                                            disabled={cvUploading}
                                            onChange={(e) => { if (e.target.files[0]) uploadCv(e.target.files[0]); e.target.value = ''; }}
                                        />
                                    </label>
                                    <small>PDF only, up to 12MB.</small>
                                    <input type="text" placeholder="Or paste a CV file URL" value={settingsForm.hero?.cvFile || ''} onChange={(e) => setSettingsForm({...settingsForm, hero: {...settingsForm.hero, cvFile: e.target.value}})} />
                                    {settingsForm.hero?.cvFile && (
                                        <a href={settingsForm.hero.cvFile} target="_blank" rel="noreferrer" className="cv-view-link">View current CV ↗</a>
                                    )}
                                </div>
                            </div>

                            <h3>About</h3>
                            <textarea placeholder="About / Profile text" value={settingsForm.about || ''} onChange={(e) => setSettingsForm({...settingsForm, about: e.target.value})}></textarea>

                            <h3>Contact</h3>
                            <div className="icon-field">
                                <span className="icon-field-icon">✉️</span>
                                <input type="email" placeholder="Email" value={settingsForm.contact?.email || ''} onChange={(e) => setSettingsForm({...settingsForm, contact: {...settingsForm.contact, email: e.target.value}})} />
                            </div>
                            <div className="icon-field">
                                <span className="icon-field-icon">📞</span>
                                <input type="text" placeholder="Phone" value={settingsForm.contact?.phone || ''} onChange={(e) => setSettingsForm({...settingsForm, contact: {...settingsForm.contact, phone: e.target.value}})} />
                            </div>
                            <div className="icon-field">
                                <span className="icon-field-icon">💬</span>
                                <input type="text" placeholder="WhatsApp" value={settingsForm.contact?.whatsapp || ''} onChange={(e) => setSettingsForm({...settingsForm, contact: {...settingsForm.contact, whatsapp: e.target.value}})} />
                            </div>
                            <div className="icon-field">
                                <span className="icon-field-icon">📍</span>
                                <input type="text" placeholder="Location" value={settingsForm.contact?.location || ''} onChange={(e) => setSettingsForm({...settingsForm, contact: {...settingsForm.contact, location: e.target.value}})} />
                            </div>
                            <div className="icon-field">
                                <span className="icon-field-icon">🔗</span>
                                <input type="text" placeholder="LinkedIn URL" value={settingsForm.contact?.linkedIn || ''} onChange={(e) => setSettingsForm({...settingsForm, contact: {...settingsForm.contact, linkedIn: e.target.value}})} />
                            </div>

                            <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : 'Save All'}</button>
                        </form>
                    </div>
                )}

                {activeTab === 'tools' && (
                    <div className="content-section">
                        <div className="section-header">
                            <button className="btn-primary" onClick={() => {
                                setShowForm(!showForm);
                                setEditingId(null);
                                setFormData({ published: true, level: 80, priority: tools.length + 1 });
                                setFormType('tool');
                            }}>+ Add Tool</button>
                        </div>
                        {showForm && formType === 'tool' && (
                            <form onSubmit={(e) => handleSaveItem(e, 'tool')} className="form-container">
                                <input type="text" placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                <textarea placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                                <select value={formData.icon || 'Wrench'} onChange={(e) => setFormData({...formData, icon: e.target.value})}>
                                    <option value="BarChart3">📊 Chart</option>
                                    <option value="FileText">📄 Document</option>
                                    <option value="Building2">🏢 Building</option>
                                    <option value="BriefcaseBusiness">💼 Briefcase</option>
                                    <option value="Award">🏆 Award</option>
                                    <option value="Wrench">🔧 Wrench</option>
                                </select>
                                <input type="number" placeholder="Level (0-100)" min="0" max="100" value={formData.level ?? ''} onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})} />
                                <input type="number" placeholder="Priority (display order)" value={formData.priority ?? ''} onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})} />
                                <label><input type="checkbox" checked={formData.published || false} onChange={(e) => setFormData({...formData, published: e.target.checked})} /> Publish</label>
                                <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
                            </form>
                        )}
                        {renderTable(tools, 'tool', ['Name', 'Level', 'Priority', 'Published'])}
                    </div>
                )}

                {activeTab === 'shura' && (
                    <div className="content-section">
                        <div className="section-header">
                            <button className="btn-primary" onClick={() => {
                                setShowForm(!showForm);
                                setEditingId(null);
                                setFormData({ published: true, order: shuraItems.length + 1 });
                                setFormType('shura');
                            }}>+ Add Shura Item</button>
                        </div>
                        {showForm && formType === 'shura' && (
                            <form onSubmit={(e) => handleSaveItem(e, 'shura')} className="form-container">
                                <input type="text" placeholder="Name (e.g. HE2)" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                <textarea placeholder="Scope" value={formData.scope || ''} onChange={(e) => setFormData({...formData, scope: e.target.value})}></textarea>
                                <input type="number" placeholder="Order" value={formData.order ?? ''} onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})} />
                                <label><input type="checkbox" checked={formData.published || false} onChange={(e) => setFormData({...formData, published: e.target.checked})} /> Publish</label>
                                <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
                            </form>
                        )}
                        {renderTable(shuraItems, 'shura', ['Name', 'Scope', 'Order', 'Published'])}
                    </div>
                )}

                {activeTab === 'experience' && (
                    <div className="content-section">
                        <div className="section-header">
                            <button className="btn-primary" onClick={() => {
                                setShowForm(!showForm);
                                setEditingId(null);
                                setFormData({ published: true, order: experiences.length + 1 });
                                setFormType('experience');
                            }}>+ Add Experience</button>
                        </div>
                        {showForm && formType === 'experience' && (
                            <form onSubmit={(e) => handleSaveItem(e, 'experience')} className="form-container">
                                <input type="text" placeholder="Company" value={formData.company || ''} onChange={(e) => setFormData({...formData, company: e.target.value})} required />
                                <input type="text" placeholder="Role" value={formData.role || ''} onChange={(e) => setFormData({...formData, role: e.target.value})} required />
                                <input type="text" placeholder="Dates (e.g. 04/2018 - Present)" value={formData.dates || ''} onChange={(e) => setFormData({...formData, dates: e.target.value})} required />
                                <input type="text" placeholder="Project Values" value={formData.projectValues || ''} onChange={(e) => setFormData({...formData, projectValues: e.target.value})} />
                                <textarea placeholder="Responsibilities" value={formData.responsibilities || ''} onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}></textarea>
                                <input type="number" placeholder="Order" value={formData.order ?? ''} onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})} />
                                <label><input type="checkbox" checked={formData.published || false} onChange={(e) => setFormData({...formData, published: e.target.checked})} /> Publish</label>
                                <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
                            </form>
                        )}
                        {renderTable(experiences, 'experience', ['Company', 'Role', 'Dates', 'Published'])}
                    </div>
                )}

                {activeTab === 'certificates' && (
                    <div className="content-section">
                        <div className="section-header">
                            <button className="btn-primary" onClick={() => {
                                setShowForm(!showForm);
                                setEditingId(null);
                                setFormData({ published: true, order: certificates.length + 1 });
                                setFormType('certificate');
                            }}>+ Add Certificate</button>
                        </div>
                        {showForm && formType === 'certificate' && (
                            <form onSubmit={(e) => handleSaveItem(e, 'certificate')} className="form-container">
                                <input type="text" placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                <input type="text" placeholder="Registration No." value={formData.registration || ''} onChange={(e) => setFormData({...formData, registration: e.target.value})} />
                                <input type="text" placeholder="Date" value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                                <textarea placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                                <input type="text" placeholder="File URL (PDF/image)" value={formData.file || ''} onChange={(e) => setFormData({...formData, file: e.target.value})} />
                                <input type="number" placeholder="Order" value={formData.order ?? ''} onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})} />
                                <label><input type="checkbox" checked={formData.published || false} onChange={(e) => setFormData({...formData, published: e.target.checked})} /> Publish</label>
                                <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
                            </form>
                        )}
                        {renderTable(certificates, 'certificate', ['Name', 'Registration', 'Date', 'Published'])}
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
                                <label><input type="checkbox" checked={formData.published || false} onChange={(e) => setFormData({...formData, published: e.target.checked})} /> Publish</label>
                                <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
                            </form>
                        )}
                        {renderTable(skills, 'skill', ['Name', 'Level', 'Published'])}
                    </div>
                )}

                {activeTab === 'contacts' && (
                    <div className="content-section">
                        {renderTable(contacts, 'contact', ['Name', 'Email', 'Subject', 'Status'])}
                    </div>
                )}

            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
