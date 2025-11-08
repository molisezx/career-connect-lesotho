import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  deleteAdmission,
  getAdmissions,
  getCourses,
  getInstitutionStats,
  publishAdmission,
  updateAdmission
} from '../../services/institutionServices';
import './InstitutionPages.css';

const PublishAdmissions = () => {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    closed: 0,
    totalApplications: 0
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    intakePeriod: '',
    deadline: '',
    requirements: '',
    availablePrograms: [],
    status: 'published',
    fee: '',
    applicationFee: '',
    minQualifications: '',
    selectionCriteria: '',
    importantDates: [],
    contactInfo: {
      email: '',
      phone: '',
      person: ''
    }
  });

  // Define loadData first
  const loadData = async () => {
    if (!user?.institutionId) return;

    setIsLoading(true);
    setError('');
    try {
      const [admissionsData, coursesData, statsData] = await Promise.all([
        getAdmissions(user.institutionId),
        getCourses(user.institutionId),
        getInstitutionStats(user.institutionId)
      ]);
      setAdmissions(admissionsData);
      setCourses(coursesData);
      setStats(prev => ({
        ...prev,
        totalApplications: statsData.pendingApplications || 0
      }));
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load admissions data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const total = admissions.length;
    const published = admissions.filter(ad => ad.status === 'published').length;
    const draft = admissions.filter(ad => ad.status === 'draft').length;
    const closed = admissions.filter(ad => ad.status === 'closed').length;
    const totalApplications = admissions.reduce((sum, ad) => sum + (ad.applicationCount || 0), 0);

    setStats({ total, published, draft, closed, totalApplications });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.institutionId) return;

    // Validate form
    if (!formData.title.trim()) {
      setError('Admission title is required');
      return;
    }

    if (!formData.deadline) {
      setError('Application deadline is required');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const admissionData = {
        ...formData,
        deadline: new Date(formData.deadline),
        applicationCount: 0,
        institutionId: user.institutionId
      };

      if (editingAdmission) {
        await updateAdmission(user.institutionId, editingAdmission.id, admissionData);
        setSuccess('Admission updated successfully!');
      } else {
        await publishAdmission(user.institutionId, admissionData);
        setSuccess('Admission published successfully!');
      }

      setShowForm(false);
      setEditingAdmission(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving admission:', error);
      setError(error.message || 'Failed to save admission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (admission) => {
    setEditingAdmission(admission);
    setFormData({
      title: admission.title || '',
      description: admission.description || '',
      intakePeriod: admission.intakePeriod || '',
      deadline: admission.deadline ? formatDateForInput(admission.deadline) : '',
      requirements: admission.requirements || '',
      availablePrograms: admission.availablePrograms || [],
      status: admission.status || 'published',
      fee: admission.fee || '',
      applicationFee: admission.applicationFee || '',
      minQualifications: admission.minQualifications || '',
      selectionCriteria: admission.selectionCriteria || '',
      importantDates: admission.importantDates || [],
      contactInfo: admission.contactInfo || { email: '', phone: '', person: '' }
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (admissionId) => {
    if (!window.confirm('Are you sure you want to delete this admission? This action cannot be undone.')) return;

    setIsLoading(true);
    setError('');

    try {
      await deleteAdmission(user.institutionId, admissionId);
      setSuccess('Admission deleted successfully!');
      await loadData();
    } catch (error) {
      console.error('Error deleting admission:', error);
      setError(error.message || 'Failed to delete admission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateAdmission = async (admission) => {
    setIsLoading(true);
    setError('');

    try {
      const duplicateData = {
        ...admission,
        title: `${admission.title} (Copy)`,
        status: 'draft',
        applicationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Remove id and Firebase-specific fields
      delete duplicateData.id;
      delete duplicateData.createdAt;
      delete duplicateData.updatedAt;

      await publishAdmission(user.institutionId, duplicateData);
      setSuccess('Admission duplicated successfully!');
      await loadData();
    } catch (error) {
      console.error('Error duplicating admission:', error);
      setError(error.message || 'Failed to duplicate admission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const viewAdmissionDetails = (admission) => {
    setSelectedAdmission(admission);
    setShowDetailModal(true);
  };

  const closeAdmission = async (admissionId) => {
    if (!window.confirm('Are you sure you want to close this admission? This will prevent new applications.')) return;

    setIsLoading(true);
    setError('');

    try {
      await updateAdmission(user.institutionId, admissionId, { status: 'closed' });
      setSuccess('Admission closed successfully!');
      await loadData();
    } catch (error) {
      console.error('Error closing admission:', error);
      setError(error.message || 'Failed to close admission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const reopenAdmission = async (admissionId) => {
    setIsLoading(true);
    setError('');

    try {
      await updateAdmission(user.institutionId, admissionId, { status: 'published' });
      setSuccess('Admission reopened successfully!');
      await loadData();
    } catch (error) {
      console.error('Error reopening admission:', error);
      setError(error.message || 'Failed to reopen admission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      intakePeriod: '',
      deadline: '',
      requirements: '',
      availablePrograms: [],
      status: 'published',
      fee: '',
      applicationFee: '',
      minQualifications: '',
      selectionCriteria: '',
      importantDates: [],
      contactInfo: {
        email: '',
        phone: '',
        person: ''
      }
    });
  };

  const addImportantDate = () => {
    setFormData(prev => ({
      ...prev,
      importantDates: [...prev.importantDates, { title: '', date: '' }]
    }));
  };

  const updateImportantDate = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      importantDates: prev.importantDates.map((date, i) =>
        i === index ? { ...date, [field]: value } : date
      )
    }));
  };

  const removeImportantDate = (index) => {
    setFormData(prev => ({
      ...prev,
      importantDates: prev.importantDates.filter((_, i) => i !== index)
    }));
  };

  const toggleProgramSelection = (programId) => {
    setFormData(prev => ({
      ...prev,
      availablePrograms: prev.availablePrograms.includes(programId)
        ? prev.availablePrograms.filter(id => id !== programId)
        : [...prev.availablePrograms, programId]
    }));
  };

  // Safe date conversion
  const safeDateConvert = (firebaseDate) => {
    if (!firebaseDate) return null;
    if (firebaseDate.toDate && typeof firebaseDate.toDate === 'function') {
      return firebaseDate.toDate();
    }
    if (firebaseDate instanceof Date) {
      return firebaseDate;
    }
    if (typeof firebaseDate === 'string') {
      return new Date(firebaseDate);
    }
    return null;
  };

  const formatDateForInput = (date) => {
    const convertedDate = safeDateConvert(date);
    if (!convertedDate) return '';
    return convertedDate.toISOString().split('T')[0];
  };

  const safeDateDisplay = (date) => {
    const convertedDate = safeDateConvert(date);
    if (!convertedDate) return 'N/A';
    return convertedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#10B981';
      case 'draft': return '#F59E0B';
      case 'closed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const deadlineDate = safeDateConvert(deadline);
    if (!deadlineDate) return null;

    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgramName = (programId) => {
    const program = courses.find(c => c.id === programId);
    return program ? program.name : 'Unknown Program';
  };

  const filteredAdmissions = admissions.filter(admission => {
    const matchesSearch = admission.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admission.intakePeriod?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || admission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Use effects after function definitions
  useEffect(() => {
    if (user?.institutionId) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [admissions]);

  return (
    <div className="institution-page">
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1 className="page-title">Admissions Management</h1>
            <p className="page-subtitle">
              Create and manage admission cycles, set deadlines, and track applications
            </p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Messages */}
        {error && (
          <div className="message error">
            {error}
            <button onClick={() => setError('')} className="close-message">×</button>
          </div>
        )}
        {success && (
          <div className="message success">
            {success}
            <button onClick={() => setSuccess('')} className="close-message">×</button>
          </div>
        )}

        {/* Statistics Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Admissions</p>
              <span className="stat-change">All time</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📢</div>
            <div className="stat-content">
              <h3>{stats.published}</h3>
              <p>Active Admissions</p>
              <span className="stat-change positive">Accepting applications</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>{stats.totalApplications}</h3>
              <p>Total Applications</p>
              <span className="stat-change">Across all cycles</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{admissions.filter(ad => getDaysUntilDeadline(ad.deadline) > 0 && getDaysUntilDeadline(ad.deadline) <= 7).length}</h3>
              <p>Deadlines Soon</p>
              <span className="stat-change warning">Within 7 days</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="card">
          <div className="card-header">
            <div className="header-actions">
              <div className="search-controls">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search admissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ width: '300px' }}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                  style={{ width: '200px' }}
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="filter-controls">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowForm(true);
                    setEditingAdmission(null);
                    resetForm();
                    setError('');
                    setSuccess('');
                  }}
                  disabled={isLoading}
                >
                  <span>+</span> Create New Admission
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Admissions Grid */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Admission Cycles</h2>
            <span className="text-muted">
              {filteredAdmissions.length} of {admissions.length} admission cycles
              {statusFilter !== 'all' && ` (${statusFilter})`}
            </span>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading admissions...</p>
            </div>
          ) : filteredAdmissions.length > 0 ? (
            <div className="admissions-grid-enhanced">
              {filteredAdmissions.map((admission) => {
                const daysUntilDeadline = getDaysUntilDeadline(admission.deadline);
                return (
                  <div key={admission.id} className="admission-card-enhanced">
                    <div className="admission-header-enhanced">
                      <div className="admission-title-section">
                        <h3>{admission.title}</h3>
                        <div
                          className="admission-status-badge"
                          style={{ backgroundColor: getStatusColor(admission.status) }}
                        >
                          {admission.status?.toUpperCase()}
                        </div>
                      </div>
                      {daysUntilDeadline !== null && daysUntilDeadline >= 0 && (
                        <div className={`deadline-countdown ${daysUntilDeadline <= 7 ? 'urgent' : ''}`}>
                          <span className="countdown-number">{daysUntilDeadline}</span>
                          <span className="countdown-label">days left</span>
                        </div>
                      )}
                      {daysUntilDeadline !== null && daysUntilDeadline < 0 && (
                        <div className="deadline-passed">
                          Deadline passed
                        </div>
                      )}
                    </div>

                    <div className="admission-content-enhanced">
                      <p className="admission-description">{admission.description}</p>

                      <div className="admission-meta-grid">
                        <div className="meta-item">
                          <span className="meta-icon">📅</span>
                          <div className="meta-content">
                            <label>Intake Period</label>
                            <span>{admission.intakePeriod}</span>
                          </div>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">⏰</span>
                          <div className="meta-content">
                            <label>Application Deadline</label>
                            <span>{safeDateDisplay(admission.deadline)}</span>
                          </div>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">📋</span>
                          <div className="meta-content">
                            <label>Applications Received</label>
                            <span className="application-count">{admission.applicationCount || 0}</span>
                          </div>
                        </div>
                        {admission.fee && (
                          <div className="meta-item">
                            <span className="meta-icon">💰</span>
                            <div className="meta-content">
                              <label>Program Fee</label>
                              <span>M{admission.fee}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {admission.availablePrograms && admission.availablePrograms.length > 0 && (
                        <div className="programs-section">
                          <h4>Available Programs ({admission.availablePrograms.length})</h4>
                          <div className="programs-tags">
                            {admission.availablePrograms.slice(0, 3).map(programId => (
                              <span key={programId} className="program-tag">
                                {getProgramName(programId)}
                              </span>
                            ))}
                            {admission.availablePrograms.length > 3 && (
                              <span className="program-tag-more">
                                +{admission.availablePrograms.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="admission-actions-enhanced">
                      <button
                        className="btn-action view-details"
                        onClick={() => viewAdmissionDetails(admission)}
                        disabled={isLoading}
                      >
                        View Details
                      </button>
                      <button
                        className="btn-action edit"
                        onClick={() => handleEdit(admission)}
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      {admission.status === 'published' && (
                        <button
                          className="btn-action close"
                          onClick={() => closeAdmission(admission.id)}
                          disabled={isLoading}
                        >
                          Close
                        </button>
                      )}
                      {admission.status === 'closed' && (
                        <button
                          className="btn-action reopen"
                          onClick={() => reopenAdmission(admission.id)}
                          disabled={isLoading}
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        className="btn-action duplicate"
                        onClick={() => duplicateAdmission(admission)}
                        disabled={isLoading}
                      >
                        Duplicate
                      </button>
                      <button
                        className="btn-action delete"
                        onClick={() => handleDelete(admission.id)}
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🎓</div>
              <h3>No Admission Cycles Found</h3>
              <p>
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first admission cycle to accept student applications.'
                }
              </p>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowForm(true);
                  setEditingAdmission(null);
                  resetForm();
                }}
                disabled={isLoading}
              >
                Create First Admission
              </button>
            </div>
          )}
        </div>

        {/* Admission Form Modal */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content x-large">
              <div className="modal-header">
                <h2>{editingAdmission ? 'Edit Admission' : 'Create New Admission'}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAdmission(null);
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
                <form onSubmit={handleSubmit} className="admission-form-enhanced">
                  <div className="form-section">
                    <h3>Basic Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Admission Title *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="e.g., 2024 January Intake - Undergraduate Programs"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          disabled={isLoading}
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-textarea"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows="3"
                        placeholder="Provide a comprehensive description of this admission cycle..."
                        disabled={isLoading}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Intake Period *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.intakePeriod}
                          onChange={(e) => setFormData({...formData, intakePeriod: e.target.value})}
                          placeholder="e.g., January 2024"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Application Deadline *</label>
                        <input
                          type="date"
                          className="form-input"
                          value={formData.deadline}
                          onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                          required
                          disabled={isLoading}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Programs & Fees</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Program Fee (M)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.fee}
                          onChange={(e) => setFormData({...formData, fee: e.target.value})}
                          placeholder="Annual program fee"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Application Fee (M)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.applicationFee}
                          onChange={(e) => setFormData({...formData, applicationFee: e.target.value})}
                          placeholder="Application processing fee"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Available Programs</label>
                      <div className="programs-selection">
                        {courses.length > 0 ? (
                          courses.map(course => (
                            <label key={course.id} className="program-checkbox">
                              <input
                                type="checkbox"
                                checked={formData.availablePrograms.includes(course.id)}
                                onChange={() => toggleProgramSelection(course.id)}
                                disabled={isLoading}
                              />
                              <span className="checkmark"></span>
                              {course.name}
                            </label>
                          ))
                        ) : (
                          <p className="text-muted">No courses available. Create courses first.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Requirements & Criteria</h3>
                    <div className="form-group">
                      <label className="form-label">Minimum Qualifications</label>
                      <textarea
                        className="form-textarea"
                        value={formData.minQualifications}
                        onChange={(e) => setFormData({...formData, minQualifications: e.target.value})}
                        rows="3"
                        placeholder="List the minimum academic qualifications required..."
                        disabled={isLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Selection Criteria</label>
                      <textarea
                        className="form-textarea"
                        value={formData.selectionCriteria}
                        onChange={(e) => setFormData({...formData, selectionCriteria: e.target.value})}
                        rows="3"
                        placeholder="Describe the selection process and criteria..."
                        disabled={isLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Additional Requirements</label>
                      <textarea
                        className="form-textarea"
                        value={formData.requirements}
                        onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                        rows="3"
                        placeholder="Any additional requirements or documents needed..."
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Important Dates</h3>
                    {formData.importantDates.map((date, index) => (
                      <div key={index} className="important-date-row">
                        <input
                          type="text"
                          className="form-input"
                          value={date.title}
                          onChange={(e) => updateImportantDate(index, 'title', e.target.value)}
                          placeholder="Event title"
                          disabled={isLoading}
                        />
                        <input
                          type="date"
                          className="form-input"
                          value={date.date}
                          onChange={(e) => updateImportantDate(index, 'date', e.target.value)}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="btn-danger small"
                          onClick={() => removeImportantDate(index)}
                          disabled={isLoading}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={addImportantDate}
                      disabled={isLoading}
                    >
                      + Add Important Date
                    </button>
                  </div>

                  <div className="form-section">
                    <h3>Contact Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Contact Person</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.contactInfo.person}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactInfo: {...formData.contactInfo, person: e.target.value}
                          })}
                          placeholder="Admissions officer name"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Contact Email</label>
                        <input
                          type="email"
                          className="form-input"
                          value={formData.contactInfo.email}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactInfo: {...formData.contactInfo, email: e.target.value}
                          })}
                          placeholder="admissions@institution.edu"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Phone</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.contactInfo.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          contactInfo: {...formData.contactInfo, phone: e.target.value}
                        })}
                        placeholder="+266 1234 5678"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingAdmission(null);
                        resetForm();
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="loading-spinner small"></span>
                          {editingAdmission ? 'Updating...' : 'Publishing...'}
                        </>
                      ) : (
                        editingAdmission ? 'Update Admission' : 'Publish Admission'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Admission Detail Modal */}
        {showDetailModal && selectedAdmission && (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h2>Admission Details</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowDetailModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="admission-detail-view">
                  <div className="detail-header">
                    <h2>{selectedAdmission.title}</h2>
                    <div
                      className="admission-status-large"
                      style={{ backgroundColor: getStatusColor(selectedAdmission.status) }}
                    >
                      {selectedAdmission.status?.toUpperCase()}
                    </div>
                  </div>

                  <div className="detail-content">
                    <div className="detail-section">
                      <h3>Overview</h3>
                      <p>{selectedAdmission.description}</p>
                    </div>

                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Intake Period</label>
                        <span>{selectedAdmission.intakePeriod}</span>
                      </div>
                      <div className="detail-item">
                        <label>Application Deadline</label>
                        <span>{safeDateDisplay(selectedAdmission.deadline)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Applications Received</label>
                        <span className="highlight">{selectedAdmission.applicationCount || 0}</span>
                      </div>
                      <div className="detail-item">
                        <label>Status</label>
                        <span>{selectedAdmission.status}</span>
                      </div>
                      {selectedAdmission.fee && (
                        <div className="detail-item">
                          <label>Program Fee</label>
                          <span>M{selectedAdmission.fee}</span>
                        </div>
                      )}
                      {selectedAdmission.applicationFee && (
                        <div className="detail-item">
                          <label>Application Fee</label>
                          <span>M{selectedAdmission.applicationFee}</span>
                        </div>
                      )}
                    </div>

                    {selectedAdmission.availablePrograms && selectedAdmission.availablePrograms.length > 0 && (
                      <div className="detail-section">
                        <h3>Available Programs ({selectedAdmission.availablePrograms.length})</h3>
                        <div className="programs-list">
                          {selectedAdmission.availablePrograms.map(programId => (
                            <div key={programId} className="program-item">
                              {getProgramName(programId)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedAdmission.requirements && (
                      <div className="detail-section">
                        <h3>Requirements</h3>
                        <p>{selectedAdmission.requirements}</p>
                      </div>
                    )}

                    <div className="modal-actions">
                      <button className="btn-outline">View Applications</button>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          handleEdit(selectedAdmission);
                          setShowDetailModal(false);
                        }}
                      >
                        Edit Admission
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishAdmissions;
