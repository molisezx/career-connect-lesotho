import { useCallback, useEffect, useState } from "react";
import { AdminServices } from "../../services/adminService";
import "./ManagementPages.css";

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    industry: "",
    employees: "",
    location: "",
    contactPerson: "",
    phone: "",
    website: "",
    description: ""
  });

  // Create the real-time listeners function with useCallback
  const setupRealTimeListeners = useCallback(() => {
    try {
      console.log("📡 Setting up real-time listeners...");

      // Listen for new company registrations
      const unsubscribeCompanies = AdminServices.subscriptions.subscribeToNewCompanies((newCompanies) => {
        console.log("📡 Real-time update received:", newCompanies);
        setCompanies(newCompanies || []);
      });

      // Listen for admin notifications with error handling
      const unsubscribeNotifications = AdminServices.subscriptions.subscribeToAdminNotifications(
        (notifs) => {
          setNotifications(notifs || []);
        },
        (error) => {
          console.warn("⚠️ Notifications subscription error (this is normal until index is created):", error);
          // Don't set error state for index issues - they're expected during development
          if (!error.message.includes('index')) {
            setError("Failed to load notifications");
          }
        }
      );

      return () => {
        console.log("📡 Cleaning up real-time listeners...");
        unsubscribeCompanies();
        if (unsubscribeNotifications) {
          unsubscribeNotifications();
        }
      };
    } catch (error) {
      console.error("❌ Error setting up real-time listeners:", error);
      return () => {}; // Return empty cleanup function on error
    }
  }, []);

  // Fetch companies and set up real-time listeners
  useEffect(() => {
    fetchCompanies();
    const cleanup = setupRealTimeListeners();

    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [setupRealTimeListeners]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("🔄 Fetching companies from database...");
      const companiesData = await AdminServices.companies.getAllCompanies();

      console.log("📊 Raw companies data received:", companiesData);
      console.log("🔢 Number of companies:", companiesData?.length || 0);

      if (companiesData) {
        companiesData.forEach((company, index) => {
          console.log(`🏢 Company ${index + 1}:`, {
            id: company.id,
            name: company.name,
            status: company.status,
            email: company.email
          });
        });
      }

      setCompanies(companiesData || []);
    } catch (err) {
      console.error("❌ Error fetching companies:", err);
      setError(err.message || "Failed to load companies");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter companies based on active filter and search term
  const filteredCompanies = companies.filter(company => {
    if (!company) return false;

    const matchesFilter = activeFilter === "all" || company.status === activeFilter;
    const matchesSearch =
      (company.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (company.industry?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (company.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (company.location?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Get companies by status for stats
  const pendingCompanies = companies.filter(company => company?.status === "pending");
  const approvedCompanies = companies.filter(company => company?.status === "approved");
  const suspendedCompanies = companies.filter(company => company?.status === "suspended");
  const rejectedCompanies = companies.filter(company => company?.status === "rejected");

  // Debug stats
  console.log("📈 Company Statistics:", {
    total: companies.length,
    pending: pendingCompanies.length,
    approved: approvedCompanies.length,
    suspended: suspendedCompanies.length,
    rejected: rejectedCompanies.length
  });

  // Get unread notifications count
  const unreadNotifications = notifications.filter(notif => !notif.read).length;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openAddModal = () => {
    setEditingCompany(null);
    setFormData({
      name: "",
      email: "",
      industry: "",
      employees: "",
      location: "",
      contactPerson: "",
      phone: "",
      website: "",
      description: ""
    });
    setShowModal(true);
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || "",
      email: company.email || "",
      industry: company.industry || "",
      employees: company.employees || "",
      location: company.location || "",
      contactPerson: company.contactPerson || "",
      phone: company.phone || "",
      website: company.website || "",
      description: company.description || ""
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCompany(null);
    setFormData({
      name: "",
      email: "",
      industry: "",
      employees: "",
      location: "",
      contactPerson: "",
      phone: "",
      website: "",
      description: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading('form');
      setError("");

      if (editingCompany) {
        // Update existing company
        await AdminServices.companies.updateCompany(editingCompany.id, formData);
        setCompanies(companies.map(company =>
          company.id === editingCompany.id
            ? { ...company, ...formData }
            : company
        ));
      } else {
        // Add new company
        const newCompanyData = {
          ...formData,
          status: "approved",
          registrationDate: new Date().toISOString().split('T')[0],
          createdAt: new Date()
        };
        const result = await AdminServices.companies.addCompany(newCompanyData);
        setCompanies(prev => [...prev, { id: result.id, ...newCompanyData }]);
      }

      closeModal();
    } catch (err) {
      setError(err.message || "Error saving company");
      console.error("❌ Error saving company:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const approveCompany = async (id) => {
    try {
      setActionLoading(id);
      setError("");
      await AdminServices.companies.approveCompany(id);

      // Update local state
      setCompanies(companies.map(company =>
        company.id === id ? { ...company, status: "approved" } : company
      ));
    } catch (err) {
      setError(err.message || "Error approving company");
      console.error("❌ Error approving company:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const rejectCompany = async (id) => {
    if (!window.confirm("Are you sure you want to reject this company? This action cannot be undone.")) {
      return;
    }

    try {
      setActionLoading(id);
      setError("");
      await AdminServices.companies.rejectCompany(id);

      // Remove from local state
      setCompanies(companies.filter(company => company.id !== id));
    } catch (err) {
      setError(err.message || "Error rejecting company");
      console.error("❌ Error rejecting company:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const suspendCompany = async (id) => {
    try {
      setActionLoading(id);
      setError("");
      await AdminServices.companies.suspendCompany(id);

      // Update local state
      setCompanies(companies.map(company =>
        company.id === id ? { ...company, status: "suspended" } : company
      ));
    } catch (err) {
      setError(err.message || "Error suspending company");
      console.error("❌ Error suspending company:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const activateCompany = async (id) => {
    try {
      setActionLoading(id);
      setError("");
      await AdminServices.companies.activateCompany(id);

      // Update local state
      setCompanies(companies.map(company =>
        company.id === id ? { ...company, status: "approved" } : company
      ));
    } catch (err) {
      setError(err.message || "Error activating company");
      console.error("❌ Error activating company:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCompany = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      return;
    }

    try {
      setActionLoading(id);
      setError("");
      await AdminServices.companies.deleteCompany(id);

      // Remove from local state
      setCompanies(companies.filter(company => company.id !== id));
    } catch (err) {
      setError(err.message || "Error deleting company");
      console.error("❌ Error deleting company:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Render company card based on status
  const renderCompanyCard = (company) => {
    if (!company) return null;

    const getStatusColor = (status) => {
      switch (status) {
        case "pending": return "pending";
        case "approved": return "approved";
        case "suspended": return "suspended";
        case "rejected": return "rejected";
        default: return "pending";
      }
    };

    const getStatusActions = (company) => {
      switch (company.status) {
        case "pending":
          return (
            <>
              <button
                className="btn-action approve"
                onClick={() => approveCompany(company.id)}
                disabled={actionLoading === company.id}
              >
                {actionLoading === company.id ? "Processing..." : "Approve"}
              </button>
              <button
                className="btn-action reject"
                onClick={() => rejectCompany(company.id)}
                disabled={actionLoading === company.id}
              >
                {actionLoading === company.id ? "Processing..." : "Reject"}
              </button>
              <button
                className="btn-action view"
                onClick={() => openEditModal(company)}
              >
                View Details
              </button>
            </>
          );
        case "approved":
          return (
            <>
              <button
                className="btn-action edit"
                onClick={() => openEditModal(company)}
                disabled={actionLoading === company.id}
              >
                Edit
              </button>
              <button
                className="btn-action suspend"
                onClick={() => suspendCompany(company.id)}
                disabled={actionLoading === company.id}
              >
                {actionLoading === company.id ? "..." : "Suspend"}
              </button>
              <button
                className="btn-action delete"
                onClick={() => deleteCompany(company.id)}
                disabled={actionLoading === company.id}
              >
                {actionLoading === company.id ? "..." : "Delete"}
              </button>
            </>
          );
        case "suspended":
          return (
            <>
              <button
                className="btn-action edit"
                onClick={() => openEditModal(company)}
                disabled={actionLoading === company.id}
              >
                Edit
              </button>
              <button
                className="btn-action approve"
                onClick={() => activateCompany(company.id)}
                disabled={actionLoading === company.id}
              >
                {actionLoading === company.id ? "..." : "Activate"}
              </button>
              <button
                className="btn-action delete"
                onClick={() => deleteCompany(company.id)}
                disabled={actionLoading === company.id}
              >
                {actionLoading === company.id ? "..." : "Delete"}
              </button>
            </>
          );
        case "rejected":
          return (
            <>
              <button
                className="btn-action delete"
                onClick={() => deleteCompany(company.id)}
                disabled={actionLoading === company.id}
              >
                {actionLoading === company.id ? "..." : "Delete"}
              </button>
              <button
                className="btn-action view"
                onClick={() => openEditModal(company)}
              >
                View Details
              </button>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div key={company.id} className={`company-card ${getStatusColor(company.status)}`}>
        <div className="company-header">
          <h3>{company.name || "Unnamed Company"}</h3>
          <span className={`status-badge ${company.status}`}>
            {company.status ? company.status.charAt(0).toUpperCase() + company.status.slice(1) : "Unknown"}
          </span>
        </div>
        <div className="company-details">
          <p><strong>Industry:</strong> {company.industry || "Not specified"}</p>
          <p><strong>Employees:</strong> {company.employees || "Not specified"}</p>
          <p><strong>Contact:</strong> {company.contactPerson || "Not specified"}</p>
          <p><strong>Email:</strong> {company.email || "No email"}</p>
          <p><strong>Location:</strong> {company.location || "Not specified"}</p>
          <p><strong>Registered:</strong> {
            company.createdAt?.toDate?.()
              ? new Date(company.createdAt.toDate()).toLocaleDateString()
              : company.registrationDate
                ? new Date(company.registrationDate).toLocaleDateString()
                : "Unknown"
          }</p>
          {company.phone && <p><strong>Phone:</strong> {company.phone}</p>}
          {company.website && <p><strong>Website:</strong> {company.website}</p>}
        </div>
        {company.description && (
          <div className="company-description">
            <p>{company.description}</p>
          </div>
        )}
        <div className="company-actions">
          {getStatusActions(company)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="management-page loading">
        <div className="loading-spinner"></div>
        <p>Loading companies...</p>
      </div>
    );
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Company Management</h1>
            <p>Manage company accounts, approvals, and status</p>
          </div>
          {unreadNotifications > 0 && (
            <div className="notification-badge">
              {unreadNotifications} new company registration(s)
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="close-error" onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* Page Actions */}
      <div className="page-actions">
        <div className="action-group">
          <button className="btn-primary" onClick={openAddModal}>
            + Add New Company
          </button>
          <button className="btn-secondary" onClick={fetchCompanies}>
            Refresh
          </button>
        </div>
        <div className="filter-group">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <label>Filter by Status:</label>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="all">All Companies ({companies.length})</option>
            <option value="pending">Pending ({pendingCompanies.length})</option>
            <option value="approved">Approved ({approvedCompanies.length})</option>
            <option value="suspended">Suspended ({suspendedCompanies.length})</option>
            <option value="rejected">Rejected ({rejectedCompanies.length})</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-item" onClick={() => setActiveFilter("all")} style={{cursor: 'pointer'}}>
          <span className="stat-number">{companies.length}</span>
          <span className="stat-label">Total Companies</span>
        </div>
        <div className="stat-item" onClick={() => setActiveFilter("pending")} style={{cursor: 'pointer'}}>
          <span className="stat-number">{pendingCompanies.length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item" onClick={() => setActiveFilter("approved")} style={{cursor: 'pointer'}}>
          <span className="stat-number">{approvedCompanies.length}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-item" onClick={() => setActiveFilter("suspended")} style={{cursor: 'pointer'}}>
          <span className="stat-number">{suspendedCompanies.length}</span>
          <span className="stat-label">Suspended</span>
        </div>
        <div className="stat-item" onClick={() => setActiveFilter("rejected")} style={{cursor: 'pointer'}}>
          <span className="stat-number">{rejectedCompanies.length}</span>
          <span className="stat-label">Rejected</span>
        </div>
      </div>

      {/* Main Content with Filtered Display */}
      <div className="companies-content">
        {activeFilter === "all" && (
          <>
            {/* Pending Approvals Section */}
            {pendingCompanies.length > 0 && (
              <section className="section">
                <div className="section-header">
                  <h2>Pending Approvals ({pendingCompanies.length})</h2>
                  <div className="alert-badge">Action Required</div>
                </div>
                <div className="companies-grid">
                  {pendingCompanies.map(company => renderCompanyCard(company))}
                </div>
              </section>
            )}

            {/* Approved Companies Section */}
            {approvedCompanies.length > 0 && (
              <section className="section">
                <div className="section-header">
                  <h2>Approved Companies ({approvedCompanies.length})</h2>
                  <span className="section-subtitle">Active and verified companies</span>
                </div>
                <div className="companies-grid">
                  {approvedCompanies.map(company => renderCompanyCard(company))}
                </div>
              </section>
            )}

            {/* Suspended Companies Section */}
            {suspendedCompanies.length > 0 && (
              <section className="section">
                <div className="section-header">
                  <h2>Suspended Companies ({suspendedCompanies.length})</h2>
                  <span className="section-subtitle">Temporarily deactivated companies</span>
                </div>
                <div className="companies-grid">
                  {suspendedCompanies.map(company => renderCompanyCard(company))}
                </div>
              </section>
            )}

            {/* Rejected Companies Section */}
            {rejectedCompanies.length > 0 && (
              <section className="section">
                <div className="section-header">
                  <h2>Rejected Companies ({rejectedCompanies.length})</h2>
                  <span className="section-subtitle">Companies that didn't meet requirements</span>
                </div>
                <div className="companies-grid">
                  {rejectedCompanies.map(company => renderCompanyCard(company))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Filtered View */}
        {activeFilter !== "all" && (
          <section className="section">
            <div className="section-header">
              <h2>
                {activeFilter === "pending" && `Pending Approvals (${pendingCompanies.length})`}
                {activeFilter === "approved" && `Approved Companies (${approvedCompanies.length})`}
                {activeFilter === "suspended" && `Suspended Companies (${suspendedCompanies.length})`}
                {activeFilter === "rejected" && `Rejected Companies (${rejectedCompanies.length})`}
              </h2>
              {activeFilter === "pending" && <div className="alert-badge">Action Required</div>}
            </div>

            {filteredCompanies.length > 0 ? (
              <div className="companies-grid">
                {filteredCompanies.map(company => renderCompanyCard(company))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No Companies Found</h3>
                <p>
                  {searchTerm
                    ? `No ${activeFilter} companies match your search criteria.`
                    : `There are no ${activeFilter} companies in the system.`
                  }
                </p>
                {activeFilter === "pending" && (
                  <button className="btn-secondary" onClick={fetchCompanies}>
                    Check for New Registrations
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* Empty State for All Companies */}
        {companies.length === 0 && !loading && (
          <div className="empty-state">
            <h3>No Companies Found</h3>
            <p>There are no companies registered in the system yet.</p>
            <button className="btn-primary" onClick={openAddModal}>
              Add First Company
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Company Modal */}
      {showModal && (
        <div className="form-modal">
          <div className="form-content">
            <h3>{editingCompany ? 'Edit Company' : 'Add New Company'}</h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Company Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="industry">Industry *</label>
                  <input
                    type="text"
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employees">Employee Range</label>
                  <select
                    id="employees"
                    name="employees"
                    value={formData.employees}
                    onChange={handleInputChange}
                  >
                    <option value="">Select range</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="501-1000">501-1000</option>
                    <option value="1000+">1000+</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contactPerson">Contact Person *</label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="website">Website</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Brief description of the company..."
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={actionLoading === 'form'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading === 'form'}
                >
                  {actionLoading === 'form' ? 'Saving...' : (editingCompany ? 'Update Company' : 'Add Company')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
