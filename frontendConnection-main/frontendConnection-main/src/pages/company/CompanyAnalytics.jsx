import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { dashboardService } from "../../services/companyServices";
import "./CompanyDashboard.css";

const CompanyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    applications: 0,
    profileViews: 0,
    totalApplicants: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [jobListings, setJobListings] = useState([]);
  const [companyData, setCompanyData] = useState(null);
  const [pipelineStats, setPipelineStats] = useState({});
  const [topCandidates, setTopCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("🔄 Loading company dashboard data...");

      const dashboardData = await dashboardService.getDashboardData();
      console.log("📊 Dashboard data loaded:", dashboardData);

      // Ensure all data is properly set with fallbacks
      setCompanyData(dashboardData.company || {});
      setStats(dashboardData.stats || {
        totalJobs: 0,
        activeJobs: 0,
        applications: 0,
        profileViews: 0,
        totalApplicants: 0
      });
      setRecentApplications(dashboardData.recentApplications || []);
      setJobListings(dashboardData.jobListings || []);
      setPipelineStats(dashboardData.pipelineStats || {});
      setTopCandidates(dashboardData.topCandidates || []);
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
      // Set safe defaults
      setRecentApplications([]);
      setJobListings([]);
      setTopCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'postJob':
        navigate('/dashboard/company/jobs/new');
        break;
      case 'reviewCandidates':
        navigate('/dashboard/company/applications');
        break;
      case 'updateProfile':
        navigate('/dashboard/company/profile');
        break;
      case 'viewAnalytics':
        navigate('/dashboard/company/analytics');
        break;
      default:
        break;
    }
  };

  const StatCard = ({ title, value, change, icon, color }) => (
    <div className="stat-card" style={{ "--stat-color": color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{typeof value === 'number' ? value.toLocaleString() : value}</h3>
        <p>{title}</p>
        {change && <span className="stat-change">{change}</span>}
      </div>
    </div>
  );

  const QuickAction = ({ icon, title, description, action, color }) => (
    <div
      className="quick-action-card"
      style={{ "--accent-color": color }}
      onClick={() => handleQuickAction(action)}
    >
      <div className="action-icon">{icon}</div>
      <div className="action-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <div className="action-arrow">→</div>
    </div>
  );

  const formatDate = (date) => {
    if (!date) return 'Recently';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Recently';
      return dateObj.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  if (isLoading) {
    return (
      <div className="company-dashboard loading">
        <div className="loading-spinner large"></div>
        <p>Loading your company dashboard...</p>
      </div>
    );
  }

  return (
    <div className="company-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="welcome-title">
              Welcome to your{" "}
              <span className="gradient-text">Company Dashboard</span>
            </h1>
            <p className="welcome-subtitle">
              Manage your job postings, candidate applications, and company profile.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn-notification"
              onClick={() => handleNavigation('/dashboard/company/applications')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              {stats.applications > 0 && (
                <span className="notification-badge">{stats.applications}</span>
              )}
            </button>
            <div className="user-avatar">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "C"}
            </div>
          </div>
        </div>

        {/* Company Info Bar */}
        {companyData && (
          <div className="company-info-bar">
            <div className="company-badge">
              <div className="company-avatar">
                {companyData?.name?.charAt(0) || "C"}
              </div>
              <div className="company-details">
                <h3>{companyData?.name || "Your Company"}</h3>
                <p>
                  {companyData?.industry || "Add Industry"} • {companyData?.location || "Add Location"}
                </p>
              </div>
            </div>
            <div className="company-meta">
              <span>{companyData?.size || "Add Size"}</span>
              {companyData?.isVerified && (
                <span className="verified-badge">✓ Verified</span>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadDashboardData} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-overview">
        <StatCard
          title="Total Jobs Posted"
          value={stats.totalJobs || 0}
          change={`${stats.activeJobs || 0} active`}
          icon="💼"
          color="#3B82F6"
        />
        <StatCard
          title="Active Jobs"
          value={stats.activeJobs || 0}
          change={`${stats.totalApplicants || 0} total applicants`}
          icon="📊"
          color="#10B981"
        />
        <StatCard
          title="Applications"
          value={stats.applications || 0}
          change={`${pipelineStats.new || 0} new`}
          icon="📝"
          color="#F59E0B"
        />
        <StatCard
          title="Profile Views"
          value={stats.profileViews || 0}
          change="This month"
          icon="👁️"
          color="#8B5CF6"
        />
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Quick Actions */}
        <section className="section">
          <div className="section-header">
            <h2>Quick Actions</h2>
            <p>Manage your hiring process efficiently</p>
          </div>
          <div className="quick-actions-grid">
            <QuickAction
              icon="➕"
              title="Post New Job"
              description="Create a new job listing"
              color="#3B82F6"
              action="postJob"
            />
            <QuickAction
              icon="👥"
              title="Review Candidates"
              description="View and manage applications"
              color="#10B981"
              action="reviewCandidates"
            />
            <QuickAction
              icon="🏢"
              title="Update Company Profile"
              description="Edit company information"
              color="#F59E0B"
              action="updateProfile"
            />
            <QuickAction
              icon="📈"
              title="View Analytics"
              description="See hiring metrics and insights"
              color="#8B5CF6"
              action="viewAnalytics"
            />
          </div>
        </section>

        <div className="content-columns">
          {/* Left Column */}
          <div className="left-column">
            {/* Recent Applications */}
            <section className="section">
              <div className="section-header">
                <h2>Recent Applications</h2>
                <div
                  className="view-all-link"
                  onClick={() => handleNavigation('/dashboard/company/applications')}
                >
                  View All
                </div>
              </div>
              <div className="applications-list">
                {recentApplications.length > 0 ? (
                  recentApplications.map((application, index) => (
                    <div
                      key={application.id || index}
                      className="application-item"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => handleNavigation(`/dashboard/company/applications/${application.id}`)}
                    >
                      <div className="application-avatar">
                        {application.candidate?.fullName?.charAt(0) || 'C'}
                      </div>
                      <div className="application-details">
                        <h4>{application.candidate?.fullName || 'Candidate'}</h4>
                        <p>{application.jobTitle || 'Position'}</p>
                        <span className="application-time">
                          {formatDate(application.appliedAt)}
                        </span>
                      </div>
                      <div className={`application-status ${application.status || 'pending'}`}>
                        {application.status || 'Pending'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No applications yet</p>
                    <small>Applications will appear here when candidates apply</small>
                  </div>
                )}
              </div>
            </section>

            {/* Job Listings */}
            <section className="section">
              <div className="section-header">
                <h2>Active Job Listings</h2>
                <button
                  className="btn-add"
                  onClick={() => handleNavigation('/dashboard/company/jobs/new')}
                >
                  + Post Job
                </button>
              </div>
              <div className="jobs-grid">
                {jobListings.length > 0 ? (
                  jobListings.map((job) => (
                    <div key={job.id} className="job-card">
                      <div className="job-header">
                        <div className="job-title-section">
                          <h4>{job.title || 'Untitled Job'}</h4>
                          <span className="job-type">{job.type || 'Full-time'}</span>
                        </div>
                        <span className={`job-status ${job.status || 'active'}`}>
                          {job.status || 'Active'}
                        </span>
                      </div>
                      <div className="job-details">
                        <div className="job-salary">{job.salary || 'Salary not specified'}</div>
                        <div className="job-applicants">
                          <span className="applicant-count">
                            {job.applicantsCount || 0}
                          </span>
                          <span className="applicant-label">applicants</span>
                        </div>
                      </div>
                      <div className="job-actions">
                        <button
                          className="btn-action view"
                          onClick={() => handleNavigation(`/dashboard/company/jobs/${job.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn-action edit"
                          onClick={() => handleNavigation(`/dashboard/company/jobs/${job.id}/edit`)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-action applicants"
                          onClick={() => handleNavigation(`/dashboard/company/jobs/${job.id}/applications`)}
                        >
                          Applicants
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No active job listings</p>
                    <button
                      className="btn-primary"
                      onClick={() => handleNavigation('/dashboard/company/jobs/new')}
                    >
                      Post Your First Job
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Hiring Pipeline */}
            <section className="section">
              <div className="section-header">
                <h2>Hiring Pipeline</h2>
                <div
                  className="view-all-link"
                  onClick={() => handleNavigation('/dashboard/company/applications')}
                >
                  Details
                </div>
              </div>
              <div className="pipeline-stats">
                <div className="pipeline-stage">
                  <div className="stage-info">
                    <span className="stage-name">New Applications</span>
                    <span className="stage-count">{pipelineStats.new || 0}</span>
                  </div>
                  <div className="stage-bar">
                    <div
                      className="stage-progress"
                      style={{ width: `${((pipelineStats.new || 0) / Math.max(stats.applications, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="pipeline-stage">
                  <div className="stage-info">
                    <span className="stage-name">Under Review</span>
                    <span className="stage-count">{pipelineStats.reviewed || 0}</span>
                  </div>
                  <div className="stage-bar">
                    <div
                      className="stage-progress"
                      style={{ width: `${((pipelineStats.reviewed || 0) / Math.max(stats.applications, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="pipeline-stage">
                  <div className="stage-info">
                    <span className="stage-name">Interview</span>
                    <span className="stage-count">{pipelineStats.interview || 0}</span>
                  </div>
                  <div className="stage-bar">
                    <div
                      className="stage-progress"
                      style={{ width: `${((pipelineStats.interview || 0) / Math.max(stats.applications, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="pipeline-stage">
                  <div className="stage-info">
                    <span className="stage-name">Hired</span>
                    <span className="stage-count">{pipelineStats.hired || 0}</span>
                  </div>
                  <div className="stage-bar">
                    <div
                      className="stage-progress"
                      style={{ width: `${((pipelineStats.hired || 0) / Math.max(stats.applications, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Top Candidates */}
            <section className="section">
              <div className="section-header">
                <h2>Top Candidates</h2>
              </div>
              <div className="candidates-list">
                {topCandidates.length > 0 ? (
                  topCandidates.map((candidate, index) => (
                    <div
                      key={candidate.id || index}
                      className={`candidate-item ${index === 0 ? 'featured' : ''}`}
                      onClick={() => handleNavigation(`/dashboard/company/applications/${candidate.id}`)}
                    >
                      <div className="candidate-avatar">
                        {candidate.candidate?.fullName?.charAt(0) || 'C'}
                      </div>
                      <div className="candidate-details">
                        <h4>{candidate.candidate?.fullName || 'Candidate'}</h4>
                        <p>{candidate.jobTitle || 'Position'}</p>
                        <div className="candidate-skills">
                          {candidate.candidate?.skills?.slice(0, 2).map((skill, idx) => (
                            <span key={idx} className="skill-tag">{skill}</span>
                          ))}
                          {(!candidate.candidate?.skills || candidate.candidate.skills.length === 0) && (
                            <span className="no-skills">No skills listed</span>
                          )}
                        </div>
                      </div>
                      <div className="candidate-match">
                        <span className="match-score">{candidate.matchScore || '0'}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state small">
                    <p>No top candidates yet</p>
                    <small>Candidates will appear as they apply</small>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Metrics */}
            <section className="section">
              <div className="section-header">
                <h2>This Month</h2>
              </div>
              <div className="quick-metrics">
                <div className="metric-item">
                  <div className="metric-icon">⏱️</div>
                  <div className="metric-content">
                    <span className="metric-value">3.2 days</span>
                    <span className="metric-label">Avg. Response Time</span>
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-icon">✅</div>
                  <div className="metric-content">
                    <span className="metric-value">
                      {stats.applications > 0 ? Math.round(((pipelineStats.hired || 0) / stats.applications) * 100) : 0}%
                    </span>
                    <span className="metric-label">Hire Rate</span>
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-icon">⭐</div>
                  <div className="metric-content">
                    <span className="metric-value">4.8</span>
                    <span className="metric-label">Candidate Rating</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
