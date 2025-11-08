import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobService } from '../../services/companyServices';
import './CompanyDashboard.css';

const JobPosting = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'full-time',
    department: '',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    qualifications: '',
    skills: [],
    experience: '',
    education: '',
    deadline: '',
    remote: false
  });

  useEffect(() => {
    if (jobId && jobId !== 'new') {
      loadJobData();
      setIsEditing(true);
    }
  }, [jobId]);

  const loadJobData = async () => {
    try {
      setIsLoading(true);
      const job = await jobService.getJobById(jobId);
      if (job) {
        setFormData(job);
      }
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      if (isEditing) {
        await jobService.updateJob(jobId, formData);
      } else {
        await jobService.createJob(formData);
      }

      navigate('/dashboard/company');
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="company-form-container">
      <div className="form-header">
        <h1>{isEditing ? 'Edit Job' : 'Post New Job'}</h1>
        <p>Fill in the details to create a new job posting</p>
      </div>

      <form onSubmit={handleSubmit} className="job-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Job Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Senior Software Engineer"
              />
            </div>

            <div className="form-group">
              <label>Job Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
            </div>

            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Engineering"
              />
            </div>

            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="e.g. Maseru, Lesotho"
              />
            </div>

            <div className="form-group">
              <label>Salary Range *</label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                required
                placeholder="e.g. M25,000 - M35,000"
              />
            </div>

            <div className="form-group">
              <label>Application Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Job Details</h3>
          <div className="form-group">
            <label>Job Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="6"
              placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
            />
          </div>

          <div className="form-group">
            <label>Requirements *</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              required
              rows="4"
              placeholder="List the key requirements for this position..."
            />
          </div>

          <div className="form-group">
            <label>Qualifications</label>
            <textarea
              name="qualifications"
              value={formData.qualifications}
              onChange={handleChange}
              rows="4"
              placeholder="Educational and professional qualifications required..."
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Skills & Experience</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Required Experience</label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="e.g. 3-5 years in software development"
              />
            </div>

            <div className="form-group">
              <label>Education Level</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="e.g. Bachelor's Degree in Computer Science"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/dashboard/company')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update Job' : 'Post Job')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobPosting;
