import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

const COMPANY_COLLECTION = "companies";
const JOBS_COLLECTION = "jobs";
const APPLICATIONS_COLLECTION = "applications";
const STUDENTS_COLLECTION = "students";
const USERS_COLLECTION = "users";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dphb5vldu";
const CLOUDINARY_UPLOAD_PRESET = "company_uploads";

// Helper function for safe date conversion
const safeDateConvert = (firebaseDate) => {
  if (!firebaseDate) return null;
  if (firebaseDate.toDate && typeof firebaseDate.toDate === "function") {
    return firebaseDate.toDate();
  }
  if (firebaseDate instanceof Date) {
    return firebaseDate;
  }
  if (typeof firebaseDate === "string") {
    return new Date(firebaseDate);
  }
  return null;
};

// Enhanced query with fallback for index issues
const executeCompanyQueryWithFallback = async (
  primaryQuery,
  fallbackQuery = null,
  errorContext = "query"
) => {
  try {
    // Try primary query first
    const snapshot = await getDocs(primaryQuery);
    return { success: true, data: snapshot, usedFallback: false };
  } catch (error) {
    console.warn(`⚠️ Primary ${errorContext} failed:`, error.message);

    // Handle index errors
    if (error.code === "failed-precondition") {
      console.log(
        `📋 Firestore index required for ${errorContext}. Please create it manually:`
      );
      const urlMatch = error.message.match(
        /https:\/\/console\.firebase\.google\.com[^\s]+/
      );
      if (urlMatch) {
        console.log(`🔗 ${urlMatch[0]}`);
      }
      console.log("⏳ Using fallback query while index builds...");
    }

    // Try fallback query if provided
    if (fallbackQuery) {
      try {
        console.log(`🔄 Trying fallback ${errorContext}...`);
        const fallbackSnapshot = await getDocs(fallbackQuery);
        return { success: true, data: fallbackSnapshot, usedFallback: true };
      } catch (fallbackError) {
        console.error(
          `❌ Fallback ${errorContext} also failed:`,
          fallbackError.message
        );
        return { success: false, error: fallbackError.message };
      }
    }

    return { success: false, error: error.message };
  }
};

