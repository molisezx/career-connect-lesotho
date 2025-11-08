import { signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Admin credentials
  const ADMIN_EMAIL = "admin@gmail.com";
  const ADMIN_PASSWORD = "Admin@123";

  const createAdminUserInFirestore = async (firebaseUser) => {
    try {
      console.log("👑 Creating admin user in Firestore...");

      const adminData = {
        firebaseUID: firebaseUser.uid,
        email: ADMIN_EMAIL,
        fullName: "System Administrator",
        userType: "admin",
        isVerified: true,
        createdAt: new Date().toISOString(),
        profile: {
          isSuperAdmin: true,
          adminLevel: "super",
          permissions: ["all"],
          phone: "",
          lastLogin: new Date().toISOString(),
        },
      };

      await setDoc(doc(db, "users", firebaseUser.uid), adminData);
      console.log("✅ Admin user created successfully in Firestore");

      return { id: firebaseUser.uid, ...adminData };
    } catch (error) {
      console.error("🚨 Error creating admin user in Firestore:", error);
      return null;
    }
  };

  const createAdminUserInAuth = async () => {
    try {
      console.log("👑 Attempting to create admin user in Firebase Auth...");

      // This would typically be done through your backend API
      // For now, we'll show a helpful message
      toast.error(
        "Admin user not found in Firebase Authentication. Please create the admin user first."
      );
      console.log("🔧 Please create admin user in Firebase Console with:");
      console.log("📧 Email:", ADMIN_EMAIL);
      console.log("🔑 Password:", ADMIN_PASSWORD);

      return null;
    } catch (error) {
      console.error("🚨 Error creating admin user in Auth:", error);
      return null;
    }
  };

  const getUserProfile = async (firebaseUser, email) => {
    try {
      console.log("🔍 Searching for user profile with UID:", firebaseUser.uid);

      // Method 1: Try to get user by Firebase UID as document ID
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

      if (userDoc.exists()) {
        console.log("✅ User found by UID document ID");
        const userData = { id: userDoc.id, ...userDoc.data() };
        console.log("📋 User data:", userData);
        return userData;
      }

      // Method 2: Search for user by email in users collection
      console.log("🔍 User not found by UID, searching by email:", email);
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        console.log("✅ User found by email search");
        const userData = { id: userDoc.id, ...userDoc.data() };
        console.log("📋 User data:", userData);
        return userData;
      }

      // Method 3: Search for user by firebaseUID field
      console.log("🔍 Searching by firebaseUID field:", firebaseUser.uid);
      const uidQuery = query(
        usersRef,
        where("firebaseUID", "==", firebaseUser.uid)
      );
      const uidSnapshot = await getDocs(uidQuery);

      if (!uidSnapshot.empty) {
        const userDoc = uidSnapshot.docs[0];
        console.log("✅ User found by firebaseUID field");
        const userData = { id: userDoc.id, ...userDoc.data() };
        console.log("📋 User data:", userData);
        return userData;
      }

      // Method 4: If admin email, create admin user in Firestore automatically
      if (email === ADMIN_EMAIL) {
        console.log(
          "👑 Admin email detected, creating admin user in Firestore..."
        );
        const adminUser = await createAdminUserInFirestore(firebaseUser);
        if (adminUser) {
          console.log("✅ Admin user created and returning:", adminUser);
        }
        return adminUser;
      }

      console.log("❌ No user profile found in any search method");
      return null;
    } catch (error) {
      console.error("🚨 Error fetching user profile:", error);
      return null;
    }
  };

  const getRedirectPath = (userType) => {
    console.log("📍 Determining redirect path for user type:", userType);

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

  const handleAdminLogin = async (email, password) => {
    try {
      console.log("👑 Starting admin login process...");

      // First, try to sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;
      console.log("✅ Firebase authentication successful:", firebaseUser.uid);

      // Get or create admin user profile in Firestore
      const userProfile = await getUserProfile(firebaseUser, email);

      if (!userProfile) {
        console.log("❌ Failed to get/create admin profile");
        toast.error("Failed to setup admin profile. Please try again.");
        await auth.signOut();
        return null;
      }

      console.log("✅ Admin profile ready:", userProfile);
      return { firebaseUser, userProfile };
    } catch (error) {
      console.error("🚨 Admin login error:", error);

      if (error.code === "auth/user-not-found") {
        console.log("👑 Admin user not found in Firebase Auth");
        await createAdminUserInAuth();
      }

      throw error;
    }
  };

  const handleRegularLogin = async (email, password) => {
    console.log("👤 Starting regular user login process...");

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = userCredential.user;
    console.log("✅ Firebase authentication successful:", firebaseUser.uid);

    const userProfile = await getUserProfile(firebaseUser, email);

    if (!userProfile) {
      throw new Error("USER_PROFILE_NOT_FOUND");
    }

    return { firebaseUser, userProfile };
  };

  const onSubmit = async (data) => {
    try {
      console.log("🚀 Login attempt started for:", data.email);
      console.log("📧 Email type:", typeof data.email, "Value:", data.email);
      console.log("🔒 Password type:", typeof data.password);

      // Check if it's admin login
      const isAdminLogin =
        data.email === ADMIN_EMAIL && data.password === ADMIN_PASSWORD;

      let result;
      if (isAdminLogin) {
        console.log("👑 Admin login detected");
        result = await handleAdminLogin(data.email, data.password);
      } else {
        result = await handleRegularLogin(data.email, data.password);
      }

      if (!result) {
        return; // Error already handled
      }

      const { firebaseUser, userProfile } = result;

      console.log("✅ User profile loaded:", userProfile);

      // Check if user has required fields
      if (!userProfile.userType) {
        console.log("❌ User profile missing userType");
        toast.error("User profile is incomplete. Please contact support.");
        return;
      }

      // Prepare user data for context
      const userData = {
        id: userProfile.id || firebaseUser.uid,
        firebaseUID: firebaseUser.uid,
        email: firebaseUser.email,
        userType: userProfile.userType,
        fullName: userProfile.fullName || firebaseUser.displayName || "User",
        isVerified: userProfile.isVerified || false,
        profile: userProfile.profile || {},
      };

      console.log("📝 User data for context:", userData);

      // Get Firebase token
      const token = await firebaseUser.getIdToken();
      console.log("✅ Firebase token obtained");

      // FIXED: Use the AuthContext login function correctly
      console.log("🔐 Calling AuthContext login with credentials...");

      // Option 1: If your AuthContext login expects credentials object
      const loginResult = await login({
        email: data.email,
        password: data.password,
      });

      if (!loginResult.success) {
        throw new Error(loginResult.error || "Login failed");
      }

      const welcomeMessage = isAdminLogin
        ? "Welcome back, System Administrator!"
        : `Welcome back, ${userData.fullName}!`;

      toast.success(welcomeMessage);

      // Redirect based on user type
      const redirectPath = getRedirectPath(userProfile.userType);
      console.log("🔄 Redirecting to:", redirectPath);

      // Use immediate navigation instead of timeout
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("🚨 Login error:", error);

      if (error.message === "USER_PROFILE_NOT_FOUND") {
        toast.error("User profile not found. Please register first.");
        await auth.signOut();
        return;
      }

      if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email. Please register first.");
      } else if (error.code === "auth/wrong-password") {
        if (data.email === ADMIN_EMAIL) {
          toast.error("Incorrect admin password. Please use: Admin@123");
        } else {
          toast.error("Incorrect password. Please try again.");
        }
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address format.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many failed attempts. Please try again later.");
      } else if (error.code === "auth/user-disabled") {
        toast.error("This account has been disabled. Please contact support.");
      } else if (error.code === "auth/network-request-failed") {
        toast.error("Network error. Please check your connection.");
      } else if (error.code === "auth/invalid-credential") {
        toast.error("Invalid email or password.");
      } else {
        toast.error(`Login failed: ${error.message}`);
      }
    }
  };

  // Alternative simplified version if you want to use AuthContext login directly
  const onSubmitSimplified = async (data) => {
    try {
      console.log("🚀 Simplified login attempt for:", data.email);

      // Directly use AuthContext login which handles Firebase auth internally
      const result = await login({
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        toast.success(`Welcome back!`);

        // Get user type from the result or use a default
        const userType = result.user?.userType || "student";
        const redirectPath = getRedirectPath(userType);
        navigate(redirectPath, { replace: true });
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch (error) {
      console.error("🚨 Simplified login error:", error);
      toast.error(error.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Career Connect Lesotho</h1>
          <h2 className="auth-subtitle">Welcome Back</h2>
          <p className="auth-description">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? "error" : ""}`}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              })}
              placeholder="Enter your email address"
              disabled={isSubmitting}
            />
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`form-input ${errors.password ? "error" : ""}`}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              placeholder="Enter your password"
              disabled={isSubmitting}
            />
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            className={`submit-btn ${isSubmitting ? "loading" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-link">
            Don't have an account? <Link to="/register">Sign up here</Link>
          </p>
          <p className="auth-link">
            <Link to="/forgot-password">Forgot your password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
