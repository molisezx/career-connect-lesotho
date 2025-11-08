import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  addFaculty,
  deleteFaculty,
  getFaculties,
  getInstitutionStats,
  initializeInstitutionCollections,
  updateFaculty
} from '../../services/institutionServices';
import './InstitutionPages.css';

const ManageFaculties = () => {
  const { user } = useAuth();
  const [faculties, setFaculties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalFaculties: 0,
    totalDepartments: 0,
    totalCourses: 0,
    totalStudents: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    dean: '',
    contactEmail: '',
    phone: '',
    departmentCount: 0,
    courseCount: 0,
    establishedYear: new Date().getFullYear(),
    status: 'active'
  });

  // Debug user data
  useEffect(() => {
    console.log('👤 Current user in ManageFaculties:', user);
    console.log('🏫 User ID:', user?.uid);
    console.log('🏫 Institution ID:', user?.institutionId);
  }, [user]);

  // Define loadFaculties first
  const loadFaculties = async () => {
    // Use user.uid as the institution ID since that's how it's stored in Firestore
    const institutionId = user?.uid;

    if (!institutionId) {
      console.error('❌ No user ID found');
      setError('No user ID found. Please make sure you are properly logged in.');
      return;
    }

    console.log('📚 Loading faculties for institution:', institutionId);
    setIsLoading(true);
    setError('');
    try {
      // First, ensure institution collections are initialized
      console.log('🔄 Ensuring institution collections are initialized...');
      await initializeInstitutionCollections(institutionId);

      const facultiesData = await getFaculties(institutionId);
      console.log('✅ Loaded faculties:', facultiesData);
      setFaculties(facultiesData || []);
    } catch (error) {
      console.error('❌ Error loading faculties:', error);
      setError('Failed to load faculties. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    const institutionId = user?.uid;

    if (!institutionId) return;

    try {
      const institutionStats = await getInstitutionStats(institutionId);
      setStats({
        totalFaculties: institutionStats.totalFaculties || 0,
        totalDepartments: 0,
        totalCourses: institutionStats.activeCourses || 0,
        totalStudents: institutionStats.totalStudents || 0
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  // Use effects after function definitions
  useEffect(() => {
    if (user?.uid) {
      console.log('🔄 User changed, loading data...');
      loadFaculties();
      loadStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🎯 Form submission started');

    // Use user.uid as the institution ID
    const institutionId = user?.uid;

    if (!institutionId) {
      setError('No user ID found. Please make sure you are properly logged in.');
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Faculty name is required');
      return;
    }

    console.log('💾 Saving faculty data:', formData);
    console.log('🏫 For institution:', institutionId);

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Ensure institution is initialized before adding faculty
      console.log('🔄 Initializing institution collections...');
      await initializeInstitutionCollections(institutionId);

      if (editingFaculty) {
        console.log('✏️ Updating faculty:', editingFaculty.id);
        await updateFaculty(institutionId, editingFaculty.id, formData);
        setSuccess('Faculty updated successfully!');
        console.log('✅ Faculty updated successfully');
      } else {
        console.log('➕ Creating new faculty');
        const facultyId = await addFaculty(institutionId, formData);
        console.log('✅ Faculty created with ID:', facultyId);
        setSuccess('Faculty created successfully!');
      }

      // Close form and reset
      setShowForm(false);
      setEditingFaculty(null);
      resetForm();

      // Reload data
      await loadFaculties();
      await loadStats();

    } catch (error) {
      console.error('❌ Error saving faculty:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error code:', error.code);

      // Handle specific error cases
      if (error.message?.includes('No document to update') || error.code === 'not-found') {
        setError('Institution setup incomplete. Please refresh the page and try again.');
      } else if (error.message?.includes('permission-denied')) {
        setError('Permission denied. Please check your Firebase security rules.');
      } else {
        setError(error.message || 'Failed to save faculty. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (faculty) => {
    console.log('✏️ Editing faculty:', faculty);
    setEditingFaculty(faculty);
    setFormData({
      name: faculty.name || '',
      code: faculty.code || '',
      description: faculty.description || '',
      dean: faculty.dean || '',
      contactEmail: faculty.contactEmail || '',
      phone: faculty.phone || '',
      departmentCount: faculty.departmentCount || 0,
      courseCount: faculty.courseCount || 0,
      establishedYear: faculty.establishedYear || new Date().getFullYear(),
      status: faculty.status || 'active'
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (facultyId) => {
    if (!window.confirm('Are you sure you want to delete this faculty? This action cannot be undone.')) {
      console.log('❌ Delete cancelled by user');
      return;
    }

    const institutionId = user?.uid;

    if (!institutionId) {
      setError('No user ID found.');
      return;
    }

    console.log('🗑️ Deleting faculty:', facultyId);
    setIsLoading(true);
    setError('');

    try {
      await deleteFaculty(institutionId, facultyId);
      setSuccess('Faculty deleted successfully!');
      console.log('✅ Faculty deleted successfully');
      await loadFaculties();
      await loadStats();
    } catch (error) {
      console.error('❌ Error deleting faculty:', error);
      setError(error.message || 'Failed to delete faculty. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      dean: '',
      contactEmail: '',
      phone: '',
      departmentCount: 0,
      courseCount: 0,
      establishedYear: new Date().getFullYear(),
      status: 'active'
    });
  };

  const handleAddFaculty = () => {
    console.log('🎯 Add Faculty button clicked');
    console.log('👤 Current user:', user);
    console.log('👤 User UID:', user?.uid);
    setShowForm(true);
    setEditingFaculty(null);
    resetForm();
    setError('');
    setSuccess('');
  };

  const handleRetryInitialization = async () => {
    if (!user?.uid) return;

    const institutionId = user.uid;

    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Manually retrying institution initialization...');
      await initializeInstitutionCollections(institutionId);
      await loadFaculties();
      await loadStats();
      setSuccess('Institution initialized successfully!');
    } catch (error) {
      console.error('❌ Retry failed:', error);
      setError('Failed to initialize institution. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFaculties = faculties.filter(faculty =>
    faculty.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.dean?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#EF4444';
      case 'planned': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  // Test function to check if form is working
  const testFormSubmission = () => {
    console.log('🧪 Testing form submission...');
    console.log('Form Data:', formData);
    console.log('Show Form:', showForm);
    console.log('Editing Faculty:', editingFaculty);
    console.log('Is Loading:', isLoading);
  };

  return (
    <div className="institution-page">
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1 className="page-title">Manage Faculties</h1>
            <p className="page-subtitle">
              Create and manage academic faculties, departments, and programs
            </p>
          </div>
          {/* Debug button - remove in production */}
          <button
            onClick={testFormSubmission}
            style={{
              background: '#6B7280',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Debug Form
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Messages */}
        {error && (
          <div className="message error">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>{error}</span>
              {error.includes('Institution setup incomplete') && (
                <button
                  onClick={handleRetryInitialization}
                  className="retry-btn"
                  style={{ marginLeft: '10px' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Retrying...' : 'Retry Initialization'}
                </button>
              )}
              <button onClick={() => setError('')} className="close-message">×</button>
            </div>
          </div>
        )}
        {success && (
          <div className="message success">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="close-message">×</button>
            </div>
          </div>
        )}

        {/* Statistics Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">🏛️</div>
            <div className="stat-content">
              <h3>{stats.totalFaculties}</h3>
              <p>Total Faculties</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>{stats.totalCourses}</h3>
              <p>Active Courses</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-content">
              <h3>{stats.totalStudents}</h3>
              <p>Total Students</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{faculties.reduce((sum, faculty) => sum + (faculty.departmentCount || 0), 0)}</h3>
              <p>Departments</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="card">
          <div className="card-header">
            <div className="header-actions">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search faculties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ width: '300px' }}
                />
              </div>
              <div className="filter-controls">
                <button
                  className="btn-primary"
                  onClick={handleAddFaculty}
                  disabled={isLoading}
                  id="add-faculty-button"
                >
                  <span>+</span> Add New Faculty
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Faculties Grid */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Academic Faculties</h2>
            <span className="text-muted">{filteredFaculties.length} faculties found</span>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading faculties...</p>
            </div>
          ) : filteredFaculties.length > 0 ? (
            <div className="faculties-grid-enhanced">
              {filteredFaculties.map((faculty) => (
                <div key={faculty.id} className="faculty-card-enhanced">
                  <div className="faculty-card-header">
                    <div className="faculty-badge">
                      <div className="faculty-avatar">
                        {faculty.name?.charAt(0) || 'F'}
                      </div>
                      <div className="faculty-title">
                        <h3>{faculty.name}</h3>
                        {faculty.code && <span className="faculty-code">{faculty.code}</span>}
                      </div>
                    </div>
                    <div
                      className="faculty-status"
                      style={{ backgroundColor: getStatusColor(faculty.status) }}
                    >
                      {faculty.status}
                    </div>
                  </div>

                  {faculty.description && (
                    <p className="faculty-description">{faculty.description}</p>
                  )}

                  <div className="faculty-meta">
                    {faculty.establishedYear && (
                      <div className="meta-item">
                        <span className="meta-label">Established</span>
                        <span className="meta-value">{faculty.establishedYear}</span>
                      </div>
                    )}
                    <div className="meta-item">
                      <span className="meta-label">Departments</span>
                      <span className="meta-value">{faculty.departmentCount || 0}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Courses</span>
                      <span className="meta-value">{faculty.courseCount || 0}</span>
                    </div>
                  </div>

                  {(faculty.dean || faculty.contactEmail) && (
                    <div className="faculty-contact">
                      {faculty.dean && (
                        <div className="contact-item">
                          <span className="contact-label">Dean:</span>
                          <span className="contact-value">{faculty.dean}</span>
                        </div>
                      )}
                      {faculty.contactEmail && (
                        <div className="contact-item">
                          <span className="contact-label">Email:</span>
                          <a href={`mailto:${faculty.contactEmail}`} className="contact-value">
                            {faculty.contactEmail}
                          </a>
                        </div>
                      )}
                      {faculty.phone && (
                        <div className="contact-item">
                          <span className="contact-label">Phone:</span>
                          <a href={`tel:${faculty.phone}`} className="contact-value">
                            {faculty.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="faculty-actions">
                    <button
                      className="btn-action edit"
                      onClick={() => handleEdit(faculty)}
                      disabled={isLoading}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-action delete"
                      onClick={() => handleDelete(faculty.id)}
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏛️</div>
              <h3>No Faculties Found</h3>
              <p>Get started by creating your first academic faculty</p>
              <button
                className="btn-primary"
                onClick={handleAddFaculty}
                disabled={isLoading}
                id="create-first-faculty-button"
              >
                Create First Faculty
              </button>
            </div>
          )}
        </div>

        {/* Faculty Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => !isLoading && setShowForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingFaculty ? 'Edit Faculty' : 'Create New Faculty'}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingFaculty(null);
                    resetForm();
                    setError('');
                    setSuccess('');
                  }}
                  disabled={isLoading}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit} className="faculty-form" id="faculty-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Faculty Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        placeholder="e.g., Faculty of Science & Technology"
                        disabled={isLoading}
                        id="faculty-name-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Faculty Code</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        placeholder="e.g., FST"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                      placeholder="Brief description of the faculty's mission and focus..."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Dean Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.dean}
                        onChange={(e) => setFormData({...formData, dean: e.target.value})}
                        placeholder="Full name of the dean"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Established Year</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.establishedYear}
                        onChange={(e) => setFormData({...formData, establishedYear: parseInt(e.target.value) || new Date().getFullYear()})}
                        min="1900"
                        max={new Date().getFullYear()}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Contact Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                        placeholder="faculty@university.edu"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+266 1234 5678"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Department Count</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.departmentCount}
                        onChange={(e) => setFormData({...formData, departmentCount: parseInt(e.target.value) || 0})}
                        min="0"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Course Count</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.courseCount}
                        onChange={(e) => setFormData({...formData, courseCount: parseInt(e.target.value) || 0})}
                        min="0"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      disabled={isLoading}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="planned">Planned</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingFaculty(null);
                        resetForm();
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isLoading}
                      id="submit-faculty-button"
                    >
                      {isLoading ? (
                        <>
                          <span className="loading-spinner small"></span>
                          {editingFaculty ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingFaculty ? 'Update Faculty' : 'Create Faculty'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageFaculties;
