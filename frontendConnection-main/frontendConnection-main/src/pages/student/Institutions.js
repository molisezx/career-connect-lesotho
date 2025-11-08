import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getCourses,
  getInstitutions,
  getStudentApplications,
} from "../../services/studentServices";
import "./Student.css";

const StudentInstitutions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    universities: 0,
    colleges: 0,
    institutes: 0,
    withApplications: 0,
  });

  // Define loadData function first
  const loadData = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const [institutionsRes, coursesRes, applicationsRes] = await Promise.all([
        getInstitutions(),
        getCourses(),
        getStudentApplications(user.uid),
      ]);

      if (institutionsRes.success) {
        const institutionsData = institutionsRes.data || [];
        const coursesData = coursesRes.data || [];
        const applicationsData = applicationsRes.success
          ? applicationsRes.data
          : [];

        // Get unique institution IDs from applications
        const appliedInstitutionIds = [
          ...new Set(
            applicationsData
              .filter(
                (app) =>
                  app.status === "pending" || app.status === "under_review"
              )
              .map((app) => app.institutionId)
          ),
        ];

        // Add course count and application status to each institution
        const institutionsWithDetails = institutionsData.map((institution) => {
          const institutionCourses = coursesData.filter(
            (course) => course.institutionId === institution.id
          );

          const hasApplied = appliedInstitutionIds.includes(institution.id);
          const isVerified = institution.isVerified !== false; // Default to true if not specified

          return {
            ...institution,
            coursesCount: institutionCourses.length,
            hasApplied,
            isVerified,
            availablePrograms: institutionCourses
              .map((course) => course.level)
              .filter((v, i, a) => a.indexOf(v) === i),
            featuredCourses: institutionCourses.slice(0, 3), // Show top 3 courses
          };
        });

        setInstitutions(institutionsWithDetails);
        calculateStats(institutionsWithDetails, appliedInstitutionIds.length);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (institutionsData, appliedCount) => {
    const universities = institutionsData.filter(
      (inst) => inst.type === "University"
    ).length;
    const colleges = institutionsData.filter(
      (inst) => inst.type === "College"
    ).length;
    const institutes = institutionsData.filter(
      (inst) => inst.type === "Institute"
    ).length;

    setStats({
      total: institutionsData.length,
      universities,
      colleges,
      institutes,
      withApplications: appliedCount,
    });
  };

  // Filter institutions based on search and filters
  const filteredInstitutions = institutions.filter((institution) => {
    const matchesSearch =
      institution.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      institution.type === filterType ||
      (filterType === "applied" && institution.hasApplied) ||
      (filterType === "verified" && institution.isVerified);

    return matchesSearch && matchesFilter;
  });

  const handleViewCourses = (institutionId, institutionName) => {
    navigate("/dashboard/student/courses", {
      state: {
        selectedInstitution: institutionId,
        institutionName: institutionName,
      },
    });
  };

  const handleViewDetails = (institutionId) => {
    navigate(`/dashboard/student/institution/${institutionId}`);
  };

  const handleQuickApply = (institutionId) => {
    navigate("/dashboard/student/courses", {
      state: {
        selectedInstitution: institutionId,
        quickApply: true,
      },
    });
  };

  const getInstitutionTypeColor = (type) => {
    switch (type) {
      case "University":
        return "#3B82F6";
      case "College":
        return "#10B981";
      case "Institute":
        return "#F59E0B";
      case "Polytechnic":
        return "#8B5CF6";
      case "Vocational School":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getProgramBadges = (programs) => {
    if (!programs || programs.length === 0) return null;

    return programs.slice(0, 3).map((program, index) => (
      <span key={index} className="program-badge">
        {program}
      </span>
    ));
  };

  // Use useEffect after all functions are defined
  useEffect(() => {
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <p>Loading institutions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Higher Learning Institutions</h1>
            <p>Discover and apply to institutions across Lesotho</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/student")}
            className="btn-back"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="stats-overview-grid">
        <div className="stat-card">
          <div className="stat-icon">🏛️</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Institutions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <h3>{stats.universities}</h3>
            <p>Universities</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{stats.colleges}</h3>
            <p>Colleges</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.withApplications}</h3>
            <p>Applied To</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="card">
        <div className="card-header">
          <div className="controls-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search institutions by name, location, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-controls">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Institutions</option>
                <option value="University">Universities</option>
                <option value="College">Colleges</option>
                <option value="Institute">Institutes</option>
                <option value="applied">With Applications</option>
                <option value="verified">Verified Only</option>
              </select>

              <div className="results-count">
                {filteredInstitutions.length} of {institutions.length}{" "}
                institutions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institutions Grid */}
      <div className="institutions-grid-enhanced">
        {filteredInstitutions.length > 0 ? (
          filteredInstitutions.map((institution) => (
            <div key={institution.id} className="institution-card-enhanced">
              {/* Card Header */}
              <div className="card-header-enhanced">
                <div className="institution-badge">
                  <div
                    className="institution-avatar"
                    style={{
                      backgroundColor: getInstitutionTypeColor(
                        institution.type
                      ),
                    }}
                  >
                    {institution.name?.charAt(0) || "I"}
                  </div>
                  <div className="institution-title">
                    <h3>{institution.name}</h3>
                    <div className="institution-meta">
                      <span
                        className="type-badge"
                        style={{
                          backgroundColor: getInstitutionTypeColor(
                            institution.type
                          ),
                        }}
                      >
                        {institution.type || "Education"}
                      </span>
                      {institution.isVerified && (
                        <span className="verified-badge">✓ Verified</span>
                      )}
                      {institution.hasApplied && (
                        <span className="applied-badge">📋 Applied</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="accreditation-status">
                  {institution.accreditationStatus === "accredited" && (
                    <span className="accredited">🎓 Accredited</span>
                  )}
                </div>
              </div>

              {/* Location and Description */}
              <div className="card-location">
                <span className="location-icon">📍</span>
                {institution.location || "Location not specified"}
              </div>

              {institution.description && (
                <p className="card-description">
                  {institution.description.length > 120
                    ? `${institution.description.substring(0, 120)}...`
                    : institution.description}
                </p>
              )}

              {/* Programs Overview */}
              {institution.availablePrograms &&
                institution.availablePrograms.length > 0 && (
                  <div className="programs-section">
                    <label>Available Programs:</label>
                    <div className="programs-badges">
                      {getProgramBadges(institution.availablePrograms)}
                      {institution.availablePrograms.length > 3 && (
                        <span className="more-programs">
                          +{institution.availablePrograms.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

              {/* Statistics */}
              <div className="card-stats">
                <div className="stat-item">
                  <span className="stat-value">{institution.coursesCount}</span>
                  <span className="stat-label">Courses</span>
                </div>
                {institution.established && (
                  <div className="stat-item">
                    <span className="stat-value">
                      {institution.established}
                    </span>
                    <span className="stat-label">Established</span>
                  </div>
                )}
                {institution.totalStudents && (
                  <div className="stat-item">
                    <span className="stat-value">
                      {institution.totalStudents > 1000
                        ? `${(institution.totalStudents / 1000).toFixed(1)}k`
                        : institution.totalStudents}
                    </span>
                    <span className="stat-label">Students</span>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              {(institution.contactEmail || institution.website) && (
                <div className="contact-info">
                  {institution.contactEmail && (
                    <div className="contact-item">
                      <span className="contact-icon">📧</span>
                      <span className="contact-text">
                        {institution.contactEmail}
                      </span>
                    </div>
                  )}
                  {institution.website && (
                    <div className="contact-item">
                      <span className="contact-icon">🌐</span>
                      <a
                        href={institution.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-text link"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="card-actions-enhanced">
                <button
                  className={`btn-primary ${
                    institution.coursesCount === 0 ? "disabled" : ""
                  }`}
                  onClick={() =>
                    handleViewCourses(institution.id, institution.name)
                  }
                  disabled={institution.coursesCount === 0}
                >
                  {institution.coursesCount === 0
                    ? "No Courses"
                    : `View Courses (${institution.coursesCount})`}
                </button>

                <div className="secondary-actions">
                  <button
                    className="btn-outline"
                    onClick={() => handleViewDetails(institution.id)}
                  >
                    Details
                  </button>

                  {!institution.hasApplied && institution.coursesCount > 0 && (
                    <button
                      className="btn-secondary quick-apply"
                      onClick={() => handleQuickApply(institution.id)}
                    >
                      Quick Apply
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-enhanced">
            <div className="empty-icon">🏛️</div>
            <h3>No institutions found</h3>
            <p>
              {searchTerm || filterType !== "all"
                ? `No institutions match your current filters. Try adjusting your search criteria.`
                : "No institutions are currently available in the system."}
            </p>
            {(searchTerm || filterType !== "all") && (
              <div className="empty-actions">
                <button
                  onClick={() => setSearchTerm("")}
                  className="btn-primary"
                >
                  Clear Search
                </button>
                <button
                  onClick={() => setFilterType("all")}
                  className="btn-outline"
                >
                  Show All Institutions
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="info-card">
        <h4>💡 Application Tips</h4>
        <ul>
          <li>You can apply to up to 2 courses per institution</li>
          <li>Check course requirements before applying</li>
          <li>Verified institutions are officially accredited</li>
          <li>Track your applications in the Dashboard</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentInstitutions;
