// API Base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Test server connection
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return {
      success: response.ok,
      message: data.status || "Server is connected",
      url: API_BASE_URL,
    };
  } catch (error) {
    return {
      success: false,
      message: "Cannot connect to server: " + error.message,
      url: API_BASE_URL,
    };
  }
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: "Network error: " + error.message,
      };
    }
  },

  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: "Network error: " + error.message,
      };
    }
  },

  getProfile: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: "Network error: " + error.message,
      };
    }
  },

  getUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: "Network error: " + error.message,
      };
    }
  },
};

// Institutions API
export const institutionsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/institutions`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: "Network error: " + error.message,
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/institutions/${id}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: "Network error: " + error.message,
      };
    }
  },
};

// Courses API
export const coursesAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: "Network error: " + error.message,
      };
    }
  },

  getByInstitution: async (institutionId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/courses/institution/${institutionId}`
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: "Network error: " + error.message,
      };
    }
  },
};

// Companies API
export const companiesAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: "Network error: " + error.message,
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies/${id}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: "Network error: " + error.message,
      };
    }
  },
};

export default {
  testConnection,
  authAPI,
  institutionsAPI,
  coursesAPI,
  companiesAPI,
};
