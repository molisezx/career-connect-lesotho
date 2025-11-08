import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRecommendedJobs, applyForJob, getStudentProfile } from '../../services/studentServices';
import './Student.css';

const JobMatches = () => {
  const { user } = useAuth();
  const [jobMatches, setJobMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.uid) {
      loadJobMatches();
    }
  }, [user]);

  const loadJobMatches = async () => {
    try {
      setIsLoading(true);
      const result = await getRecommendedJobs(user.uid);

      if (result.success) {
        setJobMatches(result.data);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error loading job matches:', error);
      setMessage({ type: 'error', text: 'Failed to load job matches' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (job) => {
    if (!user?.uid) return;

    setApplyingJobId(job.id);
    setMessage({ type: '', text: '' });

    try {
      const studentProfile = await getStudentProfile(user.uid);
      if (!studentProfile.success) {
        setMessage({ type: 'error', text: 'Please complete your profile before applying' });
        return;
      }

      const applicationData = {
        studentId: user.uid,
        studentName: studentProfile.data.fullName || user.displayName || 'Unknown',
        studentEmail: studentProfile.data.email || user.email,
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.companyName,
        companyId: job.companyId,
        appliedAt: new Date(),
        status: 'pending'
      };

      const result = await applyForJob(applicationData);

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Application submitted successfully for ${job.title}!`
        });

        // Remove the job from matches after successful application
        setJobMatches(prev => prev.filter(match => match.id !== job.id));
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to submit application'
        });
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred while submitting your application'
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  const calculateMatchPercentage = (job) => {
    // Calculate match percentage based on requirements met
    let score = 0;
    let total = 0;

    if (job.requirements?.minEducation) {
      total += 25;
      score += 25; // Assuming student meets this requirement (pre-filtered)
    }
    if (job.requirements?.minGrade) {
      total += 25;
      score += 25;
    }
    if (job.requirements?.skills) {
      total += 25;
      score += 25;
    }
    if (job.requirements?.minExperience) {
      total += 25;
      score += 25;
    }

    return total > 0 ? Math.round((score / total) * 100) : 100;
  };

  if (isLoading) {
    return (
      <div className="job-matches loading">
        <div className="loading-spinner"></div>
        <p>Loading your job matches...</p>
      </div>
    );
  }

  return (
    <div className="job-matches">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Your Job Matches</h1>
            <p>Jobs that match your qualifications and preferences</p>
          </div>
          <div className="matches-count">
            {jobMatches.length} {jobMatches.length === 1 ? 'Match' : 'Matches'}
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {jobMatches.length === 0 ? (
        <div className="no-matches">
          <div className="empty-state">
            <div className="empty-icon">💼</div>
            <h3>No Job Matches Yet</h3>
            <p>
              We'll show you jobs here that match your qualifications and preferences.
              Make sure your profile is complete and check back later for new opportunities.
            </p>
          </div>
        </div>
      ) : (
        <div className="matches-grid">
          {jobMatches.map((job) => (
            <div key={job.id} className="job-match-card">
              <div className="match-header">
                <div className="match-badge">
                  {calculateMatchPercentage(job)}% Match
                </div>
                <div className="job-type">{job.jobType}</div>
              </div>

              <div className="job-content">
                <h3>{job.title}</h3>
                <p className="company">{job.companyName}</p>
                <p className="location">{job.location}</p>

                <div className="job-details">
                  <div className="detail-item">
                    <span className="detail-label">Salary:</span>
                    <span className="detail-value">
                      {job.salary ? `M${job.salary.toLocaleString()}` : 'Negotiable'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Deadline:</span>
                    <span className="detail-value">
                      {job.deadline?.toDate?.().toLocaleDateString() || 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="requirements">
                  <h4>Requirements:</h4>
                  <ul>
                    {job.requirements?.minEducation && (
                      <li>Education: {job.requirements.minEducation}</li>
                    )}
                    {job.requirements?.minGrade && (
                      <li>Minimum Grade: {job.requirements.minGrade}</li>
                    )}
                    {job.requirements?.skills && job.requirements.skills.length > 0 && (
                      <li>Skills: {job.requirements.skills.join(', ')}</li>
                    )}
                    {job.requirements?.minExperience && (
                      <li>Experience: {job.requirements.minExperience} years</li>
                    )}
                  </ul>
                </div>

                <p className="job-description">{job.description}</p>
              </div>

              <div className="job-actions">
                <button
                  onClick={() => handleApply(job)}
                  disabled={applyingJobId === job.id}
                  className="btn-primary"
                >
                  {applyingJobId === job.id ? 'Applying...' : 'Apply Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobMatches;
