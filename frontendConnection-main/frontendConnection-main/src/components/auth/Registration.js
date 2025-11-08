import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI, testConnection } from "../../services/api";
import "./Auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    userType: "student",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [serverStatus, setServerStatus] = useState("checking");
  const navigate = useNavigate();

  // Check server connection on component mount
  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      const result = await testConnection();
      setServerStatus(result.connected ? "connected" : "disconnected");

      if (!result.connected) {
        setErrors({ server: result.message });
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.server;
          return newErrors;
        });
      }
    } catch (error) {
      setServerStatus("disconnected");
      setErrors({
        server:
          "Failed to check server connection. Make sure backend is running on port 5000.",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await authAPI.register({
        userType: formData.userType,
        fullName: formData.fullName.trim(),
        email: formData.email.toLowerCase(),
        password: formData.password,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Registration successful!");

        // Store token in localStorage
        if (result.data?.token) {
          localStorage.setItem("authToken", result.data.token);
          localStorage.setItem("user", JSON.stringify(result.data.user));
        }

        // Reset form
        setFormData({
          userType: "student",
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        // Redirect to appropriate dashboard after 2 seconds
        setTimeout(() => {
          const dashboardPath =
            result.data.user.userType === "student"
              ? "/student"
              : result.data.user.userType === "employer"
                ? "/company"
                : "/";
          navigate(dashboardPath);
        }, 2000);
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);

      // Enhanced error handling
      let errorMessage =
        error.message || "Registration failed. Please try again.";

      if (errorMessage.includes("HTML instead of JSON")) {
        errorMessage =
          "Backend server error. Please ensure the backend is running correctly on port 5000.";
      } else if (
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("Failed to fetch")
      ) {
        errorMessage =
          "Cannot connect to server. Please ensure the backend is running on http://localhost:5000";
      } else if (errorMessage.includes("ECONNREFUSED")) {
        errorMessage =
          "Connection refused. Please start the backend server on port 5000.";
      }

      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Career Connect Lesotho</h1>
          <h2>Create Your Account</h2>
          <p>Join Career Connect Lesotho today</p>

          {/* Server Status Indicator */}
          <div className={`server-status ${serverStatus}`}>
            {serverStatus === "connected" && "✅ Server Connected"}
            {serverStatus === "checking" && "⏳ Checking Server..."}
            {serverStatus === "disconnected" && "❌ Server Disconnected"}
          </div>
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {errors.server && (
          <div className="error-message server-error">
            <p>{errors.server}</p>
            <button onClick={checkServerConnection} className="retry-btn">
              Retry Connection
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* User Type Selection */}
          <div className="form-group">
            <label className="form-label">I am a:</label>
            <div className="user-type-selector">
              <button
                type="button"
                className={`user-type-btn ${formData.userType === "student" ? "active" : ""
                  }`}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, userType: "student" }))
                }
              >
                Student
              </button>
              <button
                type="button"
                className={`user-type-btn ${formData.userType === "employer" ? "active" : ""
                  }`}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, userType: "employer" }))
                }
              >
                Employer
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`form-input ${errors.fullName ? "error" : ""}`}
              placeholder="Enter your full name"
              disabled={isLoading}
            />
            {errors.fullName && (
              <span className="error-message">{errors.fullName}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? "error" : ""}`}
              placeholder="Enter your email address"
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${errors.password ? "error" : ""}`}
              placeholder="Create a password (min. 6 characters)"
              disabled={isLoading}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-input ${errors.confirmPassword ? "error" : ""}`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading || serverStatus !== "connected"}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === "development" && (
          <div className="debug-info">
            <details>
              <summary>Debug Info</summary>
              <p>
                API Base URL:{" "}
                {process.env.REACT_APP_API_URL || "http://localhost:5000/api"}
              </p>
              <p>Server Status: {serverStatus}</p>
              <p>Backend URL: http://localhost:5000</p>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
