import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationService, jobService } from '../../services/companyServices';
import './CompanyDashboard.css';

const Applications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    job: 'all',
    search: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [apps, companyJobs] = await Promise.all([
        applicationService.getCompanyApplications(),
        jobService.getCompanyJobs()
      ]);
      setApplications(apps);
      setJobs(companyJobs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    if (filters.job !== 'all') {
      filtered = filtered.filter(app => app.jobId === filters.job);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app =>
        app.candidate?.fullName?.toLowerCase().includes(searchLower) ||
        app.jobTitle?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredApplications(filtered);
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      await loadData();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      applied: { label: 'Applied', color: '#3B82F6' },
      reviewed: { label: 'Reviewed', color: '#8B5CF6' },
      interview: { label: 'Interview', color: '#F59E0B' },
      rejected: { label: 'Rejected', color: '#EF4444' },
      hired: { label: 'Hired', color: '#10B981' }
    };

    const config = statusConfig[status] || { label: status, color: '#6B7280' };
    return (
      <span
        className="status-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="company-applications loading">
        <div className="loading-spinner"></div>
        <p>Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="company-applications">
      <div className="applications-header">
        <div className="header-content">
          <h1>Candidate Applications</h1>
          <p>Manage and review all job applications</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard/company/jobs/new')}
        >
          Post New Job
        </button>
      </div>

      {/* Filters */}
      <div className="applications-filters">
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="applied">Applied</option>
            <option value="reviewed">Reviewed</option>
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
            <option value="hired">Hired</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Job Position</label>
          <select
            value={filters.job}
            onChange={(e) => setFilters(prev => ({ ...prev, job: e.target.value }))}
          >
            <option value="all">All Jobs</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by candidate or job..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="applications-container">
        {filteredApplications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No applications found</h3>
            <p>Try adjusting your filters or post a new job to attract candidates.</p>
          </div>
        ) : (
          <div className="applications-list">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className="application-card"
                onClick={() => navigate(`/dashboard/company/applications/${application.id}`)}
              >
                <div className="application-main">
                  <div className="candidate-info">
                    <div className="candidate-avatar">
                      {application.candidate?.fullName?.charAt(0) || 'C'}
                    </div>
                    <div className="candidate-details">
                      <h4>{application.candidate?.fullName || 'Candidate'}</h4>
                      <p className="candidate-email">{application.candidate?.email}</p>
                      <p className="job-title">{application.jobTitle}</p>
                    </div>
                  </div>

                  <div className="application-meta">
                    <span className="application-date">
                      Applied: {application.appliedAt ? new Date(application.appliedAt.toDate()).toLocaleDateString() : 'N/A'}
                    </span>
                    {application.matchScore && (
                      <span className="match-score">
                        Match: {application.matchScore}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="application-actions">
                  <div className="status-section">
                    {getStatusBadge(application.status)}
                  </div>

                  <div className="action-buttons">
                    <select
                      value={application.status}
                      onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="status-select"
                    >
                      <option value="applied">Applied</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="interview">Interview</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>

                    <button
                      className="btn-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/company/applications/${application.id}`);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
