import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  applyForCourse,
  getCourses,
  getInstitutions,
  getStudentProfile,
} from "../../services/studentServices";
import "./Student.css";

const ApplyCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [courses, setCourses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;

      try {
        console.log("🎯 Loading application data for user:", user.uid);
        const [coursesRes, profileRes, institutionsRes] = await Promise.all([
          getCourses(),
          getStudentProfile(user.uid),
          getInstitutions(),
        ]);

        console.log("📚 Courses response:", coursesRes);
        console.log("👤 Profile response:", profileRes);
        console.log("🏫 Institutions response:", institutionsRes);

        if (coursesRes.success) {
          // Client-side filtering to avoid index issues
          const activeCourses = (coursesRes.data || []).filter(
            (course) => course.status === "active" || !course.status
          );
          console.log("✅ Available courses:", activeCourses.length);
          setCourses(activeCourses);

          // Pre-select course if ID provided
          if (courseId) {
            const course = activeCourses.find((c) => c.id === courseId);
            console.log("🎯 Pre-selected course:", course);
            if (course) {
              setSelectedCourse(course);
            } else {
              setMessage("Course not found or not available");
            }
          }
        } else {
          console.warn("⚠️ Courses failed:", coursesRes.error);
          setCourses([]);
        }

        if (profileRes.success) {
          setStudentProfile(profileRes.data);
          console.log("✅ Student profile loaded");
        } else {
          console.warn("⚠️ Profile failed:", profileRes.error);
        }

        if (institutionsRes.success) {
          setInstitutions(institutionsRes.data || []);
          console.log("✅ Institutions loaded:", institutionsRes.data?.length);
        } else {
          console.warn("⚠️ Institutions failed:", institutionsRes.error);
        }
      } catch (error) {
        console.error("❌ Error loading data:", error);
        setMessage("Failed to load application data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.uid, courseId]);

  const handleCourseSelect = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    console.log("🎯 Course selected:", course);
    setSelectedCourse(course);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCourse) {
      setMessage("Please select a course");
      return;
    }

    if (!studentProfile?.fullName) {
      setMessage("Please complete your profile before applying");
      return;
    }

    console.log("🚀 Submitting application for course:", selectedCourse);

    setIsSubmitting(true);
    setMessage("");

    try {
      const applicationData = {
        studentId: user.uid,
        studentName: studentProfile.fullName,
        studentEmail: studentProfile.email || user.email,
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        courseCode: selectedCourse.code,
        institutionId: selectedCourse.institutionId,
        institutionName:
          institutions.find((inst) => inst.id === selectedCourse.institutionId)
            ?.name || "Unknown Institution",
        level: selectedCourse.level,
        duration: selectedCourse.duration,
        fees: selectedCourse.fees,
        appliedAt: new Date(),
        status: "pending",
        // Use fields that match your indexes
        createdAt: new Date(), // For notifications index
        // Student profile info
        studentProfile: {
          dateOfBirth: studentProfile.dateOfBirth,
          phone: studentProfile.phone,
          address: studentProfile.address,
          qualifications: studentProfile.qualifications,
        },
      };

      console.log("📝 Application data:", applicationData);

      const result = await applyForCourse(applicationData);

      if (result.success) {
        setMessage(
          "🎉 Application submitted successfully! Redirecting to applications..."
        );
        setTimeout(() => navigate("/dashboard/student/applications"), 2000);
      } else {
        setMessage(result.error || "Failed to submit application");
        console.error("❌ Application submission failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Error submitting application:", error);
      setMessage("Error submitting application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInstitutionName = (institutionId) => {
    if (!institutionId) return "Unknown Institution";
    const institution = institutions.find((inst) => inst.id === institutionId);
    return institution?.name || "Unknown Institution";
  };

  const formatFees = (fees) => {
    if (!fees) return "Contact Institution";
    if (typeof fees === "object" && fees.amount) {
      return `M${fees.amount}${fees.currency ? ` ${fees.currency}` : ""}`;
    }
    if (typeof fees === "number") {
      return `M${fees}`;
    }
    return "Contact Institution";
  };

  const formatDuration = (duration, durationUnit) => {
    if (!duration) return "N/A";
    const unit = durationUnit || "years";
    return `${duration} ${unit}`;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading application form...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Apply for Course</h1>
            <p>Submit your application for the selected course</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/student/courses")}
            className="btn-back"
          >
            ← Back to Courses
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`message ${message.includes("submitted") || message.includes("🎉")
            ? "success"
            : message.includes("Error") || message.includes("Failed")
              ? "error"
              : "warning"
            }`}
        >
          {message}
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {/* Course Selection */}
          <div className="form-section">
            <h3>Course Selection</h3>
            <div className="form-group">
              <label>Select Course *</label>
              <select
                value={selectedCourse?.id || ""}
                onChange={(e) => handleCourseSelect(e.target.value)}
                required
                className="form-select"
                disabled={isSubmitting}
              >
                <option value="">Choose a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} {course.code ? `(${course.code})` : ""} -{" "}
                    {getInstitutionName(course.institutionId)} -{" "}
                    {course.level?.toUpperCase()}
                  </option>
                ))}
              </select>
              <small>
                {courses.length} course(s) available • Only active courses shown
              </small>
            </div>
          </div>

          {/* Course Details */}
          {selectedCourse && (
            <div className="form-section">
              <h3>Course Details</h3>
              <div className="details-card">
                <div className="course-header">
                  <h4>{selectedCourse.name}</h4>
                  <div className="course-badges">
                    <span className={`level-badge ${selectedCourse.level}`}>
                      {selectedCourse.level?.toUpperCase()}
                    </span>
                    {selectedCourse.code && (
                      <span className="code-badge">{selectedCourse.code}</span>
                    )}
                  </div>
                </div>

                <div className="institution-info">
                  <strong>Institution:</strong>{" "}
                  {getInstitutionName(selectedCourse.institutionId)}
                </div>

                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Duration:</strong>{" "}
                    {formatDuration(
                      selectedCourse.duration,
                      selectedCourse.durationUnit
                    )}
                  </div>
                  <div className="detail-item">
                    <strong>Level:</strong> {selectedCourse.level}
                  </div>
                  <div className="detail-item">
                    <strong>Fees:</strong> {formatFees(selectedCourse.fees)}
                  </div>
                  <div className="detail-item">
                    <strong>Credits:</strong> {selectedCourse.credits || "N/A"}
                  </div>
                </div>

                {selectedCourse.description && (
                  <div className="description-section">
                    <strong>Description:</strong>
                    <p>{selectedCourse.description}</p>
                  </div>
                )}

                {selectedCourse.requirements && (
                  <div className="requirements-section">
                    <strong>Requirements:</strong>
                    <p>{selectedCourse.requirements}</p>
                  </div>
                )}

                {selectedCourse.intakePeriod && (
                  <div className="intake-info">
                    <strong>Next Intake:</strong> {selectedCourse.intakePeriod}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student Information */}
          <div className="form-section">
            <h3>Your Information</h3>
            <div className="info-card">
              <div className="info-grid">
                <div className="info-item">
                  <strong>Name:</strong>{" "}
                  {studentProfile?.fullName || "Not provided"}
                </div>
                <div className="info-item">
                  <strong>Email:</strong> {studentProfile?.email || user?.email}
                </div>
                {studentProfile?.phone && (
                  <div className="info-item">
                    <strong>Phone:</strong> {studentProfile.phone}
                  </div>
                )}
                {studentProfile?.dateOfBirth && (
                  <div className="info-item">
                    <strong>Date of Birth:</strong> {studentProfile.dateOfBirth}
                  </div>
                )}
                {studentProfile?.qualifications?.educationLevel && (
                  <div className="info-item">
                    <strong>Education Level:</strong>{" "}
                    {studentProfile.qualifications.educationLevel}
                  </div>
                )}
              </div>

              {!studentProfile?.fullName && (
                <div className="warning-card">
                  <div className="warning-content">
                    <span className="warning-icon">⚠️</span>
                    <div>
                      <p><strong>Profile Incomplete</strong></p>
                      <p>Please complete your profile before applying to courses</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate("/dashboard/student/profile")}
                  >
                    Complete Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/dashboard/student/courses")}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={
                isSubmitting ||
                !studentProfile?.fullName ||
                !selectedCourse
              }
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner small"></span>
                  Submitting Application...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>

          {/* Application Notes */}
          <div className="application-notes">
            <h4>Application Notes:</h4>
            <ul>
              <li>✓ You can only apply to 2 courses per institution</li>
              <li>✓ Applications are reviewed by the institution</li>
              <li>✓ You'll receive notifications about your application status</li>
              <li>✓ Make sure your profile information is up to date</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyCourse;
