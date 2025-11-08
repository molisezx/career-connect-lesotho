import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllApplications,
  getCourses,
  getFaculties,
  getInstitutionStats,
  updateApplicationStatus
} from '../../services/institutionServices';
import './InstitutionPages.css';

const ReviewApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [facultyFilter, setFacultyFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0
  });
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [notes, setNotes] = useState('');

  // Load data function defined first
  const loadData = async () => {
    if (!user?.institutionId) return;

    setIsLoading(true);
    try {
      const [applicationsData, coursesData, facultiesData] = await Promise.all([
        getAllApplications(user.institutionId),
        getCourses(user.institutionId),
        getFaculties(user.institutionId),
        getInstitutionStats(user.institutionId)
      ]);

      setApplications(applicationsData);
      setCourses(coursesData);
      setFaculties(facultiesData);
      setStats(prev => ({
        ...prev,
        total: applicationsData.length,
        pending: applicationsData.filter(app => app.status === 'pending').length,
        approved: applicationsData.filter(app => app.status === 'approved').length,
        rejected: applicationsData.filter(app => app.status === 'rejected').length
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use effect after function definition
  useEffect(() => {
    if (user?.institutionId) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const calculateStats = () => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'pending').length;
    const reviewed = applications.filter(app => app.status === 'reviewed').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;

    setStats({ total, pending, reviewed, approved, rejected });
  };

  const handleStatusUpdate = async (applicationId, status, customNotes = '') => {
    try {
      const result = await updateApplicationStatus(applicationId, status, user.institutionId, customNotes || notes);

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? {
                ...app,
                status,
                reviewedAt: new Date(),
                reviewNotes: customNotes || notes || app.reviewNotes,
                reviewedBy: user.institutionId
              }
            : app
        )
      );

      setNotes('');
      calculateStats();

      if (result.autoRejectedCount > 0) {
        alert(`${result.message}`);
      } else {
        alert(`Application ${status} successfully!`);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedApplications.size === 0) {
      alert('Please select at least one application');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedApplications.size} application(s)?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const promises = Array.from(selectedApplications).map(appId =>
        updateApplicationStatus(appId, action, user.institutionId, `Bulk ${action} action`)
      );

      await Promise.all(promises);

      // Reload data to get updated application statuses
      await loadData();
      setSelectedApplications(new Set());
      setShowBulkActions(false);
      alert(`Successfully ${action}ed ${selectedApplications.size} application(s)`);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Error performing bulk action. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleApplicationSelection = (applicationId) => {
    const newSelection = new Set(selectedApplications);
    if (newSelection.has(applicationId)) {
      newSelection.delete(applicationId);
    } else {
      newSelection.add(applicationId);
    }
    setSelectedApplications(newSelection);
  };

  const selectAllApplications = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)));
    }
  };

  const viewApplicationDetails = (application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : 'Unknown Course';
  };

  const getFacultyName = (facultyId) => {
    const faculty = faculties.find(f => f.id === facultyId);
    return faculty ? faculty.name : 'Unknown Faculty';
  };

  const getFacultyByCourse = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? getFacultyName(course.facultyId) : 'Unknown Faculty';
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCourseName(app.courseId)?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesCourse = courseFilter === 'all' || app.courseId === courseFilter;
    const matchesFaculty = facultyFilter === 'all' || getFacultyByCourse(app.courseId) === facultyFilter;

    // Date filtering
    const matchesDate = (() => {
      if (dateFilter === 'all') return true;
      const appDate = safeDateConvert(app.createdAt);
      const now = new Date();
      const timeDiff = now - appDate;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      switch (dateFilter) {
        case 'today': return daysDiff < 1;
        case 'week': return daysDiff < 7;
        case 'month': return daysDiff < 30;
        default: return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesCourse && matchesFaculty && matchesDate;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const dateA = safeDateConvert(a.createdAt) || new Date(0);
    const dateB = safeDateConvert(b.createdAt) || new Date(0);

    switch (sortBy) {
      case 'newest':
        return new Date(dateB) - new Date(dateA);
      case 'oldest':
        return new Date(dateA) - new Date(dateB);
      case 'name':
        return (a.studentName || '').localeCompare(b.studentName || '');
      case 'course':
        return getCourseName(a.courseId).localeCompare(getCourseName(b.courseId));
      case 'status':
        return (a.status || '').localeCompare(b.status || '');
      default:
        return 0;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'reviewed': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'reviewed': return '👁️';
      default: return '📄';
    }
  };

  const getPriorityLevel = (application) => {
    const applicationDate = safeDateConvert(application.createdAt) || new Date();
    const daysSinceApplication = Math.floor((new Date() - new Date(applicationDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceApplication > 14) return { level: 'high', label: 'High Priority', color: '#EF4444' };
    if (daysSinceApplication > 7) return { level: 'medium', label: 'Medium Priority', color: '#F59E0B' };
    return { level: 'low', label: 'Low Priority', color: '#10B981' };
  };

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

  const safeDateDisplay = (date) => {
    const convertedDate = safeDateConvert(date);
    if (!convertedDate) return 'N/A';
    try {
      return convertedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const sendMessageToApplicant = (application) => {
    const subject = `Update on Your Application - ${getCourseName(application.courseId)}`;
    const body = `Dear ${application.studentName},\n\nRegarding your application for ${getCourseName(application.courseId)}...`;
    window.open(`mailto:${application.studentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const ApplicationCard = ({ application }) => {
    const priority = getPriorityLevel(application);
    const courseName = getCourseName(application.courseId);
    const facultyName = getFacultyByCourse(application.courseId);

    return (
      <div className={`application-card-enhanced ${priority.level}-priority`}>
        <div className="application-header-enhanced">
          <div className="applicant-info-enhanced">
            <div className="selection-checkbox">
              <input
                type="checkbox"
                checked={selectedApplications.has(application.id)}
                onChange={() => toggleApplicationSelection(application.id)}
              />
            </div>
            <div
              className="applicant-avatar"
              style={{ backgroundColor: getStatusColor(application.status) }}
            >
              {application.studentName?.charAt(0) || 'A'}
            </div>
            <div className="applicant-details">
              <h3>{application.studentName || 'Applicant'}</h3>
              <p className="applicant-email">{application.studentEmail || 'No email'}</p>
              <div className="applicant-meta">
                <span className="application-date">
                  Applied: {safeDateDisplay(application.createdAt)}
                </span>
                {application.reviewedAt && (
                  <span className="review-date">
                    Reviewed: {safeDateDisplay(application.reviewedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="application-meta-enhanced">
            <div className={`priority-badge ${priority.level}`}>
              {priority.label}
            </div>
            <div
              className="status-badge"
              style={{ backgroundColor: getStatusColor(application.status) }}
            >
              <span className="status-icon">{getStatusIcon(application.status)}</span>
              {application.status.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="application-body-enhanced">
          <div className="course-info">
            <h4>{courseName}</h4>
            <p className="faculty-name">{facultyName}</p>
          </div>

          {application.reviewNotes && (
            <div className="review-notes">
              <strong>Review Notes:</strong>
              <p>{application.reviewNotes}</p>
            </div>
          )}

          <div className="application-stats">
            <div className="stat">
              <span className="stat-label">Days Waiting</span>
              <span className="stat-value">
                {Math.floor((new Date() - safeDateConvert(application.createdAt)) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Faculty</span>
              <span className="stat-value">{facultyName}</span>
            </div>
          </div>
        </div>

        <div className="application-actions-enhanced">
          {application.status === 'pending' && (
            <>
              <button
                className="btn-action accept"
                onClick={() => handleStatusUpdate(application.id, 'approved')}
                disabled={isLoading}
              >
                ✅ Approve
              </button>
              <button
                className="btn-action reject"
                onClick={() => handleStatusUpdate(application.id, 'rejected')}
                disabled={isLoading}
              >
                ❌ Reject
              </button>
              <button
                className="btn-action review"
                onClick={() => handleStatusUpdate(application.id, 'reviewed')}
                disabled={isLoading}
              >
                👁️ Mark Reviewed
              </button>
            </>
          )}
          <button
            className="btn-action view"
            onClick={() => viewApplicationDetails(application)}
          >
            📋 View Details
          </button>
          <button
            className="btn-action message"
            onClick={() => sendMessageToApplicant(application)}
          >
            ✉️ Message
          </button>
        </div>
      </div>
    );
  };

  const ApplicationTableView = () => (
    <div className="applications-table">
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                onChange={selectAllApplications}
              />
            </th>
            <th>Applicant</th>
            <th>Course</th>
            <th>Faculty</th>
            <th>Applied</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedApplications.map((application) => {
            const priority = getPriorityLevel(application);
            return (
              <tr key={application.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedApplications.has(application.id)}
                    onChange={() => toggleApplicationSelection(application.id)}
                  />
                </td>
                <td>
                  <div className="applicant-cell">
                    <div
                      className="applicant-avatar small"
                      style={{ backgroundColor: getStatusColor(application.status) }}
                    >
                      {application.studentName?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <div className="applicant-name">{application.studentName}</div>
                      <div className="applicant-email">{application.studentEmail}</div>
                    </div>
                  </div>
                </td>
                <td>{getCourseName(application.courseId)}</td>
                <td>{getFacultyByCourse(application.courseId)}</td>
                <td>{safeDateDisplay(application.createdAt)}</td>
                <td>
                  <span
                    className="status-badge small"
                    style={{ backgroundColor: getStatusColor(application.status) }}
                  >
                    {application.status}
                  </span>
                </td>
                <td>
                  <span className={`priority-dot ${priority.level}`}></span>
                  {priority.label}
                </td>
                <td>
                  <div className="table-actions">
                    {application.status === 'pending' && (
                      <>
                        <button
                          className="btn-action small success"
                          onClick={() => handleStatusUpdate(application.id, 'approved')}
                          title="Approve"
                        >
                          ✅
                        </button>
                        <button
                          className="btn-action small danger"
                          onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          title="Reject"
                        >
                          ❌
                        </button>
                      </>
                    )}
                    <button
                      className="btn-action small"
                      onClick={() => viewApplicationDetails(application)}
                      title="View Details"
                    >
                      👁️
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="institution-page">
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1 className="page-title">Review Applications</h1>
            <p className="page-subtitle">
              Manage student applications, review documents, and make admission decisions
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn-primary"
              onClick={() => setShowBulkActions(!showBulkActions)}
              disabled={selectedApplications.size === 0}
            >
              Bulk Actions ({selectedApplications.size})
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Bulk Actions Panel */}
        {showBulkActions && (
          <div className="bulk-actions-panel">
            <h3>Bulk Actions</h3>
            <p>Apply actions to {selectedApplications.size} selected applications</p>
            <div className="bulk-action-buttons">
              <button
                className="btn-success"
                onClick={() => handleBulkAction('approved')}
                disabled={isLoading}
              >
                ✅ Approve Selected
              </button>
              <button
                className="btn-danger"
                onClick={() => handleBulkAction('rejected')}
                disabled={isLoading}
              >
                ❌ Reject Selected
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowBulkActions(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Statistics Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Applications</p>
              <span className="stat-change">This academic year</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending Review</p>
              <span className="stat-change warning">Require attention</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.approved}</h3>
              <p>Approved</p>
              <span className="stat-change positive">
                {Math.round((stats.approved / stats.total) * 100) || 0}% acceptance rate
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.pending > 0 ? Math.round(stats.pending / 5) : 0}</h3>
              <p>Estimated Review Time</p>
              <span className="stat-change">{stats.pending > 0 ? `${Math.round(stats.pending / 5)} days` : 'All caught up'}</span>
            </div>
          </div>
        </div>

        {/* Advanced Filters and Controls */}
        <div className="card">
          <div className="card-header">
            <div className="header-actions">
              <div className="search-controls">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search applicants, courses, emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ width: '300px' }}
                  />
                </div>

                <div className="filter-group">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">All Courses</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={facultyFilter}
                    onChange={(e) => setFacultyFilter(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">All Faculties</option>
                    {faculties.map(faculty => (
                      <option key={faculty.id} value={faculty.name}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="form-select"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">By Name</option>
                    <option value="course">By Course</option>
                    <option value="status">By Status</option>
                  </select>
                </div>
              </div>

              <div className="view-controls">
                <div className="view-toggle">
                  <button
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    🏠 Grid
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    📊 Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Display */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              Applications ({filteredApplications.length})
              {selectedApplications.size > 0 && (
                <span className="selected-count">
                  • {selectedApplications.size} selected
                </span>
              )}
            </h2>
            <div className="card-actions">
              <button
                className="btn-outline"
                onClick={selectAllApplications}
              >
                {selectedApplications.size === filteredApplications.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="card-content">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading applications...</p>
              </div>
            ) : filteredApplications.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="applications-grid-enhanced">
                  {sortedApplications.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              ) : (
                <ApplicationTableView />
              )
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No Applications Found</h3>
                <p>Try adjusting your search criteria or filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Review Panel */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Review Notes</h2>
          </div>
          <div className="card-content">
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add review notes that can be applied to multiple applications..."
              rows="3"
            />
            <small>These notes will be applied when you approve or reject applications</small>
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h2>Application Details</h2>
              <button
                className="close-btn"
                onClick={() => setShowApplicationModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="application-detail-view">
                <div className="detail-section">
                  <h3>Applicant Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Full Name</label>
                      <span>{selectedApplication.studentName}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email</label>
                      <span>{selectedApplication.studentEmail}</span>
                    </div>
                    <div className="detail-item">
                      <label>Phone</label>
                      <span>{selectedApplication.studentPhone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Applied Date</label>
                      <span>{safeDateDisplay(selectedApplication.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Program Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Course</label>
                      <span>{getCourseName(selectedApplication.courseId)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Faculty</label>
                      <span>{getFacultyByCourse(selectedApplication.courseId)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(selectedApplication.status) }}
                      >
                        {selectedApplication.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedApplication.reviewNotes && (
                  <div className="detail-section">
                    <h3>Review Notes</h3>
                    <p>{selectedApplication.reviewNotes}</p>
                  </div>
                )}

                <div className="modal-actions">
                  {selectedApplication.status === 'pending' && (
                    <>
                      <button
                        className="btn-success"
                        onClick={() => {
                          handleStatusUpdate(selectedApplication.id, 'approved');
                          setShowApplicationModal(false);
                        }}
                      >
                        ✅ Approve Application
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => {
                          handleStatusUpdate(selectedApplication.id, 'rejected');
                          setShowApplicationModal(false);
                        }}
                      >
                        ❌ Reject Application
                      </button>
                    </>
                  )}
                  <button
                    className="btn-outline"
                    onClick={() => setShowApplicationModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewApplications;
