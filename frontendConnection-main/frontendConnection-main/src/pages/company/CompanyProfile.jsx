import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { companyService, dashboardService } from '../../services/companyServices';
import './CompanyDashboard.css';

const CompanyProfile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    applications: 0,
    profileViews: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    website: '',
    location: '',
    employees: '',
    registrationDate: '',
    contactPerson: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (user?.uid) {
      loadCompanyProfile();
      loadCompanyStats();
    }
    // eslint-disable-next-line no-use-before-define
  }, [loadCompanyProfile, user]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadCompanyProfile = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      console.log("🔄 Loading company profile...");

      const company = await companyService.getCompanyProfile();
      console.log("📊 Company profile loaded:", company);

      if (company) {
        setFormData({
          name: company.name || '',
          industry: company.industry || '',
          description: company.description || '',
          website: company.website || '',
          location: company.location || '',
          employees: company.employees || company.size || '',
          registrationDate: company.registrationDate || company.founded || '',
          contactPerson: company.contactPerson || '',
          phone: company.phone || '',
          email: company.email || user?.email || ''
        });
      }
    } catch (error) {
      console.error('❌ Error loading company profile:', error);
      setMessage('Failed to load company profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompanyStats = async () => {
    try {
      const dashboardData = await dashboardService.getDashboardData();
      if (dashboardData && dashboardData.stats) {
        setStats(dashboardData.stats);
      }
    } catch (error) {
      console.error('Error loading company stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setMessage('');

      console.log("💾 Saving company profile:", formData);

      // Prepare data for Firebase - match your company structure
      const companyData = {
        name: formData.name,
        industry: formData.industry,
        description: formData.description,
        website: formData.website,
        location: formData.location,
        employees: formData.employees,
        registrationDate: formData.registrationDate,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email || user?.email,
        // Include legacy fields for compatibility
        size: formData.employees,
        founded: formData.registrationDate
      };

      await companyService.updateCompanyProfile(companyData);
      setMessage('Company profile updated successfully!');
      setIsEditing(false);
      await loadCompanyProfile(); // Reload to get updated data
    } catch (error) {
      console.error('❌ Error updating company profile:', error);
      setMessage('Failed to update company profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    loadCompanyProfile(); // Reload original data
    setMessage('');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage('');
  };

  if (isLoading) {
    return (
      <div className="company-profile loading">
        <div className="loading-spinner"></div>
        <p>Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="company-profile">
      {/* Header */}
      <div className="profile-header">
        <div className="header-content">
          <h1>Company Profile</h1>
          <p>Manage your company information and branding</p>
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <button
              className="btn-primary"
              onClick={handleEdit}
            >
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="profile-form"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
          <button onClick={() => setMessage('')} className="close-message">×</button>
        </div>
      )}

      {/* Company Header */}
      <div className="company-header-section">
        <div className="company-badge">
          <div className="company-avatar">
            {formData.name?.charAt(0) || 'C'}
          </div>
          <div className="company-details">
            <h2>{formData.name || 'Your Company'}</h2>
            <p>
              {formData.industry || 'Add Industry'} • {formData.location || 'Add Location'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        {/* Profile Form */}
        <form id="profile-form" onSubmit={handleSubmit} className="profile-form">
          <div className="form-sections">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="company-name">Company Name *</label>
                  <input
                    id="company-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={!isEditing}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="industry">Industry *</label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    required
                    disabled={!isEditing}
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology & IT Services">Technology & IT Services</option>
                    <option value="Finance & Banking">Finance & Banking</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Construction">Construction</option>
                    <option value="Transportation & Logistics">Transportation & Logistics</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Mining">Mining</option>
                    <option value="Energy">Energy</option>
                    <option value="Telecommunications">Telecommunications</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="employees">Company Size *</label>
                  <select
                    id="employees"
                    name="employees"
                    value={formData.employees}
                    onChange={handleChange}
                    required
                    disabled={!isEditing}
                  >
                    <option value="">Select Size</option>
                    <option value="1-10 employees">1-10 employees</option>
                    <option value="11-50 employees">11-50 employees</option>
                    <option value="51-200 employees">51-200 employees</option>
                    <option value="201-500 employees">201-500 employees</option>
                    <option value="501-1000 employees">501-1000 employees</option>
                    <option value="1000+ employees">1000+ employees</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="registrationDate">Registration Date</label>
                  <input
                    id="registrationDate"
                    type="date"
                    name="registrationDate"
                    value={formData.registrationDate}
                    onChange={handleChange}
                    disabled={!isEditing}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <h3>Contact Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="contactPerson">Contact Person *</label>
                  <input
                    id="contactPerson"
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    required
                    disabled={!isEditing}
                    placeholder="Full name of contact person"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={!isEditing}
                    placeholder="company@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={!isEditing}
                    placeholder="+266 ..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="location">Location *</label>
                  <input
                    id="location"
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    disabled={!isEditing}
                    placeholder="e.g., Maseru, Lesotho"
                  />
                </div>
              </div>
            </div>

            {/* Company Description */}
            <div className="form-section">
              <h3>Company Description</h3>
              <div className="form-group">
                <label htmlFor="description">About Your Company *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows="6"
                  placeholder="Describe your company, mission, values, products/services, and what makes you unique..."
                  required
                />
                <small className="form-hint">
                  This description will be visible to job applicants and potential candidates.
                </small>
              </div>
            </div>
          </div>
        </form>

        {/* Statistics */}
        {!isEditing && (
          <div className="profile-stats">
            <h3>Company Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card small">
                <span className="stat-number">{stats.totalJobs || 0}</span>
                <span className="stat-label">Total Jobs</span>
              </div>
              <div className="stat-card small">
                <span className="stat-number">{stats.activeJobs || 0}</span>
                <span className="stat-label">Active Jobs</span>
              </div>
              <div className="stat-card small">
                <span className="stat-number">{stats.applications || 0}</span>
                <span className="stat-label">Total Applications</span>
              </div>
              <div className="stat-card small">
                <span className="stat-number">{stats.profileViews || 0}</span>
                <span className="stat-label">Profile Views</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfile;
