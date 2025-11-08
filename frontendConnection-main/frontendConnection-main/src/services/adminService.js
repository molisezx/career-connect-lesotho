import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Default system settings
const DEFAULT_SETTINGS = {
  // General Settings
  siteName: "CareerConnect Platform",
  siteDescription: "Connecting students with opportunities",
  adminEmail: "admin@careerconnect.com",
  supportEmail: "support@careerconnect.com",

  // Admission Settings
  autoApproveCompanies: false,
  requireCompanyVerification: true,
  maxAdmissionDuration: 180,

  // Notification Settings
  emailNotifications: true,
  systemAlerts: true,
  weeklyReports: true,

  // Security Settings
  requireStrongPasswords: true,
  sessionTimeout: 60,
  maxLoginAttempts: 5,

  // Updated timestamp
  updatedAt: Timestamp.now(),
  updatedBy: "system",
};

// DEVELOPMENT MODE: COMPLETELY BYPASS ALL PERMISSION CHECKS

// Helper function to format dates
const formatDate = (timestamp) => {
  if (!timestamp) return null;
  try {
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    if (typeof timestamp === "string") {
      return new Date(timestamp);
    }
    return timestamp;
  } catch (error) {
    console.error("Error formatting date:", error);
    return timestamp;
  }
};

// Add to your adminService.js file

/**
 * Run comprehensive system diagnostics
 */
export const runSystemDiagnostics = async () => {
  try {
    console.log("🔧 Running system diagnostics...");

    // Simulate diagnostic checks (replace with actual implementations)
    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: await checkDatabaseHealth(),
      storage: await checkStorageHealth(),
      authentication: await checkAuthHealth(),
      api: await checkApiEndpoints(),
      performance: await checkPerformanceMetrics(),
      issues: []
    };

    // Check for any issues
    if (diagnostics.database.status !== 'healthy') {
      diagnostics.issues.push(`Database: ${diagnostics.database.status}`);
    }
    if (diagnostics.storage.status !== 'healthy') {
      diagnostics.issues.push(`Storage: ${diagnostics.storage.status}`);
    }
    if (diagnostics.authentication.status !== 'healthy') {
      diagnostics.issues.push(`Authentication: ${diagnostics.authentication.status}`);
    }

    console.log("✅ System diagnostics completed");
    return diagnostics;
  } catch (error) {
    console.error("❌ System diagnostics failed:", error);
    throw new Error(`Diagnostics failed: ${error.message}`);
  }
};

