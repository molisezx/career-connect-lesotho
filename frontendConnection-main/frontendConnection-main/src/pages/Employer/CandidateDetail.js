import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./employer-dashboard.css";

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    loadCandidateDetail();
  }, [id]);

  const loadCandidateDetail = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockCandidate = {
          id: parseInt(id),
          name: "Thato Molise",
          email: "thato.molise@email.com",
          phone: "+266 1234 5678",
          role: "Senior Developer",
          experience: "5 years",
          skills: [
            "React",
            "Node.js",
            "TypeScript",
            "MongoDB",
            "Express",
            "Git",
          ],
          status: "shortlisted",
          match: 95,
          location: "Maseru, Lesotho",
          education: "BSc Computer Science - National University of Lesotho",
          salaryExpectation: "M25,000 - M30,000",
          availability: "2 weeks notice",
          languages: ["English", "Sesotho"],
          portfolio: "https://thatomolise.dev",
          linkedin: "https://linkedin.com/in/thatomolise",
          summary:
            "Experienced full-stack developer with 5+ years in building scalable web applications. Passionate about clean code and user experience.",
          workExperience: [
            {
              id: 1,
              company: "Tech Solutions LS",
              position: "Senior Developer",
              duration: "2020 - Present",
              description:
                "Led development of multiple web applications using React and Node.js",
            },
            {
              id: 2,
              company: "Digital Innovations",
              position: "Frontend Developer",
              duration: "2018 - 2020",
              description:
                "Developed responsive web applications and collaborated with design team",
            },
          ],
          educationHistory: [
            {
              id: 1,
              institution: "National University of Lesotho",
              degree: "BSc Computer Science",
              year: "2018",
            },
          ],
          certifications: [
            "AWS Certified Developer",
            "React Professional Certificate",
            "Node.js Best Practices",
          ],
        };
        setCandidate(mockCandidate);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading candidate details:", error);
      setIsLoading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setCandidate((prev) => ({
      ...prev,
      status: newStatus,
    }));
    // Here you would typically make an API call to update the status
  };

  const scheduleInterview = () => {
    navigate("/dashboard/employer/interviews/schedule", {
      state: { candidateId: id, candidateName: candidate.name },
    });
  };

  if (isLoading) {
    return (
      <div className="candidate-detail loading">
        <div className="loading-spinner"></div>
        <p>Loading candidate details...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="candidate-detail not-found">
        <h2>Candidate not found</h2>
        <button onClick={() => navigate("/dashboard/employer/candidates")}>
          Back to Candidates
        </button>
      </div>
    );
  }

  return (
    <div className="candidate-detail">
      {/* Header */}
      <div className="candidate-header">
        <button
          className="btn-back"
          onClick={() => navigate("/dashboard/employer/candidates")}
        >
          ← Back to Candidates
        </button>

        <div className="header-actions">
          <button className="btn-secondary">Download CV</button>
          <button className="btn-secondary" onClick={scheduleInterview}>
            Schedule Interview
          </button>
          <button className="btn-primary">Contact</button>
        </div>
      </div>

      <div className="candidate-layout">
        {/* Sidebar */}
        <div className="candidate-sidebar">
          <div className="profile-card">
            <div className="avatar-large">
              {candidate.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <h2>{candidate.name}</h2>
            <p className="role">{candidate.role}</p>
            <div className="match-score-large">
              <span className="score">{candidate.match}%</span>
              <span className="label">Match</span>
            </div>

            <div className="quick-info">
              <div className="info-item">
                <span className="label">Status:</span>
                <span className={`status ${candidate.status}`}>
                  {candidate.status}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Location:</span>
                <span>{candidate.location}</span>
              </div>
              <div className="info-item">
                <span className="label">Experience:</span>
                <span>{candidate.experience}</span>
              </div>
              <div className="info-item">
                <span className="label">Availability:</span>
                <span>{candidate.availability}</span>
              </div>
            </div>

            <div className="status-actions">
              <h4>Update Status</h4>
              <div className="status-buttons">
                <button
                  className={`status-btn ${
                    candidate.status === "new" ? "active" : ""
                  }`}
                  onClick={() => handleStatusChange("new")}
                >
                  New
                </button>
                <button
                  className={`status-btn ${
                    candidate.status === "shortlisted" ? "active" : ""
                  }`}
                  onClick={() => handleStatusChange("shortlisted")}
                >
                  Shortlist
                </button>
                <button
                  className={`status-btn ${
                    candidate.status === "interview" ? "active" : ""
                  }`}
                  onClick={() => handleStatusChange("interview")}
                >
                  Interview
                </button>
                <button
                  className={`status-btn ${
                    candidate.status === "hired" ? "active" : ""
                  }`}
                  onClick={() => handleStatusChange("hired")}
                >
                  Hire
                </button>
                <button
                  className={`status-btn ${
                    candidate.status === "rejected" ? "active" : ""
                  }`}
                  onClick={() => handleStatusChange("rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="candidate-main">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            <button
              className={`tab ${activeTab === "experience" ? "active" : ""}`}
              onClick={() => setActiveTab("experience")}
            >
              Experience
            </button>
            <button
              className={`tab ${activeTab === "education" ? "active" : ""}`}
              onClick={() => setActiveTab("education")}
            >
              Education
            </button>
            <button
              className={`tab ${activeTab === "documents" ? "active" : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              Documents
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "profile" && (
              <div className="profile-content">
                <section className="section">
                  <h3>Professional Summary</h3>
                  <p>{candidate.summary}</p>
                </section>

                <section className="section">
                  <h3>Skills & Expertise</h3>
                  <div className="skills-grid">
                    {candidate.skills.map((skill, index) => (
                      <span key={index} className="skill-tag large">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="section">
                  <h3>Contact Information</h3>
                  <div className="contact-info">
                    <div className="contact-item">
                      <strong>Email:</strong>
                      <span>{candidate.email}</span>
                    </div>
                    <div className="contact-item">
                      <strong>Phone:</strong>
                      <span>{candidate.phone}</span>
                    </div>
                    <div className="contact-item">
                      <strong>Location:</strong>
                      <span>{candidate.location}</span>
                    </div>
                    <div className="contact-item">
                      <strong>Languages:</strong>
                      <span>{candidate.languages.join(", ")}</span>
                    </div>
                  </div>
                </section>

                <section className="section">
                  <h3>Salary Expectations</h3>
                  <p className="salary">{candidate.salaryExpectation}</p>
                </section>
              </div>
            )}

            {activeTab === "experience" && (
              <div className="experience-content">
                <h3>Work Experience</h3>
                {candidate.workExperience.map((exp) => (
                  <div key={exp.id} className="experience-item">
                    <h4>{exp.position}</h4>
                    <p className="company">{exp.company}</p>
                    <p className="duration">{exp.duration}</p>
                    <p className="description">{exp.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "education" && (
              <div className="education-content">
                <h3>Education History</h3>
                {candidate.educationHistory.map((edu) => (
                  <div key={edu.id} className="education-item">
                    <h4>{edu.degree}</h4>
                    <p className="institution">{edu.institution}</p>
                    <p className="year">{edu.year}</p>
                  </div>
                ))}

                <h4>Certifications</h4>
                <div className="certifications">
                  {candidate.certifications.map((cert, index) => (
                    <span key={index} className="certification-tag">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="documents-content">
                <h3>Documents & Links</h3>
                <div className="documents-list">
                  <div className="document-item">
                    <span className="doc-icon">📄</span>
                    <div className="doc-info">
                      <h4>Resume.pdf</h4>
                      <p>Updated 2 weeks ago</p>
                    </div>
                    <button className="btn-download">Download</button>
                  </div>
                  <div className="document-item">
                    <span className="doc-icon">🔗</span>
                    <div className="doc-info">
                      <h4>Portfolio</h4>
                      <p>{candidate.portfolio}</p>
                    </div>
                    <a
                      href={candidate.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button className="btn-view">Visit</button>
                    </a>
                  </div>
                  <div className="document-item">
                    <span className="doc-icon">🔗</span>
                    <div className="doc-info">
                      <h4>LinkedIn</h4>
                      <p>{candidate.linkedin}</p>
                    </div>
                    <a
                      href={candidate.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button className="btn-view">Visit</button>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;
