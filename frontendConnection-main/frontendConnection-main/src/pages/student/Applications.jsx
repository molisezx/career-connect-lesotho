import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentApplications, getStudentJobApplications } from '../../services/studentServices';
import './Student.css';

const Applications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courseApplications, setCourseApplications] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('courses');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized status configuration
  const statusConfig = useMemo(() => ({
    pending: { class: 'pending', label: 'Pending' },
    under_review: { class: 'review', label: 'Under Review' },
    approved: { class: 'approved', label: 'Approved' },
    rejected: { class: 'rejected', label: 'Rejected' }
  }), []);

  // Optimized data loading with better error handling
  const loadApplications = useCallback(async () => {
    if (!user?.uid) {
      console.log('🚫 No user UID available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading applications for user:', user.uid);

      const [courseRes, jobRes] = await Promise.allSettled([
        getStudentApplications(user.uid),
        getStudentJobApplications(user.uid)
      ]);

      console.log('📊 Course applications result:', courseRes);
      console.log('📊 Job applications result:', jobRes);

      // Handle course applications
      if (courseRes.status === 'fulfilled' && courseRes.value?.success) {
        setCourseApplications(courseRes.value.data || []);
      } else {
        const courseError = courseRes.reason || courseRes.value?.error;
        console.error('❌ Error loading course applications:', courseError);

        if (courseError?.code === 'failed-precondition') {
          setError('System is updating. Please refresh the page in a moment.');
        } else {
          setError('Failed to load course applications. Please try again.');
        }
        setCourseApplications([]);
      }

      // Handle job applications
      if (jobRes.status === 'fulfilled' && jobRes.value?.success) {
        setJobApplications(jobRes.value.data || []);
      } else {
        const jobError = jobRes.reason || jobRes.value?.error;
        console.error('❌ Error loading job applications:', jobError);

        if (!error) { // Only set error if not already set
          if (jobError?.code === 'failed-precondition') {
            setError('System is updating. Please refresh the page in a moment.');
          } else {
            setError('Failed to load job applications. Please try again.');
          }
        }
        setJobApplications([]);
      }

    } catch (error) {
      console.error('❌ Unexpected error loading applications:', error);
      setError('An unexpected error occurred. Please try again.');
      setCourseApplications([]);
      setJobApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, error]);

  // Optimized useEffect with proper dependencies
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (user?.uid && mounted) {
        await loadApplications();
      } else if (mounted) {
        setIsLoading(false);
      }
    };

    // Small delay to ensure auth is fully initialized
    const timer = setTimeout(loadData, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [user?.uid, loadApplications]);

  // Memoized navigation handlers
  const navigationHandlers = useMemo(() => ({
    navigateToDashboard: () => navigate("/dashboard/student"),
    navigateToCourses: () => navigate("/dashboard/student/courses"),
    navigateToJobs: () => navigate("/dashboard/student/jobs"),
    handleApplyNow: (type) => navigate(type === 'courses'
      ? '/dashboard/student/courses'
      : '/dashboard/student/jobs'
    ),
    handleViewApplication: (applicationId, type) => {
      navigate(`/dashboard/student/view-application/${applicationId}`, {
        state: { type }
      });
    }
  }), [navigate]);

  // Memoized status badge component
  const getStatusBadge = useCallback((status) => {
    const config = statusConfig[status] || { class: 'pending', label: 'Pending' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  }, [statusConfig]);

  // Optimized date formatting
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return 'N/A';

    try {
      let date;

      if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        return 'N/A';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  }, []);

  // Retry loading applications
  const handleRetry = useCallback(() => {
    setError(null);
    loadApplications();
  }, [loadApplications]);

  // Loading state
  if (isLoading) {
    return (
      <div className="applications-page loading">
        <div className="loading-spinner"></div>
        <p>Loading your applications...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="applications-page error">
        <div className="error-state">
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="btn-primary">
              Try Again
            </button>
            <button onClick={navigationHandlers.navigateToDashboard} className="btn-secondary">
              Back to Dashboard
            </button>
          </div>
          <div className="error-help">
            <p>If the problem persists, please contact support.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>My Applications</h1>
            <p>Track your course and job applications</p>
          </div>
          <button
            onClick={navigationHandlers.navigateToDashboard}
            className="btn-back"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="applications-tabs">
        <button
          className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Course Applications ({courseApplications.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Job Applications ({jobApplications.length})
        </button>
      </div>

      {/* Course Applications */}
      {activeTab === 'courses' && (
        <div className="applications-section">
          {courseApplications.length > 0 ? (
            <div className="applications-list">
              {courseApplications.map(application => (
                <div key={application.id} className="application-card">
                  <div className="application-header">
                    <h3>{application.courseName || 'Unnamed Course'}</h3>
                    {getStatusBadge(application.status)}
                  </div>

                  <div className="application-details">
                    <div className="detail-item">
                      <span>Institution:</span>
                      <strong>{application.institutionName || 'Unknown Institution'}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Applied On:</span>
                      <strong>{formatDate(application.appliedAt)}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Application ID:</span>
                      <strong>{application.id ? application.id.slice(-8) : 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="application-actions">
                    <button
                      className="btn-view"
                      onClick={() => navigationHandlers.handleViewApplication(application.id, 'course')}
                    >
                      View Details
                    </button>
                    {application.status === 'pending' && (
                      <button className="btn-withdraw">Withdraw</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-applications">
              <div className="empty-state">
                <h3>No Course Applications</h3>
                <p>You haven't applied to any courses yet.</p>
                <button
                  onClick={() => navigationHandlers.handleApplyNow('courses')}
                  className="btn-primary"
                >
                  Browse Courses
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Job Applications */}
      {activeTab === 'jobs' && (
        <div className="applications-section">
          {jobApplications.length > 0 ? (
            <div className="applications-list">
              {jobApplications.map(application => (
                <div key={application.id} className="application-card">
                  <div className="application-header">
                    <h3>{application.jobTitle || 'Unnamed Job'}</h3>
                    {getStatusBadge(application.status)}
                  </div>

                  <div className="application-details">
                    <div className="detail-item">
                      <span>Company:</span>
                      <strong>{application.companyName || 'Unknown Company'}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Applied On:</span>
                      <strong>{formatDate(application.appliedAt)}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Application ID:</span>
                      <strong>{application.id ? application.id.slice(-8) : 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="application-actions">
                    <button
                      className="btn-view"
                      onClick={() => navigationHandlers.handleViewApplication(application.id, 'job')}
                    >
                      View Details
                    </button>
                    <button className="btn-track">Track Application</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-applications">
              <div className="empty-state">
                <h3>No Job Applications</h3>
                <p>You haven't applied to any jobs yet.</p>
                <button
                  onClick={() => navigationHandlers.handleApplyNow('jobs')}
                  className="btn-primary"
                >
                  Browse Jobs
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;