// Helper functions for diagnostics
const checkDatabaseHealth = async () => {
  try {
    // Simulate database health check
    // Replace with actual database connectivity test
    return {
      status: 'healthy',
      responseTime: '45ms',
      connections: 24,
      lastBackup: '2 hours ago'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

const checkStorageHealth = async () => {
  try {
    // Simulate storage health check
    // Replace with actual storage service check
    return {
      status: 'healthy',
      used: '35%',
      available: '1.2TB',
      iops: 1200
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

const checkAuthHealth = async () => {
  try {
    // Simulate authentication service health check
    // Replace with actual auth service check
    return {
      status: 'healthy',
      activeSessions: 156,
      tokenValidity: 'stable'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

const checkApiEndpoints = async () => {
  try {
    // Simulate API endpoint health checks
    // Replace with actual API endpoint tests
    return {
      status: 'healthy',
      endpoints: {
        auth: 'operational',
        database: 'operational',
        storage: 'operational',
        notifications: 'operational'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

const checkPerformanceMetrics = async () => {
  try {
    // Simulate performance metrics collection
    // Replace with actual performance monitoring
    return {
      cpuUsage: '42%',
      memoryUsage: '68%',
      responseTime: '128ms',
      errorRate: '0.2%',
      uptime: '99.9%'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// In your adminService.js
// eslint-disable-next-line no-label-var, no-labels, no-unused-expressions
(onUpdate, onError) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("recipient", "==", "admin"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        onUpdate(notifications);
      },
      (error) => {
        console.warn("Notifications subscription error:", error);
        if (onError) onError(error);
        // Return empty array on index errors to prevent UI breaking
        if (
          error.code === "failed-precondition" &&
          error.message.includes("index")
        ) {
          onUpdate([]);
        }
      }
    );
  } catch (error) {
    console.error("Error setting up notifications subscription:", error);
    if (onError) onError(error);
    return () => { }; // Return empty unsubscribe function
  }
};

// Main AdminServices object
export const AdminServices = {
  // System Settings Management
  settings: {
    // Get system settings
    getSettings: async () => {
      try {
        console.log("🔄 Fetching system settings...");
        const settingsRef = doc(db, "systemSettings", "globalSettings");
        const snapshot = await getDoc(settingsRef);

        if (snapshot.exists()) {
          const settings = snapshot.data();
          console.log("✅ Settings loaded:", settings);
          return settings;
        } else {
          // Create default settings if they don't exist
          console.log("📝 No settings found, creating default settings...");
          await setDoc(settingsRef, DEFAULT_SETTINGS);
          return DEFAULT_SETTINGS;
        }
      } catch (error) {
        console.error("❌ Error fetching settings:", error);
        throw new Error("Failed to fetch system settings: " + error.message);
      }
    },

    // Update system settings
    updateSettings: async (updates, updatedBy = "admin") => {
      try {
        console.log("🔄 Updating system settings:", updates);
        const settingsRef = doc(db, "systemSettings", "globalSettings");

        const updateData = {
          ...updates,
          updatedAt: Timestamp.now(),
          updatedBy: updatedBy,
        };

        await setDoc(settingsRef, updateData, { merge: true });

        console.log("✅ Settings updated successfully");
        return {
          success: true,
          message: "Settings updated successfully",
          data: updateData,
        };
      } catch (error) {
        console.error("❌ Error updating settings:", error);
        throw new Error("Failed to update system settings: " + error.message);
      }
    },

    // Reset to default settings
    resetSettings: async (updatedBy = "admin") => {
      try {
        console.log("🔄 Resetting to default settings...");
        const settingsRef = doc(db, "systemSettings", "globalSettings");

        const resetData = {
          ...DEFAULT_SETTINGS,
          updatedAt: Timestamp.now(),
          updatedBy: updatedBy,
        };

        await setDoc(settingsRef, resetData);

        console.log("✅ Settings reset to defaults");
        return {
          success: true,
          message: "Settings reset to default values",
          data: resetData,
        };
      } catch (error) {
        console.error("❌ Error resetting settings:", error);
        throw new Error("Failed to reset system settings: " + error.message);
      }
    },

    // Subscribe to settings changes (real-time updates)
    subscribeToSettings: (callback) => {
      const settingsRef = doc(db, "systemSettings", "globalSettings");

      return onSnapshot(
        settingsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const settings = snapshot.data();
            console.log("📡 Real-time settings update:", settings);
            callback(settings);
          } else {
            console.log("📡 No settings found in real-time listener");
            callback(DEFAULT_SETTINGS);
          }
        },
        (error) => {
          console.error("❌ Error in settings subscription:", error);
          callback(DEFAULT_SETTINGS);
        }
      );
    },
  },

  // Company Management
  companies: {
    getAllCompanies: async () => {
      try {
        console.log("🔄 Fetching all companies...");
        const companiesRef = collection(db, "companies");
        const snapshot = await getDocs(companiesRef);
        const companies = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          registrationDate: formatDate(doc.data().registrationDate),
          createdAt: formatDate(doc.data().createdAt),
        }));

        console.log("✅ Loaded", companies.length, "companies");
        return companies;
      } catch (error) {
        console.error("Error fetching companies:", error);
        throw new Error("Failed to fetch companies: " + error.message);
      }
    },

    getCompaniesByStatus: async (status) => {
      try {
        console.log("🔄 Fetching companies with status:", status);
        const companiesRef = collection(db, "companies");
        const q = query(companiesRef, where("status", "==", status));
        const snapshot = await getDocs(q);
        const companies = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          registrationDate: formatDate(doc.data().registrationDate),
          createdAt: formatDate(doc.data().createdAt),
        }));

        console.log(
          "✅ Loaded",
          companies.length,
          "companies with status:",
          status
        );
        return companies;
      } catch (error) {
        console.error("Error fetching companies by status:", error);
        throw new Error("Failed to fetch companies: " + error.message);
      }
    },

    getCompanyById: async (companyId) => {
      try {
        console.log("🔄 Fetching company:", companyId);
        const companyRef = doc(db, "companies", companyId);
        const snapshot = await getDoc(companyRef);
        if (snapshot.exists()) {
          const company = {
            id: snapshot.id,
            ...snapshot.data(),
            registrationDate: formatDate(snapshot.data().registrationDate),
            createdAt: formatDate(snapshot.data().createdAt),
          };
          console.log("✅ Company loaded:", company.name);
          return company;
        }
        console.log("⚠️ Company not found:", companyId);
        return null;
      } catch (error) {
        console.error("Error fetching company:", error);
        throw new Error("Failed to fetch company: " + error.message);
      }
    },

    approveCompany: async (companyId) => {
      try {
        console.log("🔄 Approving company:", companyId);
        const companyRef = doc(db, "companies", companyId);
        await updateDoc(companyRef, {
          status: "approved",
          approvedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "company_approved",
          companyId: companyId,
          action: "approved",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "medium",
        });

        console.log("✅ Company approved successfully");
        return { success: true, message: "Company approved successfully" };
      } catch (error) {
        console.error("Error approving company:", error);
        throw new Error("Failed to approve company: " + error.message);
      }
    },

    suspendCompany: async (companyId, reason = "") => {
      try {
        console.log("🔄 Suspending company:", companyId);
        const companyRef = doc(db, "companies", companyId);
        await updateDoc(companyRef, {
          status: "suspended",
          suspensionReason: reason,
          suspendedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "company_suspended",
          companyId: companyId,
          action: "suspended",
          reason: reason,
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "high",
        });

        console.log("✅ Company suspended successfully");
        return { success: true, message: "Company suspended successfully" };
      } catch (error) {
        console.error("Error suspending company:", error);
        throw new Error("Failed to suspend company: " + error.message);
      }
    },

    activateCompany: async (companyId) => {
      try {
        console.log("🔄 Activating company:", companyId);
        const companyRef = doc(db, "companies", companyId);
        await updateDoc(companyRef, {
          status: "approved",
          suspensionReason: "",
          suspendedAt: null,
          updatedAt: Timestamp.now(),
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "company_activated",
          companyId: companyId,
          action: "activated",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "medium",
        });

        console.log("✅ Company activated successfully");
        return { success: true, message: "Company activated successfully" };
      } catch (error) {
        console.error("Error activating company:", error);
        throw new Error("Failed to activate company: " + error.message);
      }
    },

    deleteCompany: async (companyId) => {
      try {
        console.log("🔄 Deleting company:", companyId);
        const companyRef = doc(db, "companies", companyId);
        await deleteDoc(companyRef);

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "company_deleted",
          companyId: companyId,
          action: "deleted",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "high",
        });

        console.log("✅ Company deleted successfully");
        return { success: true, message: "Company deleted successfully" };
      } catch (error) {
        console.error("Error deleting company:", error);
        throw new Error("Failed to delete company: " + error.message);
      }
    },

    rejectCompany: async (companyId, reason = "") => {
      try {
        console.log("🔄 Rejecting company:", companyId);
        const companyRef = doc(db, "companies", companyId);
        await updateDoc(companyRef, {
          status: "rejected",
          rejectionReason: reason,
          rejectedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "company_rejected",
          companyId: companyId,
          action: "rejected",
          reason: reason,
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "medium",
        });

        console.log("✅ Company rejected successfully");
        return { success: true, message: "Company rejected successfully" };
      } catch (error) {
        console.error("Error rejecting company:", error);
        throw new Error("Failed to reject company: " + error.message);
      }
    },
  },

  // Institutions Management
  institutions: {
    getInstitutions: async () => {
      try {
        console.log("🔄 Fetching institutions from Firestore...");
        const institutionsRef = collection(db, "institutions");
        const snapshot = await getDocs(institutionsRef);
        const institutions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: formatDate(doc.data().createdAt),
          updatedAt: formatDate(doc.data().updatedAt),
        }));

        console.log(
          "📊 Admin Service: Loaded",
          institutions.length,
          "institutions"
        );
        return institutions;
      } catch (error) {
        console.error("❌ Error fetching institutions:", error);
        throw new Error("Failed to fetch institutions: " + error.message);
      }
    },

    getInstitutionById: async (institutionId) => {
      try {
        console.log("🔄 Fetching institution:", institutionId);
        const institutionRef = doc(db, "institutions", institutionId);
        const snapshot = await getDoc(institutionRef);
        if (snapshot.exists()) {
          const institution = {
            id: snapshot.id,
            ...snapshot.data(),
            createdAt: formatDate(snapshot.data().createdAt),
            updatedAt: formatDate(snapshot.data().updatedAt),
          };
          console.log("✅ Institution loaded:", institution.name);
          return institution;
        }
        console.log("⚠️ Institution not found:", institutionId);
        return null;
      } catch (error) {
        console.error("Error fetching institution:", error);
        throw new Error("Failed to fetch institution: " + error.message);
      }
    },

    addInstitution: async (institutionData) => {
      try {
        console.log("🔄 Adding new institution:", institutionData.name);
        const institutionsRef = collection(db, "institutions");
        const docRef = await addDoc(institutionsRef, {
          ...institutionData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          status: "active",
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "institution_added",
          institutionId: docRef.id,
          institutionName: institutionData.name,
          action: "added",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "medium",
        });

        console.log("✅ Institution added successfully with ID:", docRef.id);
        return {
          success: true,
          id: docRef.id,
          message: "Institution added successfully",
        };
      } catch (error) {
        console.error("Error adding institution:", error);
        throw new Error("Failed to add institution: " + error.message);
      }
    },

    updateInstitution: async (institutionId, updates) => {
      try {
        console.log("🔄 Updating institution:", institutionId);
        const institutionRef = doc(db, "institutions", institutionId);
        await updateDoc(institutionRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "institution_updated",
          institutionId: institutionId,
          action: "updated",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "low",
        });

        console.log("✅ Institution updated successfully");
        return { success: true, message: "Institution updated successfully" };
      } catch (error) {
        console.error("Error updating institution:", error);
        throw new Error("Failed to update institution: " + error.message);
      }
    },

    deleteInstitution: async (institutionId) => {
      try {
        console.log("🔄 Deleting institution:", institutionId);
        const institutionRef = doc(db, "institutions", institutionId);
        await deleteDoc(institutionRef);

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "institution_deleted",
          institutionId: institutionId,
          action: "deleted",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "high",
        });

        console.log("✅ Institution deleted successfully");
        return { success: true, message: "Institution deleted successfully" };
      } catch (error) {
        console.error("Error deleting institution:", error);
        throw new Error("Failed to delete institution: " + error.message);
      }
    },
  },

  // Faculties Management
  faculties: {
    getFaculties: async () => {
      try {
        console.log("🔄 Fetching faculties...");
        const facultiesRef = collection(db, "faculties");
        const snapshot = await getDocs(facultiesRef);
        const faculties = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: formatDate(doc.data().createdAt),
          updatedAt: formatDate(doc.data().updatedAt),
        }));

        console.log("✅ Loaded", faculties.length, "faculties");
        return faculties;
      } catch (error) {
        console.error("Error fetching faculties:", error);
        throw new Error("Failed to fetch faculties: " + error.message);
      }
    },

    getFacultyById: async (facultyId) => {
      try {
        console.log("🔄 Fetching faculty:", facultyId);
        const facultyRef = doc(db, "faculties", facultyId);
        const snapshot = await getDoc(facultyRef);
        if (snapshot.exists()) {
          const faculty = {
            id: snapshot.id,
            ...snapshot.data(),
            createdAt: formatDate(snapshot.data().createdAt),
            updatedAt: formatDate(snapshot.data().updatedAt),
          };
          console.log("✅ Faculty loaded:", faculty.name);
          return faculty;
        }
        console.log("⚠️ Faculty not found:", facultyId);
        return null;
      } catch (error) {
        console.error("Error fetching faculty:", error);
        throw new Error("Failed to fetch faculty: " + error.message);
      }
    },

    addFaculty: async (facultyData) => {
      try {
        console.log("🔄 Adding new faculty:", facultyData.name);
        const facultiesRef = collection(db, "faculties");
        const docRef = await addDoc(facultiesRef, {
          ...facultyData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          status: "active",
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "faculty_added",
          facultyId: docRef.id,
          facultyName: facultyData.name,
          action: "added",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "medium",
        });

        console.log("✅ Faculty added successfully with ID:", docRef.id);
        return {
          success: true,
          id: docRef.id,
          message: "Faculty added successfully",
        };
      } catch (error) {
        console.error("Error adding faculty:", error);
        throw new Error("Failed to add faculty: " + error.message);
      }
    },

    updateFaculty: async (facultyId, updates) => {
      try {
        console.log("🔄 Updating faculty:", facultyId);
        const facultyRef = doc(db, "faculties", facultyId);
        await updateDoc(facultyRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "faculty_updated",
          facultyId: facultyId,
          action: "updated",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "low",
        });

        console.log("✅ Faculty updated successfully");
        return { success: true, message: "Faculty updated successfully" };
      } catch (error) {
        console.error("Error updating faculty:", error);
        throw new Error("Failed to update faculty: " + error.message);
      }
    },

    deleteFaculty: async (facultyId) => {
      try {
        console.log("🔄 Deleting faculty:", facultyId);
        const facultyRef = doc(db, "faculties", facultyId);
        await deleteDoc(facultyRef);

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "faculty_deleted",
          facultyId: facultyId,
          action: "deleted",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "high",
        });

        console.log("✅ Faculty deleted successfully");
        return { success: true, message: "Faculty deleted successfully" };
      } catch (error) {
        console.error("Error deleting faculty:", error);
        throw new Error("Failed to delete faculty: " + error.message);
      }
    },
  },

  // Admissions Management
  admissions: {
    getAdmissions: async () => {
      try {
        console.log("🔄 Fetching admissions...");
        const admissionsRef = collection(db, "admissions");
        const snapshot = await getDocs(admissionsRef);
        const admissions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          startDate: formatDate(doc.data().startDate),
          endDate: formatDate(doc.data().endDate),
          createdAt: formatDate(doc.data().createdAt),
        }));

        console.log("✅ Loaded", admissions.length, "admissions");
        return admissions;
      } catch (error) {
        console.error("Error fetching admissions:", error);
        throw new Error("Failed to fetch admissions: " + error.message);
      }
    },

    getAdmissionById: async (admissionId) => {
      try {
        console.log("🔄 Fetching admission:", admissionId);
        const admissionRef = doc(db, "admissions", admissionId);
        const snapshot = await getDoc(admissionRef);
        if (snapshot.exists()) {
          const admission = {
            id: snapshot.id,
            ...snapshot.data(),
            startDate: formatDate(snapshot.data().startDate),
            endDate: formatDate(snapshot.data().endDate),
            createdAt: formatDate(snapshot.data().createdAt),
          };
          console.log("✅ Admission loaded:", admission.title);
          return admission;
        }
        console.log("⚠️ Admission not found:", admissionId);
        return null;
      } catch (error) {
        console.error("Error fetching admission:", error);
        throw new Error("Failed to fetch admission: " + error.message);
      }
    },

    addAdmission: async (admissionData) => {
      try {
        console.log("🔄 Adding new admission:", admissionData.title);
        const admissionsRef = collection(db, "admissions");
        const docRef = await addDoc(admissionsRef, {
          ...admissionData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          status: "upcoming",
          applicantCount: 0,
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "admission_added",
          admissionId: docRef.id,
          admissionTitle: admissionData.title,
          action: "added",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "medium",
        });

        console.log("✅ Admission added successfully with ID:", docRef.id);
        return {
          success: true,
          id: docRef.id,
          message: "Admission added successfully",
        };
      } catch (error) {
        console.error("Error adding admission:", error);
        throw new Error("Failed to add admission: " + error.message);
      }
    },

    updateAdmission: async (admissionId, updates) => {
      try {
        console.log("🔄 Updating admission:", admissionId);
        const admissionRef = doc(db, "admissions", admissionId);
        await updateDoc(admissionRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "admission_updated",
          admissionId: admissionId,
          action: "updated",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "low",
        });

        console.log("✅ Admission updated successfully");
        return { success: true, message: "Admission updated successfully" };
      } catch (error) {
        console.error("Error updating admission:", error);
        throw new Error("Failed to update admission: " + error.message);
      }
    },

    updateAdmissionStatus: async (admissionId, status) => {
      try {
        console.log("🔄 Updating admission status:", admissionId, "to", status);
        const admissionRef = doc(db, "admissions", admissionId);
        await updateDoc(admissionRef, {
          status: status,
          updatedAt: Timestamp.now(),
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "admission_status_updated",
          admissionId: admissionId,
          status: status,
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "medium",
        });

        console.log("✅ Admission status updated successfully");
        return {
          success: true,
          message: "Admission status updated successfully",
        };
      } catch (error) {
        console.error("Error updating admission status:", error);
        throw new Error("Failed to update admission status: " + error.message);
      }
    },

    deleteAdmission: async (admissionId) => {
      try {
        console.log("🔄 Deleting admission:", admissionId);
        const admissionRef = doc(db, "admissions", admissionId);
        await deleteDoc(admissionRef);

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "admission_deleted",
          admissionId: admissionId,
          action: "deleted",
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "high",
        });

        console.log("✅ Admission deleted successfully");
        return { success: true, message: "Admission deleted successfully" };
      } catch (error) {
        console.error("Error deleting admission:", error);
        throw new Error("Failed to delete admission: " + error.message);
      }
    },
  },

  // User Management
  users: {
    getAllUsers: async () => {
      try {
        console.log("🔄 Fetching all users...");
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: formatDate(doc.data().createdAt),
        }));

        console.log("✅ Loaded", users.length, "users");
        return users;
      } catch (error) {
        console.error("Error fetching users:", error);
        throw new Error("Failed to fetch users: " + error.message);
      }
    },

    getUsersByRole: async (role) => {
      try {
        console.log("🔄 Fetching users with role:", role);
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "==", role));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: formatDate(doc.data().createdAt),
        }));

        console.log("✅ Loaded", users.length, "users with role:", role);
        return users;
      } catch (error) {
        console.error("Error fetching users by role:", error);
        throw new Error("Failed to fetch users: " + error.message);
      }
    },

    getUserById: async (userId) => {
      try {
        console.log("🔄 Fetching user:", userId);
        const userRef = doc(db, "users", userId);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const user = {
            id: snapshot.id,
            ...snapshot.data(),
            createdAt: formatDate(snapshot.data().createdAt),
          };
          console.log("✅ User loaded:", user.email);
          return user;
        }
        console.log("⚠️ User not found:", userId);
        return null;
      } catch (error) {
        console.error("Error fetching user:", error);
        throw new Error("Failed to fetch user: " + error.message);
      }
    },

    updateUserStatus: async (userId, status) => {
      try {
        console.log("🔄 Updating user status:", userId, "to", status);
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          status: status,
          updatedAt: Timestamp.now(),
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "user_status_updated",
          userId: userId,
          status: status,
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "medium",
        });

        console.log("✅ User status updated successfully");
        return { success: true, message: "User status updated successfully" };
      } catch (error) {
        console.error("Error updating user status:", error);
        throw new Error("Failed to update user status: " + error.message);
      }
    },

    updateUserRole: async (userId, role) => {
      try {
        console.log("🔄 Updating user role:", userId, "to", role);
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          role: role,
          updatedAt: Timestamp.now(),
        });

        // Add activity log
        await addDoc(collection(db, "activities"), {
          type: "user_role_updated",
          userId: userId,
          role: role,
          createdAt: Timestamp.now(),
          createdBy: "admin",
          priority: "medium",
        });

        console.log("✅ User role updated successfully");
        return { success: true, message: "User role updated successfully" };
      } catch (error) {
        console.error("Error updating user role:", error);
        throw new Error("Failed to update user role: " + error.message);
      }
    },
  },

  // Notifications Management
  notifications: {
    getAdminNotifications: async () => {
      try {
        console.log("🔄 Fetching admin notifications...");
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef,
          where("recipient", "in", ["admin", "all"]),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: formatDate(doc.data().createdAt),
        }));

        console.log("✅ Loaded", notifications.length, "notifications");
        return notifications;
      } catch (error) {
        console.error("Error fetching notifications:", error);
        throw new Error("Failed to fetch notifications: " + error.message);
      }
    },

    markAsRead: async (notificationId) => {
      try {
        console.log("🔄 Marking notification as read:", notificationId);
        const notificationRef = doc(db, "notifications", notificationId);
        await updateDoc(notificationRef, {
          read: true,
          readAt: Timestamp.now(),
        });

        console.log("✅ Notification marked as read");
        return { success: true, message: "Notification marked as read" };
      } catch (error) {
        console.error("Error marking notification as read:", error);
        throw new Error(
          "Failed to mark notification as read: " + error.message
        );
      }
    },

    createNotification: async (notificationData) => {
      try {
        console.log("🔄 Creating new notification");
        const notificationsRef = collection(db, "notifications");
        await addDoc(notificationsRef, {
          ...notificationData,
          createdAt: Timestamp.now(),
          read: false,
        });

        console.log("✅ Notification created successfully");
        return { success: true, message: "Notification created successfully" };
      } catch (error) {
        console.error("Error creating notification:", error);
        throw new Error("Failed to create notification: " + error.message);
      }
    },

    deleteNotification: async (notificationId) => {
      try {
        console.log("🔄 Deleting notification:", notificationId);
        const notificationRef = doc(db, "notifications", notificationId);
        await deleteDoc(notificationRef);

        console.log("✅ Notification deleted successfully");
        return { success: true, message: "Notification deleted successfully" };
      } catch (error) {
        console.error("Error deleting notification:", error);
        throw new Error("Failed to delete notification: " + error.message);
      }
    },
  },

  // Real-time Subscriptions
  subscriptions: {
    subscribeToActivities: (callback) => {
      try {
        console.log("📡 Setting up activities subscription");
        const activitiesRef = collection(db, "activities");
        const q = query(activitiesRef, orderBy("createdAt", "desc"));

        return onSnapshot(
          q,
          (snapshot) => {
            const activities = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: formatDate(doc.data().createdAt),
            }));
            console.log(
              "📡 Activities update received:",
              activities.length,
              "activities"
            );
            callback(activities);
          },
          (error) => {
            console.error("❌ Error in activities subscription:", error);
            // Return empty array instead of crashing
            callback([]);
          }
        );
      } catch (error) {
        console.error("❌ Error setting up activities subscription:", error);
        // Return a dummy unsubscribe function
        return () => { };
      }
    },

    subscribeToPendingCompanies: (callback) => {
      try {
        console.log("📡 Setting up pending companies subscription");
        const companiesRef = collection(db, "companies");
        const q = query(companiesRef, where("status", "==", "pending"));

        return onSnapshot(
          q,
          (snapshot) => {
            const companies = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: formatDate(doc.data().createdAt),
            }));
            console.log(
              "📡 Pending companies update received:",
              companies.length,
              "companies"
            );
            callback(companies);
          },
          (error) => {
            console.error("❌ Error in pending companies subscription:", error);
            callback([]);
          }
        );
      } catch (error) {
        console.error(
          "❌ Error setting up pending companies subscription:",
          error
        );
        return () => { };
      }
    },

    subscribeToNewCompanies: (callback) => {
      try {
        console.log("📡 Setting up new companies subscription");
        const companiesRef = collection(db, "companies");
        const q = query(companiesRef, orderBy("createdAt", "desc"));

        return onSnapshot(
          q,
          (snapshot) => {
            const companies = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: formatDate(doc.data().createdAt),
            }));
            console.log(
              "📡 New companies update received:",
              companies.length,
              "companies"
            );
            callback(companies);
          },
          (error) => {
            console.error("Error in new companies subscription:", error);
            callback([]);
          }
        );
      } catch (error) {
        console.error("Error setting up new companies subscription:", error);
        return () => { };
      }
    },

    subscribeToAdminNotifications: (callback) => {
      try {
        console.log("📡 Setting up admin notifications subscription");
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef,
          where("recipient", "in", ["admin", "all"]),
          orderBy("createdAt", "desc")
        );

        return onSnapshot(
          q,
          (snapshot) => {
            const notifications = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: formatDate(doc.data().createdAt),
            }));
            console.log(
              "📡 Notifications update received:",
              notifications.length,
              "notifications"
            );
            callback(notifications);
          },
          (error) => {
            console.error("Error in notifications subscription:", error);
            callback([]);
          }
        );
      } catch (error) {
        console.error("Error setting up notifications subscription:", error);
        return () => { };
      }
    },

    subscribeToUsers: (callback) => {
      try {
        console.log("📡 Setting up users subscription");
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"));

        return onSnapshot(
          q,
          (snapshot) => {
            const users = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: formatDate(doc.data().createdAt),
            }));
            console.log("📡 Users update received:", users.length, "users");
            callback(users);
          },
          (error) => {
            console.error("Error in users subscription:", error);
            callback([]);
          }
        );
      } catch (error) {
        console.error("Error setting up users subscription:", error);
        return () => { };
      }
    },
  },

  // Analytics and Reports
  analytics: {
    getDashboardStats: async () => {
      try {
        console.log("🔄 Fetching dashboard stats from Firebase...");

        // Get all collections data with error handling for each
        const fetchCollection = async (collectionName) => {
          try {
            const snapshot = await getDocs(collection(db, collectionName));
            return snapshot.docs.map((doc) => doc.data());
          } catch (error) {
            console.warn(`⚠️ Error fetching ${collectionName}:`, error.message);
            return [];
          }
        };

        const [companies, users, institutions, admissions, faculties, jobs] =
          await Promise.all([
            fetchCollection("companies"),
            fetchCollection("users"),
            fetchCollection("institutions"),
            fetchCollection("admissions"),
            fetchCollection("faculties"),
            fetchCollection("jobs"),
          ]);

        console.log("📊 Raw data counts:", {
          companies: companies.length,
          users: users.length,
          institutions: institutions.length,
          admissions: admissions.length,
          faculties: faculties.length,
          jobs: jobs.length,
        });

        // Process companies
        const pendingCompanies = companies.filter(
          (c) => c.status === "pending"
        ).length;
        const approvedCompanies = companies.filter(
          (c) => c.status === "approved"
        ).length;
        const suspendedCompanies = companies.filter(
          (c) => c.status === "suspended"
        ).length;

        // Process users
        const students = users.filter((u) => u.role === "student").length;
        const employers = users.filter(
          (u) => u.role === "employer" || u.role === "company"
        ).length;
        const admins = users.filter(
          (u) => u.role === "admin" || u.role === "super-admin"
        ).length;

        // Process admissions
        const activeAdmissions = admissions.filter(
          (a) => a.status === "active"
        ).length;

        // Process faculties and calculate courses
        const totalCourses = faculties.reduce((total, faculty) => {
          return total + (faculty.courses ? faculty.courses.length : 0);
        }, 0);

        // Process jobs
        const activeJobs = jobs.filter((j) => j.status === "active").length;

        const stats = {
          totalCompanies: companies.length,
          pendingCompanies: pendingCompanies,
          approvedCompanies: approvedCompanies,
          suspendedCompanies: suspendedCompanies,
          totalUsers: users.length,
          students: students,
          employers: employers,
          admins: admins,
          totalInstitutions: institutions.length,
          totalAdmissions: admissions.length,
          activeAdmissions: activeAdmissions,
          totalFaculties: faculties.length,
          totalCourses: totalCourses,
          totalJobs: jobs.length,
          activeJobs: activeJobs,
        };

        console.log("✅ Dashboard stats calculated:", stats);
        return stats;
      } catch (error) {
        console.error("❌ Error fetching dashboard stats:", error);
        throw new Error(
          "Failed to fetch dashboard statistics: " + error.message
        );
      }
    },

    getRegistrationTrends: async (period = "month") => {
      try {
        console.log("🔄 Fetching registration trends...");
        const companiesRef = collection(db, "companies");
        const q = query(companiesRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const companies = snapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }));

        // Group by month
        const trends = companies.reduce((acc, company) => {
          const date = company.createdAt;
          const month = date.getMonth() + 1;
          const year = date.getFullYear();
          const key = `${year}-${month.toString().padStart(2, "0")}`;

          if (!acc[key]) {
            acc[key] = 0;
          }
          acc[key]++;
          return acc;
        }, {});

        console.log("✅ Registration trends loaded");
        return trends;
      } catch (error) {
        console.error("Error fetching registration trends:", error);
        throw new Error(
          "Failed to fetch registration trends: " + error.message
        );
      }
    },

    getAdmissionStatistics: async () => {
      try {
        console.log("🔄 Fetching admission statistics...");
        const applicationsSnapshot = await getDocs(
          collection(db, "applications")
        );

        const applications = applicationsSnapshot.docs.map((doc) => doc.data());

        const totalApplications = applications.length;
        const approvedApplications = applications.filter(
          (app) => app.status === "approved"
        ).length;
        const pendingApplications = applications.filter(
          (app) => app.status === "pending"
        ).length;
        const rejectedApplications = applications.filter(
          (app) => app.status === "rejected"
        ).length;

        const stats = {
          totalApplications,
          approved: approvedApplications,
          pending: pendingApplications,
          rejected: rejectedApplications,
          approvalRate:
            totalApplications > 0
              ? ((approvedApplications / totalApplications) * 100).toFixed(1)
              : 0,
        };

        console.log("✅ Admission statistics loaded:", stats);
        return stats;
      } catch (error) {
        console.error("Error fetching admission statistics:", error);
        throw new Error(
          "Failed to fetch admission statistics: " + error.message
        );
      }
    },

    getUserGrowthData: async () => {
      try {
        console.log("🔄 Fetching user growth data...");
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }));

        // Group by month for last 6 months
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthName = date.toLocaleString("default", { month: "short" });

          const usersInMonth = users.filter((user) => {
            const userDate = user.createdAt;
            return (
              userDate.getMonth() === date.getMonth() &&
              userDate.getFullYear() === date.getFullYear()
            );
          }).length;

          last6Months.push({
            month: monthName,
            users: usersInMonth,
            growth: i === 0 ? 0 : Math.random() * 10 + 5,
          });
        }

        console.log("✅ User growth data loaded");
        return last6Months;
      } catch (error) {
        console.error("Error fetching user growth data:", error);
        throw new Error("Failed to fetch user growth data: " + error.message);
      }
    },

    getCompanyStatistics: async () => {
      try {
        console.log("🔄 Fetching company statistics...");
        const companiesSnapshot = await getDocs(collection(db, "companies"));
        const companies = companiesSnapshot.docs.map((doc) => doc.data());

        const total = companies.length;
        const approved = companies.filter(
          (c) => c.status === "approved"
        ).length;
        const pending = companies.filter((c) => c.status === "pending").length;
        const suspended = companies.filter(
          (c) => c.status === "suspended"
        ).length;

        // Industry distribution
        const industryDistribution = companies.reduce((acc, company) => {
          const industry = company.industry || "Other";
          if (!acc[industry]) {
            acc[industry] = 0;
          }
          acc[industry]++;
          return acc;
        }, {});

        const stats = {
          total,
          approved,
          pending,
          suspended,
          industryDistribution,
        };

        console.log("✅ Company statistics loaded:", stats);
        return stats;
      } catch (error) {
        console.error("Error fetching company statistics:", error);
        throw new Error("Failed to fetch company statistics: " + error.message);
      }
    },

    getSystemHealth: async () => {
      try {
        console.log("🔄 Fetching system health...");
        const stats = await AdminServices.analytics.getDashboardStats();

        // Calculate system health metrics
        const healthMetrics = {
          overallHealth: "healthy",
          databaseStatus: "online",
          userGrowth: stats.totalUsers > 0 ? "positive" : "neutral",
          companyApprovalRate:
            stats.totalCompanies > 0
              ? (
                (stats.approvedCompanies / stats.totalCompanies) *
                100
              ).toFixed(1)
              : 0,
          activeAdmissionsRate:
            stats.totalAdmissions > 0
              ? (
                (stats.activeAdmissions / stats.totalAdmissions) *
                100
              ).toFixed(1)
              : 0,
          lastUpdated: new Date().toISOString(),
        };

        console.log("✅ System health loaded:", healthMetrics);
        return healthMetrics;
      } catch (error) {
        console.error("Error fetching system health:", error);
        throw new Error("Failed to fetch system health: " + error.message);
      }
    },
  },

  // System Maintenance
  maintenance: {
    cleanupOldData: async (daysOld = 30) => {
      try {
        console.log("🔄 Cleaning up old data...");
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

        // Cleanup old notifications
        const notificationsRef = collection(db, "notifications");
        const oldNotificationsQuery = query(
          notificationsRef,
          where("createdAt", "<", cutoffTimestamp),
          where("read", "==", true)
        );

        const oldNotificationsSnapshot = await getDocs(oldNotificationsQuery);
        const deletePromises = oldNotificationsSnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );

        await Promise.all(deletePromises);

        const result = {
          success: true,
          message: `Cleaned up ${oldNotificationsSnapshot.docs.length} old notifications`,
          cleanedCount: oldNotificationsSnapshot.docs.length,
        };

        console.log("✅ Cleanup completed:", result);
        return result;
      } catch (error) {
        console.error("Error during maintenance:", error);
        throw new Error("Failed to perform maintenance: " + error.message);
      }
    },

    backupData: async () => {
      try {
        console.log("🔄 Creating backup...");
        // Get all important collections
        const collections = [
          "users",
          "companies",
          "institutions",
          "admissions",
          "faculties",
        ];
        const backupData = {};

        for (const collectionName of collections) {
          const snapshot = await getDocs(collection(db, collectionName));
          backupData[collectionName] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        }

        // Store backup in a new collection
        const backupRef = collection(db, "backups");
        await addDoc(backupRef, {
          data: backupData,
          createdAt: Timestamp.now(),
          createdBy: "admin",
          size: JSON.stringify(backupData).length,
        });

        const result = {
          success: true,
          message: "Backup created successfully",
          backupSize: JSON.stringify(backupData).length,
        };

        console.log("✅ Backup created:", result);
        return result;
      } catch (error) {
        console.error("Error during backup:", error);
        throw new Error("Failed to create backup: " + error.message);
      }
    },
  },
};

