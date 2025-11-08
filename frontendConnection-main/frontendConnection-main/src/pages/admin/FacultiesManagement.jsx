import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  addFaculty,
  deleteFaculty,
  getFaculties,
  getInstitutions,
  updateFaculty
} from "../../services/adminService";
import "./ManagementPages.css";

const FacultiesManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [filterInstitution, setFilterInstitution] = useState("all");
  const [newFaculty, setNewFaculty] = useState({
    name: "",
    institutionId: "",
    institutionName: "",
    dean: "",
    description: "",
    contactEmail: "",
    phone: "",
    established: new Date().getFullYear().toString()
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [facultiesData, institutionsData] = await Promise.all([
        getFaculties(),
        getInstitutions()
      ]);
      setFaculties(facultiesData);
      setInstitutions(institutionsData);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      // Find the selected institution
      const selectedInstitution = institutions.find(inst => inst.id === newFaculty.institutionId);
      if (!selectedInstitution) {
        setError("Please select a valid institution.");
        return;
      }

      const facultyData = {
        name: newFaculty.name,
        institutionId: newFaculty.institutionId,
        institutionName: selectedInstitution.name,
        dean: newFaculty.dean,
        description: newFaculty.description,
        contactEmail: newFaculty.contactEmail,
        phone: newFaculty.phone,
        established: newFaculty.established,
        courses: 0,
        students: 0,
        status: "active",
        createdAt: new Date()
      };

      await addFaculty(facultyData);

      // Reset form
      setNewFaculty({
        name: "",
        institutionId: "",
        institutionName: "",
        dean: "",
        description: "",
        contactEmail: "",
        phone: "",
        established: new Date().getFullYear().toString()
      });
      setShowAddForm(false);
      await loadData(); // Reload the list
    } catch (error) {
      console.error("Error adding faculty:", error);
      setError("Failed to add faculty. Please try again.");
    }
  };

  const handleEditFaculty = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      const selectedInstitution = institutions.find(inst => inst.id === editingFaculty.institutionId);

      await updateFaculty(editingFaculty.id, {
        name: editingFaculty.name,
        institutionId: editingFaculty.institutionId,
        institutionName: selectedInstitution?.name || editingFaculty.institutionName,
        dean: editingFaculty.dean,
        description: editingFaculty.description,
        contactEmail: editingFaculty.contactEmail,
        phone: editingFaculty.phone,
        established: editingFaculty.established
      });

      setShowEditForm(false);
      setEditingFaculty(null);
      await loadData(); // Reload the list
    } catch (error) {
      console.error("Error updating faculty:", error);
      setError("Failed to update faculty. Please try again.");
    }
  };

  const handleDeleteFaculty = async (id) => {
    if (window.confirm("Are you sure you want to delete this faculty? This will also remove all associated courses.")) {
      try {
        setError(null);
        await deleteFaculty(id);
        await loadData(); // Reload the list
      } catch (error) {
        console.error("Error deleting faculty:", error);
        setError("Failed to delete faculty. Please try again.");
      }
    }
  };

  const handleToggleStatus = async (faculty) => {
    try {
      setError(null);
      const newStatus = faculty.status === "active" ? "inactive" : "active";
      await updateFaculty(faculty.id, { status: newStatus });
      await loadData(); // Reload the list
    } catch (error) {
      console.error("Error updating faculty status:", error);
      setError("Failed to update faculty status. Please try again.");
    }
  };

  const startEditFaculty = (faculty) => {
    setEditingFaculty({ ...faculty });
    setShowEditForm(true);
  };

  const filteredFaculties = filterInstitution === "all"
    ? faculties
    : faculties.filter(faculty => faculty.institutionId === filterInstitution);

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
        <p>Loading faculties...</p>
      </div>
    );
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <h1>Manage Faculties</h1>
        <p>Add and manage faculties across all institutions</p>
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
            onClick={() => setShowAddForm(true)}
          >
            + Add Faculty
          </button>
          <button
            className="btn-secondary"
            onClick={loadData}
          >
            Refresh
          </button>
        </div>

        <div className="filter-group">
          <label>Filter by Institution:</label>
          <select
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
          >
            <option value="all">All Institutions</option>
            {institutions.map(institution => (
              <option key={institution.id} value={institution.id}>
                {institution.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Faculty Modal */}
      {showAddForm && (
        <div className="form-modal">
          <div className="form-content">
            <h3>Add New Faculty</h3>
            <form onSubmit={handleAddFaculty}>
              <div className="form-group">
                <label>Faculty Name *</label>
                <input
                  type="text"
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty({...newFaculty, name: e.target.value})}
                  required
                  placeholder="Enter faculty name"
                />
              </div>
              <div className="form-group">
                <label>Institution *</label>
                <select
                  value={newFaculty.institutionId}
                  onChange={(e) => {
                    const selectedInstitution = institutions.find(inst => inst.id === e.target.value);
                    setNewFaculty({
                      ...newFaculty,
                      institutionId: e.target.value,
                      institutionName: selectedInstitution?.name || ""
                    });
                  }}
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
                <label>Dean Name *</label>
                <input
                  type="text"
                  value={newFaculty.dean}
                  onChange={(e) => setNewFaculty({...newFaculty, dean: e.target.value})}
                  required
                  placeholder="Enter dean's full name"
                />
              </div>
              <div className="form-group">
                <label>Established Year</label>
                <input
                  type="number"
                  value={newFaculty.established}
                  onChange={(e) => setNewFaculty({...newFaculty, established: e.target.value})}
                  min="1800"
                  max={new Date().getFullYear()}
                  placeholder="e.g., 1990"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newFaculty.description}
                  onChange={(e) => setNewFaculty({...newFaculty, description: e.target.value})}
                  rows="3"
                  placeholder="Brief description of the faculty"
                />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={newFaculty.contactEmail}
                  onChange={(e) => setNewFaculty({...newFaculty, contactEmail: e.target.value})}
                  placeholder="faculty@institution.edu"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newFaculty.phone}
                  onChange={(e) => setNewFaculty({...newFaculty, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {showEditForm && editingFaculty && (
        <div className="form-modal">
          <div className="form-content">
            <h3>Edit Faculty</h3>
            <form onSubmit={handleEditFaculty}>
              <div className="form-group">
                <label>Faculty Name *</label>
                <input
                  type="text"
                  value={editingFaculty.name}
                  onChange={(e) => setEditingFaculty({...editingFaculty, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Institution *</label>
                <select
                  value={editingFaculty.institutionId}
                  onChange={(e) => setEditingFaculty({...editingFaculty, institutionId: e.target.value})}
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
                <label>Dean Name *</label>
                <input
                  type="text"
                  value={editingFaculty.dean}
                  onChange={(e) => setEditingFaculty({...editingFaculty, dean: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Established Year</label>
                <input
                  type="number"
                  value={editingFaculty.established}
                  onChange={(e) => setEditingFaculty({...editingFaculty, established: e.target.value})}
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingFaculty.description || ''}
                  onChange={(e) => setEditingFaculty({...editingFaculty, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={editingFaculty.contactEmail || ''}
                  onChange={(e) => setEditingFaculty({...editingFaculty, contactEmail: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={editingFaculty.phone || ''}
                  onChange={(e) => setEditingFaculty({...editingFaculty, phone: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowEditForm(false);
                  setEditingFaculty(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="content-card">
        {faculties.length === 0 ? (
          <div className="empty-state">
            <h3>No Faculties Found</h3>
            <p>Get started by adding your first faculty to an institution.</p>
            <button
              className="btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              Add First Faculty
            </button>
          </div>
        ) : (
          <>
            <div className="table-info">
              <p>Showing {filteredFaculties.length} of {faculties.length} faculties</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>Institution</th>
                    <th>Dean</th>
                    <th>Courses</th>
                    <th>Students</th>
                    <th>Established</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculties.map(faculty => (
                    <tr key={faculty.id}>
                      <td>
                        <div className="faculty-name">
                          <strong>{faculty.name}</strong>
                          {faculty.description && (
                            <small>{faculty.description}</small>
                          )}
                        </div>
                      </td>
                      <td>{faculty.institutionName}</td>
                      <td>{faculty.dean}</td>
                      <td>
                        <span className="count-badge">{faculty.courses || 0}</span>
                      </td>
                      <td>
                        <span className="count-badge">{faculty.students || 0}</span>
                      </td>
                      <td>{faculty.established || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${faculty.status || 'active'}`}>
                          {faculty.status || 'active'}
                        </span>
                      </td>
                      <td>
                        {formatDate(faculty.createdAt)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-action edit"
                            onClick={() => startEditFaculty(faculty)}
                          >
                            Edit
                          </button>
                          <button
                            className={`btn-action ${faculty.status === 'active' ? 'deactivate' : 'activate'}`}
                            onClick={() => handleToggleStatus(faculty)}
                          >
                            {faculty.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <Link
                            to={`/dashboard/admin/faculties/${faculty.id}/courses`}
                            className="btn-action view"
                          >
                            Courses
                          </Link>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDeleteFaculty(faculty.id)}
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
          </>
        )}
      </div>
    </div>
  );
};

export default FacultiesManagement;
