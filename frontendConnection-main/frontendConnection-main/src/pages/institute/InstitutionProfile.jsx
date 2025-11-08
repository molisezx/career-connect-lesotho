import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getInstitutionData,
  updateInstitutionProfile
} from '../../services/institutionServices';
import './InstitutionPages.css';

const InstitutionProfile = () => {
  const { user } = useAuth();
  const [institutionData, setInstitutionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    type: '',
    location: '',
    established: '',
    motto: '',
    description: '',

    // Contact Information
    contactEmail: '',
    phone: '',
    website: '',
    address: '',
    postalCode: '',

    // Accreditation
    accreditationStatus: 'accredited',
    accreditationBody: '',
    accreditationExpiry: '',

    // Social Media
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: '',

    // Additional Details
    totalStudents: '',
    totalStaff: '',
    campusSize: '',
    libraryBooks: '',
    researchCenters: ''
  });

  useEffect(() => {
    loadInstitutionData();
  }, [user]);

  const loadInstitutionData = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const data = await getInstitutionData(user.uid);
      setInstitutionData(data);
      if (data) {
        setFormData(prev => ({
          ...prev,
          name: data.name || '',
          type: data.type || '',
          location: data.location || '',
          established: data.established || '',
          motto: data.motto || '',
          description: data.description || '',
          contactEmail: data.contactEmail || '',
          phone: data.phone || '',
          website: data.website || '',
          address: data.address || '',
          postalCode: data.postalCode || '',
          accreditationStatus: data.accreditationStatus || 'accredited',
          accreditationBody: data.accreditationBody || '',
          accreditationExpiry: data.accreditationExpiry || '',
          facebook: data.facebook || '',
          twitter: data.twitter || '',
          linkedin: data.linkedin || '',
          instagram: data.instagram || '',
          totalStudents: data.totalStudents || '',
          totalStaff: data.totalStaff || '',
          campusSize: data.campusSize || '',
          libraryBooks: data.libraryBooks || '',
          researchCenters: data.researchCenters || ''
        }));
      }
    } catch (error) {
      console.error('Error loading institution data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      await updateInstitutionProfile(user.uid, formData);
      setIsEditing(false);
      loadInstitutionData();
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getAccreditationColor = (status) => {
    switch (status) {
      case 'accredited': return '#10B981';
      case 'provisional': return '#F59E0B';
      case 'pending': return '#3B82F6';
      case 'not-accredited': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <div className="institution-page loading">
        <div className="loading-spinner large"></div>
        <p>Loading institution profile...</p>
      </div>
    );
  }

  return (
    <div className="institution-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Institution Profile</h1>
          <p className="page-subtitle">
            Manage your institution's public profile and administrative information
          </p>
        </div>
      </div>

      <div className="page-content">
        {isEditing ? (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Edit Institution Profile</h2>
              <div className="tab-navigation">
                <button
                  className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('basic')}
                >
                  Basic Info
                </button>
                <button
                  className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
                  onClick={() => setActiveTab('contact')}
                >
                  Contact
                </button>
                <button
                  className={`tab-btn ${activeTab === 'accreditation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('accreditation')}
                >
                  Accreditation
                </button>
                <button
                  className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
                  onClick={() => setActiveTab('social')}
                >
                  Social Media
                </button>
                <button
                  className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Additional Details
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="profile-form-enhanced">
              {activeTab === 'basic' && (
                <div className="form-tab">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Institution Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        placeholder="e.g., National University of Lesotho"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Institution Type *</label>
                      <select
                        className="form-select"
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="University">University</option>
                        <option value="College">College</option>
                        <option value="Institute">Institute</option>
                        <option value="Polytechnic">Polytechnic</option>
                        <option value="Vocational School">Vocational School</option>
                        <option value="Research Institute">Research Institute</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Location *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        required
                        placeholder="e.g., Roma, Lesotho"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Year Established</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.established}
                        onChange={(e) => handleInputChange('established', e.target.value)}
                        placeholder="e.g., 1945"
                        min="1800"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Motto</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.motto}
                      onChange={(e) => handleInputChange('motto', e.target.value)}
                      placeholder="Institution motto or tagline"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows="5"
                      placeholder="Comprehensive description of your institution's mission, vision, and values..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="form-tab">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Contact Email *</label>
                      <input
                        type="email"
                        className="form-input"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        required
                        placeholder="info@institution.edu"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+266 1234 5678"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      className="form-input"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.institution.edu"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Physical Address</label>
                    <textarea
                      className="form-textarea"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows="3"
                      placeholder="Full physical address of the main campus..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Postal Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="e.g., 100"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'accreditation' && (
                <div className="form-tab">
                  <div className="form-group">
                    <label className="form-label">Accreditation Status</label>
                    <select
                      className="form-select"
                      value={formData.accreditationStatus}
                      onChange={(e) => handleInputChange('accreditationStatus', e.target.value)}
                    >
                      <option value="accredited">Fully Accredited</option>
                      <option value="provisional">Provisional Accreditation</option>
                      <option value="pending">Accreditation Pending</option>
                      <option value="not-accredited">Not Accredited</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Accreditation Body</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.accreditationBody}
                      onChange={(e) => handleInputChange('accreditationBody', e.target.value)}
                      placeholder="e.g., Council on Higher Education"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Accreditation Expiry Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.accreditationExpiry}
                      onChange={(e) => handleInputChange('accreditationExpiry', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="form-tab">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Facebook</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formData.facebook}
                        onChange={(e) => handleInputChange('facebook', e.target.value)}
                        placeholder="https://facebook.com/institution"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Twitter</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formData.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        placeholder="https://twitter.com/institution"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">LinkedIn</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formData.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/company/institution"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Instagram</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formData.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        placeholder="https://instagram.com/institution"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="form-tab">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Total Students</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.totalStudents}
                        onChange={(e) => handleInputChange('totalStudents', e.target.value)}
                        placeholder="Approximate student population"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Staff</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.totalStaff}
                        onChange={(e) => handleInputChange('totalStaff', e.target.value)}
                        placeholder="Academic and administrative staff"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Campus Size (acres)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.campusSize}
                        onChange={(e) => handleInputChange('campusSize', e.target.value)}
                        placeholder="Total campus area in acres"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Library Books</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.libraryBooks}
                        onChange={(e) => handleInputChange('libraryBooks', e.target.value)}
                        placeholder="Number of books in library"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Research Centers</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.researchCenters}
                      onChange={(e) => handleInputChange('researchCenters', e.target.value)}
                      placeholder="Number of research centers"
                    />
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="profile-view-enhanced">
            {/* Profile Header */}
            <div className="card profile-header-card">
              <div className="profile-header-content">
                <div className="institution-avatar large">
                  {institutionData?.name?.charAt(0) || 'I'}
                </div>
                <div className="institution-main-info">
                  <h1>{institutionData?.name || 'Your Institution'}</h1>
                  <p className="institution-motto">{institutionData?.motto || 'Education for Excellence'}</p>
                  <div className="institution-meta">
                    <span>{institutionData?.type || 'University'}</span>
                    <span>•</span>
                    <span>{institutionData?.location || 'Lesotho'}</span>
                    {institutionData?.established && (
                      <>
                        <span>•</span>
                        <span>Est. {institutionData.established}</span>
                      </>
                    )}
                  </div>
                </div>
                <div
                  className="accreditation-badge-large"
                  style={{ backgroundColor: getAccreditationColor(institutionData?.accreditationStatus) }}
                >
                  {institutionData?.accreditationStatus?.toUpperCase() || 'FULLY ACCREDITED'}
                </div>
              </div>
            </div>

            <div className="profile-grid-enhanced">
              {/* Basic Information */}
              <div className="card profile-section">
                <h2 className="section-title">Basic Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Institution Type</label>
                    <span>{institutionData?.type || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <label>Location</label>
                    <span>{institutionData?.location || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <label>Established</label>
                    <span>{institutionData?.established || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <label>Motto</label>
                    <span>{institutionData?.motto || 'Not specified'}</span>
                  </div>
                </div>
                {institutionData?.description && (
                  <div className="description-section">
                    <h3>About</h3>
                    <p>{institutionData.description}</p>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="card profile-section">
                <h2 className="section-title">Contact Information</h2>
                <div className="contact-grid">
                  {institutionData?.contactEmail && (
                    <div className="contact-item">
                      <span className="contact-icon">📧</span>
                      <div className="contact-details">
                        <label>Email</label>
                        <a href={`mailto:${institutionData.contactEmail}`}>
                          {institutionData.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  {institutionData?.phone && (
                    <div className="contact-item">
                      <span className="contact-icon">📱</span>
                      <div className="contact-details">
                        <label>Phone</label>
                        <a href={`tel:${institutionData.phone}`}>
                          {institutionData.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {institutionData?.website && (
                    <div className="contact-item">
                      <span className="contact-icon">🌐</span>
                      <div className="contact-details">
                        <label>Website</label>
                        <a href={institutionData.website} target="_blank" rel="noopener noreferrer">
                          {institutionData.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {institutionData?.address && (
                    <div className="contact-item">
                      <span className="contact-icon">📍</span>
                      <div className="contact-details">
                        <label>Address</label>
                        <span>{institutionData.address}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Accreditation & Stats */}
              <div className="card profile-section">
                <h2 className="section-title">Accreditation & Statistics</h2>
                <div className="stats-grid">
                  <div className="stat-item">
                    <label>Accreditation Status</label>
                    <span
                      className="accreditation-status"
                      style={{ color: getAccreditationColor(institutionData?.accreditationStatus) }}
                    >
                      {institutionData?.accreditationStatus || 'Not specified'}
                    </span>
                  </div>
                  {institutionData?.accreditationBody && (
                    <div className="stat-item">
                      <label>Accreditation Body</label>
                      <span>{institutionData.accreditationBody}</span>
                    </div>
                  )}
                  {institutionData?.totalStudents && (
                    <div className="stat-item">
                      <label>Total Students</label>
                      <span className="stat-number">{institutionData.totalStudents}</span>
                    </div>
                  )}
                  {institutionData?.totalStaff && (
                    <div className="stat-item">
                      <label>Total Staff</label>
                      <span className="stat-number">{institutionData.totalStaff}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media */}
              {(institutionData?.facebook || institutionData?.twitter || institutionData?.linkedin || institutionData?.instagram) && (
                <div className="card profile-section">
                  <h2 className="section-title">Social Media</h2>
                  <div className="social-links">
                    {institutionData?.facebook && (
                      <a href={institutionData.facebook} target="_blank" rel="noopener noreferrer" className="social-link facebook">
                        Facebook
                      </a>
                    )}
                    {institutionData?.twitter && (
                      <a href={institutionData.twitter} target="_blank" rel="noopener noreferrer" className="social-link twitter">
                        Twitter
                      </a>
                    )}
                    {institutionData?.linkedin && (
                      <a href={institutionData.linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                        LinkedIn
                      </a>
                    )}
                    {institutionData?.instagram && (
                      <a href={institutionData.instagram} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-actions">
              <button
                className="btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
              <button className="btn-outline">
                Preview Public Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionProfile;
