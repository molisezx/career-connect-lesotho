import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addInstitution,
  deleteInstitution,
  getInstitutions,
  updateInstitution
} from "../../services/adminService";
import "./ManagementPages.css";

const InstitutionsManagement = () => {
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [newInstitution, setNewInstitution] = useState({
    name: "",
    type: "Public",
    location: "",
    established: "",
    description: "",
    website: "",
    contactEmail: "",
    phone: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const institutionsData = await getInstitutions();
      setInstitutions(institutionsData);
    } catch (error) {
      console.error("Error loading institutions:", error);
      setError("Failed to load institutions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInstitution = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await addInstitution(newInstitution);
      setNewInstitution({
        name: "",
        type: "Public",
        location: "",
        established: "",
        description: "",
        website: "",
        contactEmail: "",
        phone: ""
      });
      setShowAddForm(false);
      await loadInstitutions(); // Reload the list
    } catch (error) {
      console.error("Error adding institution:", error);
      setError("Failed to add institution. Please try again.");
    }
  };

  const handleEditInstitution = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await updateInstitution(editingInstitution.id, {
        name: editingInstitution.name,
        type: editingInstitution.type,
        location: editingInstitution.location,
        established: editingInstitution.established,
        description: editingInstitution.description,
        website: editingInstitution.website,
        contactEmail: editingInstitution.contactEmail,
        phone: editingInstitution.phone
      });
      setShowEditForm(false);
      setEditingInstitution(null);
      await loadInstitutions(); // Reload the list
    } catch (error) {
      console.error("Error updating institution:", error);
      setError("Failed to update institution. Please try again.");
    }
  };

  const handleDeleteInstitution = async (id) => {
    if (window.confirm("Are you sure you want to delete this institution? This action cannot be undone.")) {
      try {
        setError(null);
        await deleteInstitution(id);
        await loadInstitutions(); // Reload the list
      } catch (error) {
        console.error("Error deleting institution:", error);
        setError("Failed to delete institution. Please try again.");
      }
    }
  };

  const handleToggleStatus = async (institution) => {
    try {
      setError(null);
      const newStatus = institution.status === "active" ? "inactive" : "active";
      await updateInstitution(institution.id, { status: newStatus });
      await loadInstitutions(); // Reload the list
    } catch (error) {
      console.error("Error updating institution status:", error);
      setError("Failed to update institution status. Please try again.");
    }
  };

  const startEditInstitution = (institution) => {
    setEditingInstitution({ ...institution });
    setShowEditForm(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="management-page loading">
        <div className="loading-spinner"></div>
        <p>Loading institutions...</p>
      </div>
    );
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <h1>Manage Institutions</h1>
        <p>Add, edit, or remove higher learning institutions</p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      <div className="page-actions">
        <button
          className="btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          + Add Institution
        </button>
        <button
          className="btn-secondary"
          onClick={loadInstitutions}
        >
          Refresh
        </button>
      </div>

      {/* Add Institution Modal */}
      {showAddForm && (
        <div className="form-modal">
          <div className="form-content">
            <h3>Add New Institution</h3>
            <form onSubmit={handleAddInstitution}>
              <div className="form-group">
                <label>Institution Name *</label>
                <input
                  type="text"
                  value={newInstitution.name}
                  onChange={(e) => setNewInstitution({...newInstitution, name: e.target.value})}
                  required
                  placeholder="Enter institution name"
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={newInstitution.type}
                  onChange={(e) => setNewInstitution({...newInstitution, type: e.target.value})}
                  required
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                  <option value="Government">Government</option>
                  <option value="Semi-Government">Semi-Government</option>
                </select>
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={newInstitution.location}
                  onChange={(e) => setNewInstitution({...newInstitution, location: e.target.value})}
                  required
                  placeholder="City, State, Country"
                />
              </div>
              <div className="form-group">
                <label>Established Year *</label>
                <input
                  type="number"
                  value={newInstitution.established}
                  onChange={(e) => setNewInstitution({...newInstitution, established: e.target.value})}
                  required
                  min="1800"
                  max={new Date().getFullYear()}
                  placeholder="e.g., 1985"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newInstitution.description}
                  onChange={(e) => setNewInstitution({...newInstitution, description: e.target.value})}
                  rows="3"
                  placeholder="Brief description of the institution"
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={newInstitution.website}
                  onChange={(e) => setNewInstitution({...newInstitution, website: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={newInstitution.contactEmail}
                  onChange={(e) => setNewInstitution({...newInstitution, contactEmail: e.target.value})}
                  placeholder="contact@institution.edu"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newInstitution.phone}
                  onChange={(e) => setNewInstitution({...newInstitution, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Institution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Institution Modal */}
      {showEditForm && editingInstitution && (
        <div className="form-modal">
          <div className="form-content">
            <h3>Edit Institution</h3>
            <form onSubmit={handleEditInstitution}>
              <div className="form-group">
                <label>Institution Name *</label>
                <input
                  type="text"
                  value={editingInstitution.name}
                  onChange={(e) => setEditingInstitution({...editingInstitution, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={editingInstitution.type}
                  onChange={(e) => setEditingInstitution({...editingInstitution, type: e.target.value})}
                  required
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                  <option value="Government">Government</option>
                  <option value="Semi-Government">Semi-Government</option>
                </select>
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={editingInstitution.location}
                  onChange={(e) => setEditingInstitution({...editingInstitution, location: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Established Year *</label>
                <input
                  type="number"
                  value={editingInstitution.established}
                  onChange={(e) => setEditingInstitution({...editingInstitution, established: e.target.value})}
                  required
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingInstitution.description || ''}
                  onChange={(e) => setEditingInstitution({...editingInstitution, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={editingInstitution.website || ''}
                  onChange={(e) => setEditingInstitution({...editingInstitution, website: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={editingInstitution.contactEmail || ''}
                  onChange={(e) => setEditingInstitution({...editingInstitution, contactEmail: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={editingInstitution.phone || ''}
                  onChange={(e) => setEditingInstitution({...editingInstitution, phone: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowEditForm(false);
                  setEditingInstitution(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Institution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="content-card">
        {institutions.length === 0 ? (
          <div className="empty-state">
            <h3>No Institutions Found</h3>
            <p>Get started by adding your first institution.</p>
            <button
              className="btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              Add First Institution
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Established</th>
                  <th>Faculties</th>
                  <th>Courses</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map(institution => (
                  <tr key={institution.id}>
                    <td>
                      <div className="institution-name">
                        <strong>{institution.name}</strong>
                        {institution.description && (
                          <small>{institution.description}</small>
                        )}
                      </div>
                    </td>
                    <td>{institution.type}</td>
                    <td>{institution.location}</td>
                    <td>{institution.established}</td>
                    <td>{institution.faculties || 0}</td>
                    <td>{institution.courses || 0}</td>
                    <td>
                      <span className={`status-badge ${institution.status || 'pending'}`}>
                        {institution.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      {formatDate(institution.createdAt)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action edit"
                          onClick={() => startEditInstitution(institution)}
                        >
                          Edit
                        </button>
                        <button
                          className={`btn-action ${institution.status === 'active' ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleStatus(institution)}
                        >
                          {institution.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <Link
                          to={`/dashboard/admin/institutions/${institution.id}/faculties`}
                          className="btn-action view"
                        >
                          Faculties
                        </Link>
                        <button
                          className="btn-action delete"
                          onClick={() => handleDeleteInstitution(institution.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionsManagement;