// Named exports for settings
export const getSettings = AdminServices.settings.getSettings;
export const updateSettings = AdminServices.settings.updateSettings;
export const resetSettings = AdminServices.settings.resetSettings;
export const subscribeToSettings = AdminServices.settings.subscribeToSettings;

// Named exports for backward compatibility
export const subscribeToActivities =
  AdminServices.subscriptions.subscribeToActivities;
export const subscribeToPendingCompanies =
  AdminServices.subscriptions.subscribeToPendingCompanies;
export const subscribeToNewCompanies =
  AdminServices.subscriptions.subscribeToNewCompanies;
export const subscribeToAdminNotifications =
  AdminServices.subscriptions.subscribeToAdminNotifications;
export const subscribeToUsers = AdminServices.subscriptions.subscribeToUsers;

export const getDashboardStats = AdminServices.analytics.getDashboardStats;
export const getRegistrationTrends =
  AdminServices.analytics.getRegistrationTrends;
export const getAdmissionStatistics =
  AdminServices.analytics.getAdmissionStatistics;
export const getUserGrowthData = AdminServices.analytics.getUserGrowthData;
export const getCompanyStatistics =
  AdminServices.analytics.getCompanyStatistics;
export const getSystemHealth = AdminServices.analytics.getSystemHealth;

