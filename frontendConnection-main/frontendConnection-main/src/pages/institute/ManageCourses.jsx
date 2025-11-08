// ManageCourses.jsx - UPDATED TO ENSURE PROPER DATA STRUCTURE
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  addCourse,
  deleteCourse,
  getCourses,
  getFaculties,
  getInstitutionStats,
  initializeInstitutionCollections,
  updateCourse
} from '../../services/institutionServices';
import './InstitutionPages.css';

const ManageCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalEnrollments: 0,
    averageFees: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    facultyId: '',
    duration: '',
    durationUnit: 'years',
    fees: { amount: '', currency: 'M' },
    requirements: '',
    intakePeriod: '',
    maxStudents: 100,
    status: 'active',
    level: 'undergraduate',
    credits: 120,
    institutionId: user?.uid || '' // Ensure institutionId is included
  });

  // Debug user data
  useEffect(() => {
    console.log('👤 Current user in ManageCourses:', user);
    console.log('🏫 User ID (used as institution ID):', user?.uid);
  }, [user]);

  const loadData = async () => {
    const institutionId = user?.uid;

    if (!institutionId) {
      console.error('❌ No user ID found');
      setError('No user ID found. Please make sure you are properly logged in.');
      return;
    }

    console.log('📚 Loading courses and faculties for institution:', institutionId);
    setIsLoading(true);
    setError('');

    try {
      // Ensure institution collections are initialized
      console.log('🔄 Ensuring institution collections are initialized...');
      await initializeInstitutionCollections(institutionId);

      const [coursesData, facultiesData, statsData] = await Promise.all([
        getCourses(institutionId),
        getFaculties(institutionId),
        getInstitutionStats(institutionId)
      ]);

      console.log('✅ Loaded courses:', coursesData);
      console.log('✅ Loaded faculties:', facultiesData);

      // ENSURE courses have institutionId for student view
      const coursesWithInstitution = (coursesData || []).map(course => ({
        ...course,
        institutionId: institutionId, // Force include institutionId
        institutionName: user.displayName || 'Your Institution' // Include for student view
      }));

      setCourses(coursesWithInstitution);
      setFaculties(facultiesData || []);

      // Update stats
      setStats(prev => ({
        ...prev,
        totalCourses: coursesWithInstitution.length || 0,
        activeCourses: statsData?.activeCourses || 0
      }));
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setError('Failed to load courses and faculties. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const totalCourses = courses.length;
    const activeCourses = courses.filter(course => course.status === 'active').length;
    const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrolledStudents || 0), 0);
    const coursesWithFees = courses.filter(course => course.fees?.amount && parseFloat(course.fees.amount) > 0);
    const totalFees = coursesWithFees.reduce((sum, course) => sum + parseFloat(course.fees.amount), 0);
    const averageFees = coursesWithFees.length > 0 ? totalFees / coursesWithFees.length : 0;

    setStats(prev => ({
      ...prev,
      totalCourses,
      activeCourses,
      totalEnrollments,
      averageFees: Math.round(averageFees)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const institutionId = user?.uid;

    if (!institutionId) {
      setError('No user ID found. Please make sure you are properly logged in.');
      return;
    }

    // Validate faculty selection
    if (!formData.facultyId) {
      setError('Please select a faculty for this course.');
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Course name is required');
      return;
    }

    console.log('💾 Saving course data:', formData);
    console.log('🏫 For institution:', institutionId);

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Ensure institution is initialized before adding course
      console.log('🔄 Initializing institution collections...');
      await initializeInstitutionCollections(institutionId);

      // ENSURE proper data structure for student view
      const courseData = {
        ...formData,
        institutionId: institutionId, // CRITICAL: Include institutionId
        // Ensure proper fees structure
        fees: formData.fees.amount ? {
          amount: parseFloat(formData.fees.amount) || 0,
          currency: 'M'
        } : { amount: 0, currency: 'M' },
        // Ensure status is properly set
        status: formData.status || 'active'
      };

      if (editingCourse) {
        console.log('✏️ Updating course:', editingCourse.id);
        await updateCourse(institutionId, editingCourse.id, courseData);
        setSuccess('Course updated successfully!');
        console.log('✅ Course updated successfully');
      } else {
        console.log('➕ Creating new course');
        const courseId = await addCourse(institutionId, courseData);
        console.log('✅ Course created with ID:', courseId);
        setSuccess('Course created successfully!');
      }

      setShowForm(false);
      setEditingCourse(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('❌ Error saving course:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error code:', error.code);

      // Handle specific error cases
      if (error.message?.includes('No document to update') || error.code === 'not-found') {
        setError('Institution setup incomplete. Please refresh the page and try again.');
      } else if (error.message?.includes('permission-denied')) {
        setError('Permission denied. Please check your Firebase security rules.');
      } else {
        setError(error.message || 'Failed to save course. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (course) => {
    console.log('✏️ Editing course:', course);
    setEditingCourse(course);
    setFormData({
      name: course.name || '',
      code: course.code || '',
      description: course.description || '',
      facultyId: course.facultyId || '',
      duration: course.duration || '',
      durationUnit: course.durationUnit || 'years',
      fees: course.fees || { amount: '', currency: 'M' },
      requirements: course.requirements || '',
      intakePeriod: course.intakePeriod || '',
      maxStudents: course.maxStudents || 100,
      status: course.status || 'active',
      level: course.level || 'undergraduate',
      credits: course.credits || 120,
      institutionId: course.institutionId || user?.uid || ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      console.log('❌ Delete cancelled by user');
      return;
    }

    const institutionId = user?.uid;

    if (!institutionId) {
      setError('No user ID found.');
      return;
    }

    console.log('🗑️ Deleting course:', courseId);
    setIsLoading(true);
    setError('');

    try {
      await deleteCourse(institutionId, courseId);
      setSuccess('Course deleted successfully!');
      console.log('✅ Course deleted successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error deleting course:', error);
      setError(error.message || 'Failed to delete course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      facultyId: '',
      duration: '',
      durationUnit: 'years',
      fees: { amount: '', currency: 'M' },
      requirements: '',
      intakePeriod: '',
      maxStudents: 100,
      status: 'active',
      level: 'undergraduate',
      credits: 120,
      institutionId: user?.uid || ''
    });
  };

  const getFacultyName = (facultyId) => {
    if (!facultyId) return 'No Faculty Assigned';
    const faculty = faculties.find(f => f.id === facultyId);
    return faculty ? faculty.name : 'Unknown Faculty';
  };

  const getFacultyOptions = () => {
    const activeFaculties = faculties.filter(faculty => faculty.status === 'active');

    if (activeFaculties.length === 0) {
      return [<option key="none" value="" disabled>No active faculties available</option>];
    }

    return [
      <option key="select" value="">Select Faculty *</option>,
      ...activeFaculties.map(faculty => (
        <option key={faculty.id} value={faculty.id}>
          {faculty.name} {faculty.code ? `(${faculty.code})` : ''}
        </option>
      ))
    ];
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaculty = filterFaculty === 'all' || course.facultyId === filterFaculty;
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;

    return matchesSearch && matchesFaculty && matchesStatus;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'undergraduate': return '#3B82F6';
      case 'postgraduate': return '#8B5CF6';
      case 'diploma': return '#10B981';
      case 'certificate': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#EF4444';
      case 'draft': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleRetryInitialization = async () => {
    if (!user?.uid) return;

    const institutionId = user.uid;

    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Manually retrying institution initialization...');
      await initializeInstitutionCollections(institutionId);
      await loadData();
      setSuccess('Institution initialized successfully!');
    } catch (error) {
      console.error('❌ Retry failed:', error);
      setError('Failed to initialize institution. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user?.uid) {
      console.log('🔄 User changed, loading data...');
      loadData();
    }
  }, [user]);

  // Calculate statistics when courses change
  useEffect(() => {
    calculateStats();
  }, [courses]);

  return (
    <div className="institution-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Manage Courses</h1>
          <p className="page-subtitle">
            Create and manage academic programs, set requirements, and track course performance
          </p>
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
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>{stats.totalCourses}</h3>
              <p>Total Courses</p>
              <span className="stat-change positive">{stats.activeCourses} active</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍🎓</div>
            <div className="stat-content">
              <h3>{stats.totalEnrollments}</h3>
              <p>Total Enrollments</p>
              <span className="stat-change">Across all programs</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>M{stats.averageFees}</h3>
              <p>Average Fees</p>
              <span className="stat-change">Per program</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏛️</div>
            <div className="stat-content">
              <h3>{faculties.length}</h3>
              <p>Total Faculties</p>
              <span className="stat-change">
                {faculties.filter(f => f.status === 'active').length} active
              </span>
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
                  placeholder="Search courses by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ width: '300px' }}
                />
              </div>
              <div className="filter-controls">
                <select
                  value={filterFaculty}
                  onChange={(e) => setFilterFaculty(e.target.value)}
                  className="form-select"
                  style={{ width: '220px' }}
                  disabled={faculties.length === 0}
                >
                  <option value="all">All Faculties</option>
                  {faculties.map(faculty => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-select"
                  style={{ width: '150px' }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowForm(true);
                    setEditingCourse(null);
                    resetForm();
                    setError('');
                    setSuccess('');
                  }}
                  disabled={isLoading || faculties.length === 0}
                >
                  <span>+</span> Add New Course
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid View */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Academic Programs</h2>
            <span className="text-muted">
              {filteredCourses.length} of {courses.length} courses found
              {filterFaculty !== 'all' && ` in ${getFacultyName(filterFaculty)}`}
            </span>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading courses...</p>
            </div>
          ) : faculties.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏛️</div>
              <h3>No Faculties Available</h3>
              <p>You need to create at least one faculty before adding courses.</p>
              <button
                className="btn-primary"
                onClick={() => window.location.href = '/institution/faculties'}
              >
                Manage Faculties
              </button>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="courses-grid-enhanced">
              {filteredCourses.map((course) => (
                <div key={course.id} className="course-card-enhanced">
                  <div className="course-card-header">
                    <div className="course-badge">
                      <div
                        className="course-level"
                        style={{ backgroundColor: getLevelColor(course.level) }}
                        title={course.level}
                      >
                        {course.level?.charAt(0).toUpperCase()}
                      </div>
                      <div className="course-title">
                        <h3>{course.name}</h3>
                        {course.code && <span className="course-code">{course.code}</span>}
                      </div>
                    </div>
                    <div
                      className="course-status"
                      style={{ backgroundColor: getStatusColor(course.status) }}
                    >
                      {course.status}
                    </div>
                  </div>

                  {course.description && (
                    <p className="course-description">{course.description}</p>
                  )}

                  <div className="course-meta">
                    <div className="meta-item">
                      <span className="meta-label">Faculty</span>
                      <span className="meta-value faculty-name">
                        {getFacultyName(course.facultyId)}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Duration</span>
                      <span className="meta-value">
                        {course.duration} {course.durationUnit}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Credits</span>
                      <span className="meta-value">{course.credits || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="course-details">
                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="detail-label">Fees</span>
                        <span className="detail-value">
                          M{course.fees?.amount || '0'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Level</span>
                        <span
                          className="detail-value level-badge"
                          style={{ backgroundColor: getLevelColor(course.level) }}
                        >
                          {course.level}
                        </span>
                      </div>
                    </div>
                    {course.intakePeriod && (
                      <div className="detail-item full-width">
                        <span className="detail-label">Next Intake</span>
                        <span className="detail-value">{course.intakePeriod}</span>
                      </div>
                    )}
                    {course.requirements && (
                      <div className="detail-item full-width">
                        <span className="detail-label">Requirements</span>
                        <span className="detail-value truncated" title={course.requirements}>
                          {course.requirements}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="course-stats">
                    <div className="stat">
                      <span className="stat-value">{course.enrolledStudents || 0}</span>
                      <span className="stat-label">Enrolled</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{course.maxStudents || 100}</span>
                      <span className="stat-label">Capacity</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">
                        {course.enrolledStudents && course.maxStudents
                          ? Math.round((course.enrolledStudents / course.maxStudents) * 100)
                          : 0}%
                      </span>
                      <span className="stat-label">Fill Rate</span>
                    </div>
                  </div>

                  <div className="course-actions">
                    <button
                      className="btn-action edit"
                      onClick={() => handleEdit(course)}
                      disabled={isLoading}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-action delete"
                      onClick={() => handleDelete(course.id)}
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
              <div className="empty-state-icon">📚</div>
              <h3>No Courses Found</h3>
              <p>
                {searchTerm || filterFaculty !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by creating your first academic program'
                }
              </p>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowForm(true);
                  setEditingCourse(null);
                  resetForm();
                }}
                disabled={isLoading || faculties.length === 0}
              >
                Create First Course
              </button>
            </div>
          )}
        </div>

        {/* Course Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => !isLoading && setShowForm(false)}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCourse(null);
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
                <form onSubmit={handleSubmit} className="course-form">
                  <div className="form-section">
                    <h3 className="form-section-title">Basic Information</h3>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Course Name *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                          placeholder="e.g., Bachelor of Computer Science"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Course Code</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.code}
                          onChange={(e) => setFormData({...formData, code: e.target.value})}
                          placeholder="e.g., BSC-CS"
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
                        placeholder="Detailed description of the course program, learning outcomes, and career prospects..."
                        disabled={isLoading}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Faculty *</label>
                        <select
                          className="form-select"
                          value={formData.facultyId}
                          onChange={(e) => setFormData({...formData, facultyId: e.target.value})}
                          required
                          disabled={isLoading || faculties.length === 0}
                        >
                          {getFacultyOptions()}
                        </select>
                        {faculties.length === 0 && (
                          <small className="form-hint error">
                            No active faculties available. Please create a faculty first.
                          </small>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Academic Level</label>
                        <select
                          className="form-select"
                          value={formData.level}
                          onChange={(e) => setFormData({...formData, level: e.target.value})}
                          disabled={isLoading}
                        >
                          <option value="undergraduate">Undergraduate</option>
                          <option value="postgraduate">Postgraduate</option>
                          <option value="diploma">Diploma</option>
                          <option value="certificate">Certificate</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="form-section-title">Program Details</h3>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Duration</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.duration}
                          onChange={(e) => setFormData({...formData, duration: e.target.value})}
                          placeholder="e.g., 4"
                          min="1"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Duration Unit</label>
                        <select
                          className="form-select"
                          value={formData.durationUnit}
                          onChange={(e) => setFormData({...formData, durationUnit: e.target.value})}
                          disabled={isLoading}
                        >
                          <option value="years">Years</option>
                          <option value="months">Months</option>
                          <option value="semesters">Semesters</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Credits</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.credits}
                          onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value) || 0})}
                          min="0"
                          placeholder="Total credit hours"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fees Amount (M)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.fees.amount}
                          onChange={(e) => setFormData({
                            ...formData,
                            fees: {...formData.fees, amount: e.target.value}
                          })}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Max Students</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.maxStudents}
                          onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value) || 0})}
                          min="1"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Intake Period</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.intakePeriod}
                          onChange={(e) => setFormData({...formData, intakePeriod: e.target.value})}
                          placeholder="e.g., January 2024"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="form-section-title">Additional Information</h3>

                    <div className="form-group">
                      <label className="form-label">Entry Requirements</label>
                      <textarea
                        className="form-textarea"
                        value={formData.requirements}
                        onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                        rows="3"
                        placeholder="List the entry requirements for this course (academic qualifications, prerequisites, etc.)..."
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
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCourse(null);
                        resetForm();
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isLoading || faculties.length === 0}
                    >
                      {isLoading ? (
                        <>
                          <span className="loading-spinner small"></span>
                          {editingCourse ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingCourse ? 'Update Course' : 'Create Course'
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

export default ManageCourses;