// Cloudinary service
export const cloudinaryService = {
  async uploadImage(file, folder = "company-profile") {
    try {
      console.log("Starting upload process...");
      console.log("File details:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // Validate file
      this.validateImageFile(file);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", folder);
      formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

      console.log("Upload preset:", CLOUDINARY_UPLOAD_PRESET);
      console.log("Cloud name:", CLOUDINARY_CLOUD_NAME);
      console.log("Folder:", folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Raw error response:", errorText);

        try {
          const errorData = JSON.parse(errorText);
          console.error("Cloudinary error details:", errorData);
          throw new Error(
            `Upload failed: ${errorData.error?.message || "Unknown error"}`
          );
        } catch (parseError) {
          throw new Error(
            `Upload failed with status ${response.status}: ${errorText}`
          );
        }
      }

      const data = await response.json();
      console.log("Upload successful:", data);

      return {
        secure_url: data.secure_url,
        public_id: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
      };
    } catch (error) {
      console.error("Detailed upload error:", error);
      throw error;
    }
  },

  validateImageFile(file) {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!file) {
      throw new Error("No file provided");
    }

    if (!validTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type: ${file.type}. Supported types: JPEG, PNG, GIF, WebP`
      );
    }

    if (file.size > maxSize) {
      throw new Error(
        `File too large: ${(file.size / 1024 / 1024).toFixed(
          2
        )}MB. Max size: 10MB`
      );
    }

    return true;
  },
};

// Company Profile Services
export const companyService = {
  // Create or update company profile
  async createOrUpdateCompanyProfile(companyData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const companyRef = doc(db, COMPANY_COLLECTION, user.uid);
      const companySnap = await getDoc(companyRef);

      const profileData = {
        ...companyData,
        updatedAt: serverTimestamp(),
        email: user.email,
      };

      if (companySnap.exists()) {
        await updateDoc(companyRef, profileData);
      } else {
        await setDoc(companyRef, {
          ...profileData,
          userId: user.uid,
          createdAt: serverTimestamp(),
          profileViews: 0,
          isVerified: false,
          socialLinks: companyData.socialLinks || {},
          benefits: companyData.benefits || [],
          techStack: companyData.techStack || [],
        });
      }

      return await this.getCompanyProfile();
    } catch (error) {
      console.error("Error creating/updating company profile:", error);
      throw error;
    }
  },

  // Get company profile
  async getCompanyProfile() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const companyRef = doc(db, COMPANY_COLLECTION, user.uid);
      const companySnap = await getDoc(companyRef);

      if (companySnap.exists()) {
        const data = companySnap.data();
        return {
          id: companySnap.id,
          ...data,
          name: data.name || "",
          industry: data.industry || "",
          location: data.location || "",
          size: data.size || "",
          description: data.description || "",
          website: data.website || "",
          phone: data.phone || "",
          founded: data.founded || "",
          logo: data.logo || "",
          coverImage: data.coverImage || "",
          profileViews: data.profileViews || 0,
          isVerified: data.isVerified || false,
          socialLinks: data.socialLinks || {},
          benefits: data.benefits || [],
          techStack: data.techStack || [],
          createdAt: safeDateConvert(data.createdAt),
          updatedAt: safeDateConvert(data.updatedAt),
        };
      }

      return {
        id: user.uid,
        name: "",
        industry: "",
        description: "",
        website: "",
        location: "",
        size: "",
        founded: "",
        phone: "",
        email: user.email,
        logo: "",
        coverImage: "",
        profileViews: 0,
        isVerified: false,
        socialLinks: {},
        benefits: [],
        techStack: [],
      };
    } catch (error) {
      console.error("Error getting company profile:", error);
      throw error;
    }
  },

  // Update company profile
  async updateCompanyProfile(updates) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const companyRef = doc(db, COMPANY_COLLECTION, user.uid);
      await updateDoc(companyRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return await this.getCompanyProfile();
    } catch (error) {
      console.error("Error updating company profile:", error);
      throw error;
    }
  },

  // Upload company logo to Cloudinary
  async uploadLogo(file) {
    try {
      cloudinaryService.validateImageFile(file);
      const result = await cloudinaryService.uploadImage(file, "company-logos");

      // Update company profile with new logo URL
      await this.updateCompanyProfile({
        logo: result.secure_url,
        logoPublicId: result.public_id,
      });

      return result.secure_url;
    } catch (error) {
      console.error("Error uploading logo:", error);
      throw error;
    }
  },

  // Upload cover image to Cloudinary
  async uploadCoverImage(file) {
    try {
      cloudinaryService.validateImageFile(file);
      const result = await cloudinaryService.uploadImage(
        file,
        "company-covers"
      );

      // Update company profile with new cover image URL
      await this.updateCompanyProfile({
        coverImage: result.secure_url,
        coverImagePublicId: result.public_id,
      });

      return result.secure_url;
    } catch (error) {
      console.error("Error uploading cover image:", error);
      throw error;
    }
  },
};

// Job Services
export const jobService = {
  // Create new job posting
  async createJob(jobData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const company = await companyService.getCompanyProfile();
      if (!company) throw new Error("Company profile not found");

      const jobRef = await addDoc(collection(db, JOBS_COLLECTION), {
        ...jobData,
        companyId: user.uid,
        companyName: company.name,
        companyLogo: company.logo,
        companyIndustry: company.industry,
        companyLocation: company.location,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        applicantsCount: 0,
        views: 0,
        isActive: true,
        skills: jobData.skills || [],
        benefits: jobData.benefits || [],
        remote: jobData.remote || false,
        urgency: jobData.urgency || "normal",
      });

      return jobRef.id;
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  },

  // Get company's jobs with fallback for index issues
  async getCompanyJobs() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      // Primary query with ordering
      const primaryQuery = query(
        collection(db, JOBS_COLLECTION),
        where("companyId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      // Fallback query without ordering
      const fallbackQuery = query(
        collection(db, JOBS_COLLECTION),
        where("companyId", "==", user.uid)
      );

      const result = await executeCompanyQueryWithFallback(
        primaryQuery,
        fallbackQuery,
        "company jobs"
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      let jobs = result.data.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: safeDateConvert(doc.data().createdAt),
        updatedAt: safeDateConvert(doc.data().updatedAt),
      }));

      // If we used fallback, sort manually
      if (result.usedFallback) {
        jobs.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
      }

      return jobs;
    } catch (error) {
      console.error("Error getting company jobs:", error);
      throw error;
    }
  },

  // Get job by ID
  async getJobById(jobId) {
    try {
      const jobRef = doc(db, JOBS_COLLECTION, jobId);
      const jobSnap = await getDoc(jobRef);

      if (jobSnap.exists()) {
        const data = jobSnap.data();
        return {
          id: jobSnap.id,
          ...data,
          createdAt: safeDateConvert(data.createdAt),
          updatedAt: safeDateConvert(data.updatedAt),
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting job:", error);
      throw error;
    }
  },

  // Update job
  async updateJob(jobId, updates) {
    try {
      const jobRef = doc(db, JOBS_COLLECTION, jobId);
      await updateDoc(jobRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return await this.getJobById(jobId);
    } catch (error) {
      console.error("Error updating job:", error);
      throw error;
    }
  },

  // Delete job
  async deleteJob(jobId) {
    try {
      const jobRef = doc(db, JOBS_COLLECTION, jobId);
      await deleteDoc(jobRef);
    } catch (error) {
      console.error("Error deleting job:", error);
      throw error;
    }
  },

  // Get job statistics
  async getJobStats() {
    try {
      const jobs = await this.getCompanyJobs();
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(
        (job) => job.status === "active" && job.isActive
      ).length;
      const pausedJobs = jobs.filter((job) => job.status === "paused").length;
      const closedJobs = jobs.filter((job) => job.status === "closed").length;
      const totalApplicants = jobs.reduce(
        (sum, job) => sum + (job.applicantsCount || 0),
        0
      );
      const totalViews = jobs.reduce((sum, job) => sum + (job.views || 0), 0);

      return {
        totalJobs,
        activeJobs,
        pausedJobs,
        closedJobs,
        totalApplicants,
        totalViews,
      };
    } catch (error) {
      console.error("Error getting job stats:", error);
      throw error;
    }
  },
};

// Application Services
export const applicationService = {
  // Get applications for company's jobs with fallback for index issues
  async getCompanyApplications() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      // Primary query with ordering
      const primaryQuery = query(
        collection(db, APPLICATIONS_COLLECTION),
        where("companyId", "==", user.uid),
        orderBy("appliedAt", "desc")
      );

      // Fallback query without ordering
      const fallbackQuery = query(
        collection(db, APPLICATIONS_COLLECTION),
        where("companyId", "==", user.uid)
      );

      const result = await executeCompanyQueryWithFallback(
        primaryQuery,
        fallbackQuery,
        "company applications"
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      let applications = result.data.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          appliedAt: safeDateConvert(data.appliedAt),
          updatedAt: safeDateConvert(data.updatedAt),
        };
      });

      // If we used fallback, sort manually
      if (result.usedFallback) {
        applications.sort((a, b) => {
          const dateA = a.appliedAt ? new Date(a.appliedAt) : new Date(0);
          const dateB = b.appliedAt ? new Date(b.appliedAt) : new Date(0);
          return dateB - dateA;
        });
      }

      // Load candidate and job details
      const enrichedApplications = await Promise.all(
        applications.map(async (application) => {
          try {
            if (application.candidateId) {
              const candidate = await this.getCandidateProfile(
                application.candidateId
              );
              application.candidate = candidate;
            }

            if (application.jobId) {
              const job = await jobService.getJobById(application.jobId);
              application.job = job;
            }
          } catch (error) {
            console.error("Error enriching application:", error);
          }

          return application;
        })
      );

      return enrichedApplications;
    } catch (error) {
      console.error("Error getting company applications:", error);
      throw error;
    }
  },

  // Get candidate profile
  async getCandidateProfile(candidateId) {
    try {
      // First try students collection
      const studentRef = doc(db, STUDENTS_COLLECTION, candidateId);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        const data = studentSnap.data();
        return {
          id: studentSnap.id,
          fullName: data.fullName || "Unknown Student",
          email: data.email || "N/A",
          phone: data.phone || "N/A",
          location: data.location || "N/A",
          skills: data.skills || [],
          education: data.educationLevel || "Not specified",
          profileImage: data.profileImage || "",
          resume: data.resumeUrl || "",
          summary: data.summary || "",
          createdAt: safeDateConvert(data.createdAt),
        };
      }

      // Fallback to users collection
      const userRef = doc(db, USERS_COLLECTION, candidateId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        return {
          id: userSnap.id,
          fullName: userData.fullName || "Unknown User",
          email: userData.email || "N/A",
          phone: userData.phone || "N/A",
          location: userData.location || "N/A",
          skills: userData.skills || [],
          education: userData.education || "Not specified",
          profileImage: userData.profileImage || "",
          resume: userData.resume || "",
          summary: userData.summary || "",
          createdAt: safeDateConvert(userData.createdAt),
        };
      }

      return {
        id: candidateId,
        fullName: "Unknown Candidate",
        email: "N/A",
        phone: "N/A",
        location: "N/A",
        skills: [],
        education: "Not specified",
        profileImage: "",
        resume: "",
        summary: "",
      };
    } catch (error) {
      console.error("Error getting candidate profile:", error);
      return {
        id: candidateId,
        fullName: "Unknown Candidate",
        email: "N/A",
        phone: "N/A",
        location: "N/A",
        skills: [],
        education: "Not specified",
        profileImage: "",
        resume: "",
        summary: "",
      };
    }
  },

  // Update application status
  async updateApplicationStatus(applicationId, status, notes = "") {
    try {
      const applicationRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
      await updateDoc(applicationRef, {
        status,
        notes: notes || "",
        updatedAt: serverTimestamp(),
      });

      return await this.getApplicationById(applicationId);
    } catch (error) {
      console.error("Error updating application status:", error);
      throw error;
    }
  },

  // Get application by ID
  async getApplicationById(applicationId) {
    try {
      const applicationRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
      const applicationSnap = await getDoc(applicationRef);

      if (applicationSnap.exists()) {
        const applicationData = applicationSnap.data();
        const application = {
          id: applicationSnap.id,
          ...applicationData,
          appliedAt: safeDateConvert(applicationData.appliedAt),
          updatedAt: safeDateConvert(applicationData.updatedAt),
        };

        if (application.candidateId) {
          application.candidate = await this.getCandidateProfile(
            application.candidateId
          );
        }

        if (application.jobId) {
          application.job = await jobService.getJobById(application.jobId);
        }

        return application;
      }
      return null;
    } catch (error) {
      console.error("Error getting application:", error);
      throw error;
    }
  },

  // Get application statistics
  async getApplicationStats() {
    try {
      const applications = await this.getCompanyApplications();

      const stats = {
        total: applications.length,
        new: applications.filter(
          (app) => app.status === "applied" || app.status === "pending"
        ).length,
        reviewed: applications.filter((app) => app.status === "reviewed")
          .length,
        interview: applications.filter((app) => app.status === "interview")
          .length,
        rejected: applications.filter((app) => app.status === "rejected")
          .length,
        hired: applications.filter((app) => app.status === "hired").length,
        withdrawn: applications.filter((app) => app.status === "withdrawn")
          .length,
      };

      return stats;
    } catch (error) {
      console.error("Error getting application stats:", error);
      throw error;
    }
  },
};

// Dashboard Services (UPDATED SECTION ONLY)
// Dashboard Services (UPDATED SECTION)
export const dashboardService = {
  async getDashboardData() {
    try {
      console.log("📊 Fetching dashboard data from Firebase...");

      const [company, jobs, applications, applicationStats, jobStats] =
        await Promise.all([
          companyService.getCompanyProfile().catch(error => {
            console.warn("⚠️ Company profile load failed:", error);
            return {};
          }),
          jobService.getCompanyJobs().catch(error => {
            console.warn("⚠️ Jobs load failed:", error);
            return [];
          }),
          applicationService.getCompanyApplications().catch(error => {
            console.warn("⚠️ Applications load failed:", error);
            return [];
          }),
          applicationService.getApplicationStats().catch(error => {
            console.warn("⚠️ Application stats load failed:", error);
            return {
              total: 0,
              new: 0,
              reviewed: 0,
              interview: 0,
              rejected: 0,
              hired: 0,
              withdrawn: 0,
            };
          }),
          jobService.getJobStats().catch(error => {
            console.warn("⚠️ Job stats load failed:", error);
            return {
              totalJobs: 0,
              activeJobs: 0,
              pausedJobs: 0,
              closedJobs: 0,
              totalApplicants: 0,
              totalViews: 0,
            };
          }),
        ]);

      console.log("✅ Dashboard data loaded:", {
        company: !!company,
        jobs: jobs.length,
        applications: applications.length,
        applicationStats,
        jobStats
      });

      // Ensure all data is properly structured
      const safeApplications = Array.isArray(applications) ? applications : [];
      const safeJobs = Array.isArray(jobs) ? jobs : [];

      const recentApplications = safeApplications.slice(0, 5);
      const recentJobs = safeJobs.slice(0, 3);

      // Calculate top candidates based on match score or recent activity
      const topCandidates = safeApplications
        .filter(app =>
          app.status === "interview" ||
          app.status === "reviewed" ||
          app.matchScore > 70
        )
        .sort((a, b) => {
          // Sort by match score first, then by application date
          if (a.matchScore && b.matchScore) {
            return b.matchScore - a.matchScore;
          }
          const dateA = a.appliedAt ? new Date(a.appliedAt) : new Date(0);
          const dateB = b.appliedAt ? new Date(b.appliedAt) : new Date(0);
          return dateB - dateA;
        })
        .slice(0, 3);

      const pipelineStats = {
        new: applicationStats.new || 0,
        reviewed: applicationStats.reviewed || 0,
        interview: applicationStats.interview || 0,
        hired: applicationStats.hired || 0,
      };

      const stats = {
        totalJobs: jobStats.totalJobs || 0,
        activeJobs: jobStats.activeJobs || 0,
        applications: applicationStats.total || 0,
        profileViews: company?.profileViews || 0,
        totalApplicants: jobStats.totalApplicants || 0,
      };

      return {
        company: company || {},
        stats,
        recentApplications: recentApplications || [],
        jobListings: recentJobs || [],
        pipelineStats,
        topCandidates: topCandidates || [],
        applicationStats,
        jobStats,
      };
    } catch (error) {
      console.error("❌ Error in getDashboardData:", error);
      // Return comprehensive fallback data
      return {
        company: {},
        stats: {
          totalJobs: 0,
          activeJobs: 0,
          applications: 0,
          profileViews: 0,
          totalApplicants: 0,
        },
        recentApplications: [],
        jobListings: [],
        pipelineStats: {
          new: 0,
          reviewed: 0,
          interview: 0,
          hired: 0,
        },
        topCandidates: [],
        applicationStats: {
          total: 0,
          new: 0,
          reviewed: 0,
          interview: 0,
          rejected: 0,
          hired: 0,
          withdrawn: 0,
        },
        jobStats: {
          totalJobs: 0,
          activeJobs: 0,
          pausedJobs: 0,
          closedJobs: 0,
          totalApplicants: 0,
          totalViews: 0,
        },
      };
    }
  },
};

// Utility function to initialize company data
export const initializeCompanyData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const companyRef = doc(db, COMPANY_COLLECTION, user.uid);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
      await companyService.createOrUpdateCompanyProfile({
        name: "",
        industry: "",
        location: "",
        size: "",
        description: "",
        website: "",
        phone: "",
        founded: "",
        socialLinks: {},
        benefits: [],
        techStack: [],
      });
    }
  } catch (error) {
    console.error("Error initializing company data:", error);
  }
};

// Export all services
export default {
  companyService,
  jobService,
  applicationService,
  dashboardService,
  cloudinaryService,
  initializeCompanyData,
};
