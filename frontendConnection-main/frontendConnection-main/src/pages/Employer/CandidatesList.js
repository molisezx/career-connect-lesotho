import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./employer-dashboard.css";

const CandidatesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    role: "",
    experience: "",
    status: "",
    skills: "",
  });

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [searchTerm, filters, candidates]);

  const loadCandidates = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockCandidates = [
          {
            id: 1,
            name: "Thato Molise",
            email: "thato.molise@email.com",
            phone: "+266 1234 5678",
            role: "Senior Developer",
            experience: "5 years",
            skills: ["React", "Node.js", "TypeScript", "MongoDB"],
            status: "shortlisted",
            match: 95,
            location: "Maseru",
            education: "BSc Computer Science, NUL",
            lastActive: "2 hours ago",
            salaryExpectation: "M25,000 - M30,000",
          },
          {
            id: 2,
            name: "Lerato Mokoena",
            email: "lerato.mokoena@email.com",
            phone: "+266 2345 6789",
            role: "Product Manager",
            experience: "4 years",
            skills: ["Agile", "Scrum", "JIRA", "Product Strategy"],
            status: "interview",
            match: 88,
            location: "Maseru",
            education: "MBA, Limkokwing University",
            lastActive: "1 day ago",
            salaryExpectation: "M30,000 - M35,000",
          },
          {
            id: 3,
            name: "Mpho Sebata",
            email: "mpho.sebata@email.com",
            phone: "+266 3456 7890",
            role: "Data Analyst",
            experience: "3 years",
            skills: ["Python", "SQL", "Tableau", "Excel"],
            status: "new",
            match: 82,
            location: "Maseru",
            education: "BSc Statistics, NUL",
            lastActive: "3 days ago",
            salaryExpectation: "M18,000 - M22,000",
          },
          {
            id: 4,
            name: "Kabelo Nkosi",
            email: "kabelo.nkosi@email.com",
            phone: "+266 4567 8901",
            role: "UX Designer",
            experience: "4 years",
            skills: ["Figma", "UI/UX", "Prototyping", "User Research"],
            status: "hired",
            match: 90,
            location: "Maseru",
            education: "BDes Graphic Design, Limkokwing",
            lastActive: "1 week ago",
            salaryExpectation: "M20,000 - M25,000",
          },
          {
            id: 5,
            name: "Anna Motaung",
            email: "anna.motaung@email.com",
            phone: "+266 5678 9012",
            role: "Frontend Developer",
            experience: "2 years",
            skills: ["React", "JavaScript", "CSS", "HTML5"],
            status: "new",
            match: 78,
            location: "Maseru",
            education: "Diploma in IT, COM",
            lastActive: "Today",
            salaryExpectation: "M15,000 - M18,000",
          },
        ];
        setCandidates(mockCandidates);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading candidates:", error);
      setIsLoading(false);
    }
  };

  const filterCandidates = () => {
    let filtered = candidates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.skills.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter((candidate) =>
        candidate.role.toLowerCase().includes(filters.role.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(
        (candidate) => candidate.status === filters.status
      );
    }

    // Experience filter
    if (filters.experience) {
      filtered = filtered.filter((candidate) =>
        candidate.experience.includes(filters.experience)
      );
    }

    setFilteredCandidates(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      role: "",
      experience: "",
      status: "",
      skills: "",
    });
    setSearchTerm("");
  };

  const CandidateCard = ({ candidate }) => (
    <div className="candidate-card">
      <div className="candidate-header">
        <div className="candidate-avatar">
          {candidate.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="candidate-info">
          <h4>{candidate.name}</h4>
          <p>{candidate.role}</p>
          <span className="candidate-experience">{candidate.experience}</span>
          <span className="candidate-location">📍 {candidate.location}</span>
        </div>
        <div className="candidate-match">
          <span className="match-score">{candidate.match}%</span>
          <span className="match-label">Match</span>
        </div>
      </div>

      <div className="candidate-skills">
        {candidate.skills.map((skill, index) => (
          <span key={index} className="skill-tag">
            {skill}
          </span>
        ))}
      </div>

      <div className="candidate-details">
        <div className="detail-item">
          <span className="detail-label">Education:</span>
          <span>{candidate.education}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Salary Expectation:</span>
          <span>{candidate.salaryExpectation}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Last Active:</span>
          <span>{candidate.lastActive}</span>
        </div>
      </div>

      <div className="candidate-footer">
        <span className={`status-badge ${candidate.status}`}>
          {candidate.status}
        </span>
        <div className="candidate-actions">
          <button
            className="btn-action view"
            onClick={() =>
              navigate(`/dashboard/employer/candidates/${candidate.id}`)
            }
          >
            View Profile
          </button>
          <button className="btn-action contact">Contact</button>
          <button className="btn-action shortlist">Shortlist</button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="candidates-list loading">
        <div className="loading-spinner"></div>
        <p>Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="candidates-list">
      <div className="page-header">
        <div className="header-content">
          <h1>Candidates Database</h1>
          <p>Find and manage qualified candidates for your open positions</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => navigate("/dashboard/employer/post-job")}
          >
            + Post New Job
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search candidates by name, role, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filters-row">
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange("role", e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="manager">Manager</option>
            <option value="analyst">Analyst</option>
          </select>

          <select
            value={filters.experience}
            onChange={(e) => handleFilterChange("experience", e.target.value)}
            className="filter-select"
          >
            <option value="">All Experience Levels</option>
            <option value="1">1+ years</option>
            <option value="2">2+ years</option>
            <option value="3">3+ years</option>
            <option value="5">5+ years</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>

          <button className="btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        <div className="results-info">
          <span>
            Showing {filteredCandidates.length} of {candidates.length}{" "}
            candidates
          </span>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="candidates-grid">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No candidates found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidatesList;
