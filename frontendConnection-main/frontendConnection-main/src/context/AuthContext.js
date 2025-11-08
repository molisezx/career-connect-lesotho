import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "../config/firebase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 App is online");
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.warn("🌐 App is offline");
      setIsOnline(false);
      setError("You are currently offline. Some features may be limited.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initialize auth state with enhanced error handling
  useEffect(() => {
    console.log("🔄 AuthProvider initializing...");

    const token = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("user");

    console.log("📦 Saved token exists:", !!token);
    console.log("📦 Saved user exists:", !!savedUser);

    let mounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!mounted) return;

        try {
          if (firebaseUser) {
            // Get fresh token
            const token = await firebaseUser.getIdToken();

            // Create complete user object
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              emailVerified: firebaseUser.emailVerified,
              photoURL: firebaseUser.photoURL,
              // Remove institutionId to prevent incorrect role detection
              role: 'student', // Default role
              userType: 'student'
            };

            console.log("🔥 Firebase user authenticated:", userData);

            // Update state and localStorage
            setUser(userData);
            localStorage.setItem("authToken", token);
            localStorage.setItem("user", JSON.stringify(userData));
            setError(null);
          } else {
            console.log("🚫 No Firebase user found");
            // Clear auth state if no Firebase user
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            setUser(null);
          }
        } catch (firebaseError) {
          console.error("❌ Firebase auth error:", firebaseError);

          // If we have saved user data and it's a network error, use saved data
          if (
            savedUser &&
            (firebaseError.code === "network-error" || !isOnline)
          ) {
            console.warn("⚠️ Using saved user data due to network error");
            try {
              const userData = JSON.parse(savedUser);
              setUser(userData);
            } catch (parseError) {
              console.error("❌ Error parsing saved user:", parseError);
              localStorage.removeItem("authToken");
              localStorage.removeItem("user");
              setUser(null);
            }
          } else {
            setError("Authentication error. Please try logging in again.");
            // Clear invalid auth state
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            setUser(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error("❌ Auth state observer error:", error);

        // If we have saved user data and it's a network error, use saved data
        if (savedUser && (error.code === "network-error" || !isOnline)) {
          console.warn("⚠️ Using saved user data due to observer error");
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
          } catch (parseError) {
            console.error("❌ Error parsing saved user:", parseError);
          }
        } else {
          setError("Connection error. Working in offline mode.");
        }

        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isOnline]);

  // Enhanced login function with network error handling
  const login = useCallback(
    async (credentials) => {
      try {
        console.log("🔐 Attempting login for:", credentials.email);
        setLoading(true);
        setError(null);

        // Check network status
        if (!isOnline) {
          throw new Error(
            "No internet connection. Please check your network and try again."
          );
        }

        // Validate credentials
        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error("Email and password are required");
        }

        const email = String(credentials.email).trim();
        const password = String(credentials.password);

        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        console.log("📧 Final email value:", email);
        console.log("🔒 Password length:", password.length);

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const firebaseUser = userCredential.user;

        // Get fresh token
        const token = await firebaseUser.getIdToken();

        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL,
          role: 'student', // Set default role
          userType: 'student'
        };

        console.log("✅ Login successful:", userData);

        // Update state and storage
        setUser(userData);
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(userData));

        return { success: true, user: userData };
      } catch (error) {
        console.error("❌ Login error:", error);
        const errorMessage = getFirebaseErrorMessage(error.code);
        setError(errorMessage);

        // Clear any invalid auth state
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setUser(null);

        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [isOnline]
  );

  // Alternative login function that accepts separate parameters
  const loginWithSeparateParams = useCallback(
    async (email, password) => {
      return login({ email, password });
    },
    [login]
  );

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      console.log("🚪 Logging out user...");
      setLoading(true);

      // Only try Firebase logout if we're online
      if (isOnline) {
        await signOut(auth);
      }

      // Always clear local storage and state
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setUser(null);
      setError(null);

      console.log("✅ User logged out successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Logout error:", error);

      // Still clear local storage even if Firebase signOut fails
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setUser(null);

      const errorMessage = getFirebaseErrorMessage(error.code);
      setError(errorMessage);

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  // Get Firebase error messages
  const getFirebaseErrorMessage = (errorCode) => {
    const errorMessages = {
      "auth/invalid-email": "Invalid email address",
      "auth/user-disabled": "This account has been disabled",
      "auth/user-not-found": "No account found with this email",
      "auth/wrong-password": "Incorrect password",
      "auth/email-already-in-use": "An account with this email already exists",
      "auth/weak-password": "Password should be at least 6 characters",
      "auth/network-request-failed":
        "Network error. Please check your connection and try again.",
      "auth/too-many-requests": "Too many attempts. Please try again later",
      "auth/requires-recent-login":
        "Please log in again to perform this action",
      "auth/invalid-credential": "Invalid email or password",
      "auth/invalid-value-(email),-starting-an-object-on-a-scalar-field":
        "Invalid email format",
      "auth/unavailable":
        "Service temporarily unavailable. Please try again later.",
      "auth/internal-error": "Internal server error. Please try again.",
    };

    return errorMessages[errorCode] || "An unexpected error occurred";
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Retry connection
  const retryConnection = () => {
    setError(null);
    setLoading(true);

    // Simulate reconnection attempt
    setTimeout(() => {
      setLoading(false);
      if (navigator.onLine) {
        setError(null);
      } else {
        setError("Still offline. Please check your internet connection.");
      }
    }, 1000);
  };

  // Memoized context value
  const value = useMemo(
    () => ({
      user,
      login,
      loginWithSeparateParams,
      logout,
      loading,
      error,
      isAuthenticated: !!user,
      isOnline,
      clearError,
      retryConnection,
    }),
    [user, loading, error, isOnline, login, loginWithSeparateParams, logout]
  );

  console.log("🏪 AuthContext value:", {
    user: user ? {
      uid: user.uid,
      email: user.email,
      role: user.role,
      userType: user.userType
    } : null,
    loading,
    isAuthenticated: !!user,
    isOnline,
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
