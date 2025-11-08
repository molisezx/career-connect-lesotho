import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import "./Registration.css";

const Registration = () => {
  const [formData, setFormData] = useState({
    userType: "student",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    institutionId: "",
    companyName: "",
    industry: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [institutions, setInstitutions] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Fetch institutions when component mounts
  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      console.log("🔍 Fetching institutions...");
      const institutionsRef = collection(db, "institutions");
      const snapshot = await getDocs(institutionsRef);

      console.log("📊 Institutions snapshot size:", snapshot.size);

      const institutionsList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      });

      console.log("✅ Institutions loaded:", institutionsList);
      setInstitutions(institutionsList);
    } catch (error) {
      console.error("❌ Error fetching institutions:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to load institutions. Please try again.",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Institution-specific validation
    if (formData.userType === "institution" && !formData.institutionId) {
      newErrors.institutionId = "Please select your institution";
    }

    // Company-specific validation
    if (formData.userType === "company") {
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
      if (!formData.industry.trim()) {
        newErrors.industry = "Industry is required";
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const checkIfUserExists = async (email) => {
    try {
      console.log("🔍 Checking if user exists:", email);

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      console.log(
        "📊 User check result:",
        querySnapshot.empty ? "User does not exist" : "User exists"
      );
      return !querySnapshot.empty;
    } catch (error) {
      console.error("❌ Error in checkIfUserExists:", error);
      // If there's an error checking, we'll assume user doesn't exist and let Firebase handle duplication
      return false;
    }
  };

  const createUserProfile = async (user, userType) => {
    const baseUserData = {
      firebaseUID: user.uid,
      userType: userType,
      fullName: formData.fullName.trim(),
      email: formData.email.toLowerCase(),
      phoneNumber: formData.phoneNumber || "",
      isVerified: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        completed: false,
        lastLogin: null,
      },
    };

    switch (userType) {
      case "institution":
        const selectedInstitution = institutions.find(
          (inst) => inst.id === formData.institutionId
        );
        if (!selectedInstitution) {
          throw new Error("Selected institution not found");
        }

        return {
          ...baseUserData,
          institutionId: formData.institutionId,
          institutionName: selectedInstitution.name,
          permissions: [
            "manage_courses",
            "review_applications",
            "publish_admissions",
          ],
          role: "institution_admin",
        };

      case "company":
        return {
          ...baseUserData,
          companyName: formData.companyName.trim(),
          industry: formData.industry.trim(),
          status: "pending",
          permissions: ["post_jobs", "view_applications"],
          role: "company_admin",
        };

      case "employer":
        return {
          ...baseUserData,
          permissions: ["post_jobs", "view_applications"],
          role: "employer",
        };

      case "student":
        return {
          ...baseUserData,
          studentProfile: {
            completed: false,
            applications: [],
            documents: [],
            preferences: {},
          },
          permissions: ["apply_courses", "apply_jobs", "upload_documents"],
          role: "student",
        };

      default:
        return baseUserData;
    }
  };

  const updateInstitutionUsers = async (institutionId, userId) => {
    try {
      const institutionRef = doc(db, "institutions", institutionId);
      await updateDoc(institutionRef, {
        adminUsers: arrayUnion(userId),
        updatedAt: new Date().toISOString(),
      });
      console.log("✅ Added user to institution admin list");
    } catch (error) {
      console.error("❌ Error updating institution users:", error);
      // Don't throw error as user is already created
    }
  };

  const createCompanyRecord = async (userId) => {
    try {
      const companyData = {
        name: formData.companyName.trim(),
        industry: formData.industry.trim(),
        adminUserId: userId,
        contactEmail: formData.email.toLowerCase(),
        phoneNumber: formData.phoneNumber || "",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        employees: "",
        website: "",
        description: "",
        location: "",
      };

      await setDoc(doc(db, "companies", userId), companyData);
      console.log("✅ Company record created");
    } catch (error) {
      console.error("❌ Error creating company record:", error);
      // Don't throw error - company record is secondary
    }
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
    setSuccessMessage("");

    try {
      console.log("🚀 Starting registration process...");
      console.log("📝 Form data:", formData);

      // Check if user already exists (with better error handling)
      let userExists = false;
      try {
        userExists = await checkIfUserExists(formData.email);
      } catch (checkError) {
        console.warn(
          "⚠️ Could not verify user existence, continuing...",
          checkError
        );
        // Continue with registration and let Firebase handle duplicates
      }

      if (userExists) {
        throw new Error("User with this email already exists");
      }

      // Create user in Firebase Authentication
      console.log("🔥 Creating Firebase auth user...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.toLowerCase(),
        formData.password
      );

      const user = userCredential.user;
      console.log("✅ Firebase user created:", user.uid);

      // Create user profile in Firestore
      console.log("💾 Creating user profile...");
      const userData = await createUserProfile(user, formData.userType);

      await setDoc(doc(db, "users", user.uid), userData);
      console.log("✅ User profile saved to Firestore");

      // Handle role-specific additional setups
      if (formData.userType === "institution" && formData.institutionId) {
        console.log("🏫 Setting up institution admin...");
        await updateInstitutionUsers(formData.institutionId, user.uid);
      }

      if (formData.userType === "company") {
        console.log("🏢 Setting up company record...");
        await createCompanyRecord(user.uid);
      }

      // Get Firebase token and update auth context
      const token = await user.getIdToken();
      login(userData, token);

      // Show success message
      let successMsg =
        "Registration successful! Redirecting to your dashboard...";
      if (formData.userType === "company") {
        successMsg =
          "Registration submitted! Your company account is pending admin approval.";
      }

      setSuccessMessage(successMsg);
      console.log("🎉 Registration completed successfully!");

      // Redirect after success
      setTimeout(() => {
        const redirectPath = getRedirectPath(formData.userType);
        console.log("🔄 Redirecting to:", redirectPath);
        navigate(redirectPath, { replace: true });
      }, 2000);

      // Reset form
      setFormData({
        userType: "student",
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        institutionId: "",
        companyName: "",
        industry: "",
        phoneNumber: "",
      });
    } catch (error) {
      console.error("❌ Registration error:", error);
      console.error("❌ Error code:", error.code);
      console.error("❌ Error message:", error.message);

      let errorMessage = "Registration failed. Please try again.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "User with this email already exists";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message.includes("already exists")) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const getRedirectPath = (userType) => {
    switch (userType) {
      case "student":
        return "/dashboard/student";
      case "company":
        return "/dashboard/company";
      case "institution":
        return "/dashboard/institution";
      case "employer":
        return "/dashboard/employer";
      case "admin":
        return "/dashboard/admin";
      default:
        return "/dashboard";
    }
  };

  const userTypes = [
    {
      value: "student",
      label: "Student",
      description: "Apply to institutions and find jobs",
      icon: "🎓",
    },
    {
      value: "institution",
      label: "Institution",
      description: "University or College",
      icon: "🏫",
    },
    {
      value: "company",
      label: "Company",
      description: "Hire qualified graduates",
      icon: "🏢",
    },
    {
      value: "employer",
      label: "Employer",
      description: "Individual recruiter",
      icon: "💼",
    },
  ];

  const industries = [
    "Technology",
    "Healthcare",
    "Education",
    "Finance",
    "Manufacturing",
    "Retail",
    "Hospitality",
    "Construction",
    "Transportation",
    "Energy",
    "Agriculture",
    "Other",
  ];

  return (
    <div className="registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <h1>Career Connect Lesotho</h1>
          <h2>Create Your Account</h2>
          <p>Join our platform to discover opportunities in Lesotho</p>
        </div>

        {successMessage && (
          <div className="success-message">
            <span>✅</span> {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form">
          {/* User Type Selection */}
          <div className="form-group">
            <label className="form-label">I am a:</label>
            <div className="user-type-grid">
              {userTypes.map((type) => (
                <div
                  key={type.value}
                  className={`user-type-card ${
                    formData.userType === type.value ? "active" : ""
                  }`}
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      userType: type.value,
                      institutionId: "",
                      companyName: "",
                      industry: "",
                    }));
                    setErrors({});
                  }}
                >
                  <div className="user-type-icon">{type.icon}</div>
                  <div className="user-type-content">
                    <h4>{type.label}</h4>
                    <p>{type.description}</p>
                  </div>
                  <div className="user-type-radio">
                    <div
                      className={`radio-dot ${
                        formData.userType === type.value ? "active" : ""
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              Full Name *
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
              Email Address *
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

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phoneNumber" className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`form-input ${errors.phoneNumber ? "error" : ""}`}
              placeholder="Enter your phone number (optional)"
              disabled={isLoading}
            />
            {errors.phoneNumber && (
              <span className="error-message">{errors.phoneNumber}</span>
            )}
          </div>

          {/* Institution Selection */}
          {formData.userType === "institution" && (
            <div className="form-group">
              <label htmlFor="institutionId" className="form-label">
                Select Your Institution *
              </label>
              {institutions.length === 0 ? (
                <div className="no-institutions-warning">
                  <p>⚠️ No institutions available for registration.</p>
                  <p>
                    Please contact the system administrator to add institutions
                    first.
                  </p>
                </div>
              ) : (
                <select
                  id="institutionId"
                  name="institutionId"
                  value={formData.institutionId}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.institutionId ? "error" : ""
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Select your institution</option>
                  {institutions.map((institution) => (
                    <option key={institution.id} value={institution.id}>
                      {institution.name} - {institution.location}
                    </option>
                  ))}
                </select>
              )}
              {errors.institutionId && (
                <span className="error-message">{errors.institutionId}</span>
              )}
            </div>
          )}

          {/* Company Information */}
          {formData.userType === "company" && (
            <>
              <div className="form-group">
                <label htmlFor="companyName" className="form-label">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`form-input ${errors.companyName ? "error" : ""}`}
                  placeholder="Enter your company name"
                  disabled={isLoading}
                />
                {errors.companyName && (
                  <span className="error-message">{errors.companyName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="industry" className="form-label">
                  Industry *
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className={`form-input ${errors.industry ? "error" : ""}`}
                  disabled={isLoading}
                >
                  <option value="">Select your industry</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
                {errors.industry && (
                  <span className="error-message">{errors.industry}</span>
                )}
              </div>
            </>
          )}

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password *
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
              Confirm Password *
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
            <div className="error-message submit-error">
              <span>❌</span> {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`submit-btn ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Creating Account...
              </>
            ) : (
              `Create ${
                formData.userType.charAt(0).toUpperCase() +
                formData.userType.slice(1)
              } Account`
            )}
          </button>
        </form>

        <div className="login-link">
          <p>
            Already have an account? <a href="/login">Sign in here</a>
          </p>
        </div>

        {/* Debug Info */}
        <div className="debug-info">
          <p>
            <strong>Debug Info:</strong> Check browser console for detailed
            registration process
          </p>
          <p>Institutions loaded: {institutions.length}</p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
