import { useEffect, useState } from "react";
import {
  addAdmission,
  deleteAdmission,
  getAdmissions,
  getFaculties,
  getInstitutions,
  updateAdmissionStatus
} from "../../services/adminService";
import "./ManagementPages.css";

const AdmissionsManagement = () => {
  const [admissions, setAdmissions] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [filteredFaculties, setFilteredFaculties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [newAdmission, setNewAdmission] = useState({
    title: "",
    institutionId: "",
    facultyId: "",
    description: "",
    startDate: "",
    endDate: "",
    requirements: "",
    seats: "",
    applicationFee: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [admissionsData, institutionsData, facultiesData] = await Promise.all([
        getAdmissions(),
        getInstitutions(),
        getFaculties()
      ]);
      setAdmissions(admissionsData);
      setInstitutions(institutionsData);
      setFaculties(facultiesData);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load admissions data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstitutionChange = (institutionId) => {
    const institutionFaculties = faculties.filter(faculty => faculty.institutionId === institutionId);
    setFilteredFaculties(institutionFaculties);
    setNewAdmission({
      ...newAdmission,
      institutionId,
      facultyId: "" // Reset faculty when institution changes
    });
  };

  const handlePublishAdmission = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      // Validate dates
      const startDate = new Date(newAdmission.startDate);
      const endDate = new Date(newAdmission.endDate);

      if (startDate >= endDate) {
        setError("End date must be after start date.");
        return;
      }

      if (startDate < new Date()) {
        setError("Start date cannot be in the past.");
        return;
      }

      // Find institution and faculty names
      const selectedInstitution = institutions.find(inst => inst.id === newAdmission.institutionId);
      const selectedFaculty = faculties.find(faculty => faculty.id === newAdmission.facultyId);

      if (!selectedInstitution) {
        setError("Please select a valid institution.");
        return;
      }

      const admissionData = {
        title: newAdmission.title,
        institutionId: newAdmission.institutionId,
        institutionName: selectedInstitution.name,
        facultyId: newAdmission.facultyId,
        facultyName: selectedFaculty?.name || "All Faculties",
        description: newAdmission.description,
        requirements: newAdmission.requirements,
        startDate: new Date(newAdmission.startDate),
        endDate: new Date(newAdmission.endDate),
        seats: parseInt(newAdmission.seats) || 0,
        applicationFee: parseFloat(newAdmission.applicationFee) || 0,
        status: "upcoming"
      };

      await addAdmission(admissionData);

      // Reset form
      setNewAdmission({
        title: "",
        institutionId: "",
        facultyId: "",
        description: "",
        startDate: "",
        endDate: "",
        requirements: "",
        seats: "",
        applicationFee: ""
      });
      setFilteredFaculties([]);
      setShowPublishForm(false);
      await loadData(); // Reload the list
    } catch (error) {
      console.error("Error publishing admission:", error);
      setError("Failed to publish admission. Please try again.");
    }
  };

  const handleStatusChange = async (admissionId, newStatus) => {
    try {
      setError(null);
      await updateAdmissionStatus(admissionId, newStatus);
      await loadData(); // Reload the list
    } catch (error) {
      console.error("Error updating admission status:", error);
      setError("Failed to update admission status. Please try again.");
    }
  };

  const handleDeleteAdmission = async (id) => {
    if (window.confirm("Are you sure you want to delete this admission? This action cannot be undone.")) {
      try {
        setError(null);
        await deleteAdmission(id);
        await loadData(); // Reload the list
      } catch (error) {
        console.error("Error deleting admission:", error);
        setError("Failed to delete admission. Please try again.");
      }
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'active';
      case 'completed': return 'completed';
      case 'upcoming': return 'upcoming';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  const isActionDisabled = (admission) => {
    const now = new Date();
    const endDate = admission.endDate?.toDate ? admission.endDate.toDate() : new Date(admission.endDate);
    return now > endDate && admission.status === 'active';
  };

  if (isLoading) {
    return (
      <div className="management-page loading">
        <div className="loading-spinner"></div>
        <p>Loading admissions...</p>
      </div>
    );
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <h1>Admissions Management</h1>
        <p>Publish and manage admission announcements</p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      <div className="page-actions">
        <div className="action-group">
          <button
            className="btn-primary"
            onClick={() => setShowPublishForm(true)}
          >
            📢 Publish Admission
          </button>
          <button
            className="btn-secondary"
            onClick={loadData}
          >
            Refresh
          </button>
        </div>

        <div className="stats-overview">
          <div className="stat-item">
            <span className="stat-number">{admissions.filter(a => a.status === 'upcoming').length}</span>
            <span className="stat-label">Upcoming</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{admissions.filter(a => a.status === 'active').length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{admissions.filter(a => a.status === 'completed').length}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Publish Admission Modal */}
      {showPublishForm && (
        <div className="form-modal">
          <div className="form-content">
            <h3>Publish New Admission</h3>
            <form onSubmit={handlePublishAdmission}>
              <div className="form-group">
                <label>Admission Title *</label>
                <input
                  type="text"
                  value={newAdmission.title}
                  onChange={(e) => setNewAdmission({...newAdmission, title: e.target.value})}
                  placeholder="e.g., Fall 2024 Undergraduate Admissions"
                  required
                />
              </div>

              <div className="form-group">
                <label>Institution *</label>
                <select
                  value={newAdmission.institutionId}
                  onChange={(e) => handleInstitutionChange(e.target.value)}
                  required
                >
                  <option value="">Select Institution</option>
                  {institutions.map(institution => (
                    <option key={institution.id} value={institution.id}>
                      {institution.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Faculty/Program *</label>
                <select
                  value={newAdmission.facultyId}
                  onChange={(e) => setNewAdmission({...newAdmission, facultyId: e.target.value})}
                  required
                  disabled={!newAdmission.institutionId}
                >
                  <option value="">Select Faculty</option>
                  <option value="all">All Faculties</option>
                  {filteredFaculties.map(faculty => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
                {!newAdmission.institutionId && (
                  <small className="form-hint">Please select an institution first</small>
                )}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newAdmission.description}
                  onChange={(e) => setNewAdmission({...newAdmission, description: e.target.value})}
                  rows="3"
                  placeholder="Describe the admission program, benefits, etc."
                />
              </div>

              <div className="form-group">
                <label>Requirements</label>
                <textarea
                  value={newAdmission.requirements}
                  onChange={(e) => setNewAdmission({...newAdmission, requirements: e.target.value})}
                  rows="2"
                  placeholder="List the admission requirements"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={newAdmission.startDate}
                    onChange={(e) => setNewAdmission({...newAdmission, startDate: e.target.value})}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={newAdmission.endDate}
                    onChange={(e) => setNewAdmission({...newAdmission, endDate: e.target.value})}
                    required
                    min={newAdmission.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Available Seats</label>
                  <input
                    type="number"
                    value={newAdmission.seats}
                    onChange={(e) => setNewAdmission({...newAdmission, seats: e.target.value})}
                    placeholder="0 for unlimited"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Application Fee ($)</label>
                  <input
                    type="number"
                    value={newAdmission.applicationFee}
                    onChange={(e) => setNewAdmission({...newAdmission, applicationFee: e.target.value})}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowPublishForm(false);
                  setFilteredFaculties([]);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Publish Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="content-card">
        {admissions.length === 0 ? (
          <div className="empty-state">
            <h3>No Admissions Found</h3>
            <p>Get started by publishing your first admission announcement.</p>
            <button
              className="btn-primary"
              onClick={() => setShowPublishForm(true)}
            >
              Publish First Admission
            </button>
          </div>
        ) : (
          <div className="admissions-grid">
            {admissions.map(admission => (
              <div key={admission.id} className={`admission-card status-${admission.status}`}>
                <div className="admission-header">
                  <h3>{admission.title}</h3>
                  <span className={`status-badge ${getStatusBadgeVariant(admission.status)}`}>
                    {admission.status}
                  </span>
                </div>

                <div className="admission-details">
                  <div className="detail-item">
                    <span className="detail-label">Institution:</span>
                    <span className="detail-value">{admission.institutionName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Faculty:</span>
                    <span className="detail-value">{admission.facultyName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">
                      {formatDate(admission.startDate)} to {formatDate(admission.endDate)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Applicants:</span>
                    <span className="applicant-count">{admission.applicants || 0}</span>
                  </div>
                  {admission.seats > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Seats:</span>
                      <span className="detail-value">{admission.seats}</span>
                    </div>
                  )}
                  {admission.applicationFee > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Fee:</span>
                      <span className="detail-value">M{admission.applicationFee}</span>
                    </div>
                  )}
                </div>

                {admission.description && (
                  <div className="admission-description">
                    <p>{admission.description}</p>
                  </div>
                )}

                <div className="admission-actions">
                  <button className="btn-action view">
                    View Applicants ({admission.applicants || 0})
                  </button>

                  {admission.status === "upcoming" && (
                    <button
                      className="btn-action start"
                      onClick={() => handleStatusChange(admission.id, "active")}
                      disabled={isActionDisabled(admission)}
                    >
                      Start Admission
                    </button>
                  )}

                  {admission.status === "active" && (
                    <button
                      className="btn-action complete"
                      onClick={() => handleStatusChange(admission.id, "completed")}
                    >
                      Complete
                    </button>
                  )}

                  {(admission.status === "upcoming" || admission.status === "completed") && (
                    <button
                      className="btn-action cancel"
                      onClick={() => handleStatusChange(admission.id, "cancelled")}
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    className="btn-action delete"
                    onClick={() => handleDeleteAdmission(admission.id)}
                  >
                    Delete
                  </button>
                </div>

                <div className="admission-footer">
                  <span className="created-date">
                    Published: {formatDate(admission.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdmissionsManagement;
