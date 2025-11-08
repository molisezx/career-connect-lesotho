import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationService } from '../../services/companyServices';
import './CompanyDashboard.css';

const ApplicationDetails = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    try {
      setIsLoading(true);
      const app = await applicationService.getApplicationById(applicationId);
      setApplication(app);
    } catch (error) {
      console.error('Error loading application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      await loadApplication();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="application-details loading">
        <div className="loading-spinner"></div>
        <p>Loading application details...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="application-details not-found">
        <h2>Application Not Found</h2>
        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard/company/applications')}
        >
          Back to Applications
        </button>
      </div>
    );
  }

  return (
    <div className="application-details">
      {/* Header */}
      <div className="application-header">
        <button
          className="btn-back"
          onClick={() => navigate('/dashboard/company/applications')}
        >
          ← Back to Applications
        </button>

        <div className="header-actions">
          <select
            value={application.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className="status-select large"
          >
            <option value="applied">Applied</option>
            <option value="reviewed">Reviewed</option>
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
            <option value="hired">Hired</option>
          </select>

          <button className="btn-secondary">Schedule Interview</button>
          <button className="btn-primary">Send Message</button>
        </div>
      </div>

      <div className="application-content">
        {/* Candidate Profile Sidebar */}
        <div className="candidate-sidebar">
          <div className="candidate-card">
            <div className="candidate-avatar large">
              {application.candidate?.fullName?.charAt(0) || 'C'}
            </div>
            <h2>{application.candidate?.fullName || 'Candidate'}</h2>
            <p className="candidate-title">{application.jobTitle}</p>

            <div className="candidate-stats">
              <div className="stat">
                <span className="stat-value">{application.matchScore || '85'}%</span>
                <span className="stat-label">Match Score</span>
              </div>
            </div>

            <div className="contact-info">
              <h4>Contact Information</h4>
              <p>📧 {application.candidate?.email}</p>
              <p>📱 {application.candidate?.phone || 'Not provided'}</p>
              <p>📍 {application.candidate?.location || 'Not provided'}</p>
            </div>

            <div className="quick-actions">
              <button className="btn-action">View Full Profile</button>
              <button className="btn-action">Download CV</button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="application-main">
          {/* Navigation Tabs */}
          <div className="application-tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'qualifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('qualifications')}
            >
              Qualifications
            </button>
            <button
              className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
            <button
              className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="section">
                  <h3>Application Summary</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="label">Applied Date</span>
                      <span className="value">
                        {application.appliedAt ? new Date(application.appliedAt.toDate()).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Status</span>
                      <span className={`status ${application.status}`}>
                        {application.status}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Match Score</span>
                      <span className="value">{application.matchScore || '85'}%</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Job Type</span>
                      <span className="value">{application.jobType || 'Full-time'}</span>
                    </div>
                  </div>
                </div>

                <div className="section">
                  <h3>Cover Letter</h3>
                  <div className="cover-letter">
                    {application.coverLetter || 'No cover letter provided.'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'qualifications' && (
              <div className="qualifications-tab">
                <div className="section">
                  <h3>Education</h3>
                  {application.candidate?.education?.length > 0 ? (
                    application.candidate.education.map((edu, index) => (
                      <div key={index} className="education-item">
                        <h4>{edu.degree}</h4>
                        <p>{edu.institution}</p>
                        <span className="date">{edu.year}</span>
                      </div>
                    ))
                  ) : (
                    <p>No education information provided.</p>
                  )}
                </div>

                <div className="section">
                  <h3>Work Experience</h3>
                  {application.candidate?.experience?.length > 0 ? (
                    application.candidate.experience.map((exp, index) => (
                      <div key={index} className="experience-item">
                        <h4>{exp.position}</h4>
                        <p>{exp.company}</p>
                        <span className="date">{exp.duration}</span>
                        <p className="description">{exp.description}</p>
                      </div>
                    ))
                  ) : (
                    <p>No work experience provided.</p>
                  )}
                </div>

                <div className="section">
                  <h3>Skills</h3>
                  <div className="skills-list">
                    {application.candidate?.skills?.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="documents-tab">
                <div className="document-list">
                  <div className="document-item">
                    <div className="document-icon">📄</div>
                    <div className="document-info">
                      <h4>Resume/CV</h4>
                      <span>PDF Document</span>
                    </div>
                    <button className="btn-download">Download</button>
                  </div>

                  {application.candidate?.certificates?.map((cert, index) => (
                    <div key={index} className="document-item">
                      <div className="document-icon">🏆</div>
                      <div className="document-info">
                        <h4>{cert.name}</h4>
                        <span>Certificate</span>
                      </div>
                      <button className="btn-download">Download</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="timeline-tab">
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h4>Application Submitted</h4>
                      <p>Candidate applied for the position</p>
                      <span className="timeline-date">
                        {application.appliedAt ? new Date(application.appliedAt.toDate()).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Add more timeline items based on application status changes */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;
