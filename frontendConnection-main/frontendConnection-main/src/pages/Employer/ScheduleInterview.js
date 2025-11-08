import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./ScheduleInterview.css";

const ScheduleInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    candidateId: "",
    candidateName: "",
    position: "",
    interviewType: "technical",
    date: "",
    time: "",
    duration: "60",
    interviewers: [],
    meetingType: "video",
    meetingLink: "",
    location: "",
    notes: "",
  });
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInitialData();

    // Pre-fill form if editing or scheduling for specific candidate
    if (location.state) {
      if (location.state.candidateId) {
        setFormData((prev) => ({
          ...prev,
          candidateId: location.state.candidateId,
          candidateName: location.state.candidateName,
        }));
      }

      if (location.state.editMode && location.state.interviewData) {
        setFormData(location.state.interviewData);
      }
    }
  }, [location.state]);

  const loadInitialData = async () => {
    try {
      // Simulate loading candidates and team members
      setTimeout(() => {
        setAvailableCandidates([
          { id: 1, name: "Thato Molise", role: "Senior Developer" },
          { id: 2, name: "Lerato Mokoena", role: "Product Manager" },
          { id: 3, name: "Mpho Sebata", role: "Data Analyst" },
          { id: 4, name: "Kabelo Nkosi", role: "UX Designer" },
          { id: 5, name: "Anna Motaung", role: "Frontend Developer" },
        ]);

        setTeamMembers([
          { id: 1, name: "John Doe", role: "Technical Lead" },
          { id: 2, name: "Jane Smith", role: "HR Manager" },
          { id: 3, name: "Mike Johnson", role: "Team Lead" },
          { id: 4, name: "Sarah Brown", role: "Product Owner" },
        ]);
      }, 500);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    // Generate meeting link for video calls
    if (field === "meetingType" && value === "video") {
      setFormData((prev) => ({
        ...prev,
        meetingLink: `https://meet.google.com/${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      }));
    }
  };

  const handleInterviewerToggle = (interviewerId) => {
    setFormData((prev) => {
      const currentInterviewers = [...prev.interviewers];
      const index = currentInterviewers.indexOf(interviewerId);

      if (index > -1) {
        currentInterviewers.splice(index, 1);
      } else {
        currentInterviewers.push(interviewerId);
      }

      return {
        ...prev,
        interviewers: currentInterviewers,
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.candidateId)
      newErrors.candidateId = "Please select a candidate";
    if (!formData.position) newErrors.position = "Please enter the position";
    if (!formData.date) newErrors.date = "Please select a date";
    if (!formData.time) newErrors.time = "Please select a time";
    if (formData.interviewers.length === 0)
      newErrors.interviewers = "Please select at least one interviewer";
    if (formData.meetingType === "in-person" && !formData.location)
      newErrors.location = "Please enter location";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Simulate API call
      setTimeout(() => {
        console.log("Scheduling interview:", formData);
        setIsLoading(false);

        // Show success message and redirect
        alert("Interview scheduled successfully!");
        navigate("/dashboard/employer/interviews");
      }, 2000);
    } catch (error) {
      console.error("Error scheduling interview:", error);
      setIsLoading(false);
      alert("Failed to schedule interview. Please try again.");
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <div className="schedule-interview">
      <div className="page-header">
        <button
          className="btn-back"
          onClick={() => navigate("/dashboard/employer/interviews")}
        >
          ← Back to Interviews
        </button>
        <h1>Schedule Interview</h1>
      </div>

      <div className="schedule-form-container">
        <form onSubmit={handleSubmit} className="schedule-form">
          {/* Candidate Selection */}
          <div className="form-section">
            <h3>Candidate Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Select Candidate *</label>
                <select
                  value={formData.candidateId}
                  onChange={(e) => {
                    const candidate = availableCandidates.find(
                      (c) => c.id === parseInt(e.target.value)
                    );
                    handleInputChange("candidateId", e.target.value);
                    handleInputChange("candidateName", candidate?.name || "");
                  }}
                  className={errors.candidateId ? "error" : ""}
                >
                  <option value="">Choose a candidate</option>
                  {availableCandidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} - {candidate.role}
                    </option>
                  ))}
                </select>
                {errors.candidateId && (
                  <span className="error-text">{errors.candidateId}</span>
                )}
              </div>

              <div className="form-group">
                <label>Position *</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) =>
                    handleInputChange("position", e.target.value)
                  }
                  placeholder="e.g., Senior Developer"
                  className={errors.position ? "error" : ""}
                />
                {errors.position && (
                  <span className="error-text">{errors.position}</span>
                )}
              </div>
            </div>
          </div>

          {/* Interview Details */}
          <div className="form-section">
            <h3>Interview Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Interview Type *</label>
                <select
                  value={formData.interviewType}
                  onChange={(e) =>
                    handleInputChange("interviewType", e.target.value)
                  }
                >
                  <option value="technical">Technical Interview</option>
                  <option value="cultural">Cultural Fit</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="portfolio">Portfolio Review</option>
                  <option value="final">Final Round</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  min={getTomorrowDate()}
                  className={errors.date ? "error" : ""}
                />
                {errors.date && (
                  <span className="error-text">{errors.date}</span>
                )}
              </div>

              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className={errors.time ? "error" : ""}
                />
                {errors.time && (
                  <span className="error-text">{errors.time}</span>
                )}
              </div>

              <div className="form-group">
                <label>Duration *</label>
                <select
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange("duration", e.target.value)
                  }
                >
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interviewers */}
          <div className="form-section">
            <h3>Interview Team</h3>
            <div className="form-group">
              <label>Select Interviewers *</label>
              {errors.interviewers && (
                <span className="error-text">{errors.interviewers}</span>
              )}
              <div className="interviewers-grid">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`interviewer-card ${
                      formData.interviewers.includes(member.id)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => handleInterviewerToggle(member.id)}
                  >
                    <div className="interviewer-avatar">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="interviewer-info">
                      <h4>{member.name}</h4>
                      <p>{member.role}</p>
                    </div>
                    <div className="selection-indicator">
                      {formData.interviewers.includes(member.id) ? "✓" : "+"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meeting Setup */}
          <div className="form-section">
            <h3>Meeting Setup</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Meeting Type *</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      value="video"
                      checked={formData.meetingType === "video"}
                      onChange={(e) =>
                        handleInputChange("meetingType", e.target.value)
                      }
                    />
                    <span>Video Call</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      value="in-person"
                      checked={formData.meetingType === "in-person"}
                      onChange={(e) =>
                        handleInputChange("meetingType", e.target.value)
                      }
                    />
                    <span>In-Person</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      value="phone"
                      checked={formData.meetingType === "phone"}
                      onChange={(e) =>
                        handleInputChange("meetingType", e.target.value)
                      }
                    />
                    <span>Phone Call</span>
                  </label>
                </div>
              </div>

              {formData.meetingType === "video" && (
                <div className="form-group">
                  <label>Meeting Link</label>
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) =>
                      handleInputChange("meetingLink", e.target.value)
                    }
                    placeholder="https://meet.google.com/..."
                  />
                  <small>Google Meet link generated automatically</small>
                </div>
              )}

              {formData.meetingType === "in-person" && (
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder="Office address or meeting room"
                    className={errors.location ? "error" : ""}
                  />
                  {errors.location && (
                    <span className="error-text">{errors.location}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="form-section">
            <h3>Additional Information</h3>
            <div className="form-group">
              <label>Notes for Interviewers</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any specific topics to cover, areas to focus on, or special instructions..."
                rows="4"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/dashboard/employer/interviews")}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Scheduling..." : "Schedule Interview"}
            </button>
          </div>
        </form>

        {/* Preview Panel */}
        <div className="preview-panel">
          <h3>Interview Preview</h3>
          <div className="preview-card">
            <div className="preview-section">
              <strong>Candidate:</strong>
              <span>{formData.candidateName || "Not selected"}</span>
            </div>
            <div className="preview-section">
              <strong>Position:</strong>
              <span>{formData.position || "Not specified"}</span>
            </div>
            <div className="preview-section">
              <strong>Date & Time:</strong>
              <span>
                {formData.date && formData.time
                  ? `${new Date(formData.date).toLocaleDateString()} at ${
                      formData.time
                    }`
                  : "Not scheduled"}
              </span>
            </div>
            <div className="preview-section">
              <strong>Duration:</strong>
              <span>{formData.duration} minutes</span>
            </div>
            <div className="preview-section">
              <strong>Interviewers:</strong>
              <span>
                {formData.interviewers.length > 0
                  ? formData.interviewers
                      .map((id) => {
                        const interviewer = teamMembers.find(
                          (m) => m.id === id
                        );
                        return interviewer?.name;
                      })
                      .join(", ")
                  : "Not selected"}
              </span>
            </div>
            <div className="preview-section">
              <strong>Meeting Type:</strong>
              <span>{formData.meetingType || "Not specified"}</span>
            </div>
          </div>

          {/* Calendar Integration */}
          <div className="calendar-integration">
            <h4>Add to Calendar</h4>
            <div className="calendar-buttons">
              <button className="btn-calendar google">Google Calendar</button>
              <button className="btn-calendar outlook">Outlook</button>
              <button className="btn-calendar ical">iCal</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterview;