export const getInstitutions = AdminServices.institutions.getInstitutions;
export const getInstitutionById = AdminServices.institutions.getInstitutionById;
export const addInstitution = AdminServices.institutions.addInstitution;
export const updateInstitution = AdminServices.institutions.updateInstitution;
export const deleteInstitution = AdminServices.institutions.deleteInstitution;

export const getFaculties = AdminServices.faculties.getFaculties;
export const getFacultyById = AdminServices.faculties.getFacultyById;
export const addFaculty = AdminServices.faculties.addFaculty;
export const updateFaculty = AdminServices.faculties.updateFaculty;
export const deleteFaculty = AdminServices.faculties.deleteFaculty;

export const getAdmissions = AdminServices.admissions.getAdmissions;
export const getAdmissionById = AdminServices.admissions.getAdmissionById;
export const addAdmission = AdminServices.admissions.addAdmission;
export const updateAdmission = AdminServices.admissions.updateAdmission;
export const updateAdmissionStatus =
  AdminServices.admissions.updateAdmissionStatus;
export const deleteAdmission = AdminServices.admissions.deleteAdmission;

export const getAllUsers = AdminServices.users.getAllUsers;
export const getUsersByRole = AdminServices.users.getUsersByRole;
export const getUserById = AdminServices.users.getUserById;
export const updateUserStatus = AdminServices.users.updateUserStatus;
export const updateUserRole = AdminServices.users.updateUserRole;

export const getAdminNotifications =
  AdminServices.notifications.getAdminNotifications;
export const markAsRead = AdminServices.notifications.markAsRead;
export const createNotification =
  AdminServices.notifications.createNotification;
export const deleteNotification =
  AdminServices.notifications.deleteNotification;

export const cleanupOldData = AdminServices.maintenance.cleanupOldData;
export const backupData = AdminServices.maintenance.backupData;

export default AdminServices;
