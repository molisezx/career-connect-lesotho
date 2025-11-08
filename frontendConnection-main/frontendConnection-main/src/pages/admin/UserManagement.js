import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./UserManagement.css";

const UserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "candidate",
    company: "",
    phone: "",
  });

  // Sample user data
  const sampleUsers = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@techcorp.com",
      role: "employer",
      status: "active",
      joinDate: "2024-01-15",
      lastActive: "2 hours ago",
      company: "TechCorp Inc.",
      phone: "+1-555-0123",
      avatar: "SJ",
      emailVerified: true,
      profileCompletion: 95,
      subscription: "premium",
    },
    {
      id: 2,
      name: "Mike Chen",
      email: "mike@cloudsolutions.com",
      role: "employer",
      status: "active",
      joinDate: "2024-01-10",
      lastActive: "1 hour ago",
      company: "CloudSolutions Ltd.",
      phone: "+1-555-0124",
      avatar: "MC",
      emailVerified: true,
      profileCompletion: 88,
      subscription: "premium",
    },
    {
      id: 3,
      name: "Emma Davis",
      email: "emma.davis@email.com",
      role: "candidate",
      status: "active",
      joinDate: "2024-01-20",
      lastActive: "30 minutes ago",
      phone: "+1-555-0125",
      avatar: "ED",
      emailVerified: true,
      profileCompletion: 85,
      skills: ["React", "Node.js", "TypeScript"],
    },
    {
      id: 4,
      name: "James Wilson",
      email: "james@innovatetech.com",
      role: "employer",
      status: "pending",
      joinDate: "2024-01-25",
      lastActive: "Just now",
      company: "InnovateTech LLC",
      phone: "+1-555-0126",
      avatar: "JW",
      emailVerified: false,
      profileCompletion: 45,
      subscription: "basic",
    },
    {
      id: 5,
      name: "Lisa Brown",
      email: "lisa@designstudio.com",
      role: "employer",
      status: "suspended",
      joinDate: "2024-01-08",
      lastActive: "3 days ago",
      company: "Design Studio Co.",
      phone: "+1-555-0127",
      avatar: "LB",
      emailVerified: true,
      profileCompletion: 92,
      subscription: "premium",
    },
    {
      id: 6,
      name: "David Kim",
      email: "david.kim@email.com",
      role: "candidate",
      status: "active",
      joinDate: "2024-01-18",
      lastActive: "5 hours ago",
      phone: "+1-555-0128",
      avatar: "DK",
      emailVerified: true,
      profileCompletion: 78,
      skills: ["Python", "Data Analysis", "Machine Learning"],
    },
  ];

  const loadUsers = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUsers(sampleUsers);
      setFilteredUsers(sampleUsers);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.company &&
            user.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, users]);

  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = (e) => {
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    if (e.target.checked) {
      setSelectedUsers(currentUsers.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const updateUserStatus = (userId, newStatus) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
  };

  const updateUserRole = (userId, newRole) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  const deleteUsers = (userIds) => {
    setUsers(users.filter((user) => !userIds.includes(user.id)));
    setSelectedUsers([]);
  };

  const handleAddUser = () => {
    const user = {
      id: users.length + 1,
      ...newUser,
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
      lastActive: "Just now",
      avatar: newUser.name
        .split(" ")
        .map((n) => n[0])
        .join(""),
      emailVerified: false,
      profileCompletion: 0,
    };
    setUsers([...users, user]);
    setShowAddUserModal(false);
    setNewUser({
      name: "",
      email: "",
      role: "candidate",
      company: "",
      phone: "",
    });
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const UserRow = ({ user, isSelected }) => (
    <tr className={isSelected ? "selected" : ""}>
      <td>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleUserSelect(user.id)}
        />
      </td>
      <td>
        <div className="user-cell">
          <div className="user-avatar-small">{user.avatar}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
      </td>
      <td>
        <select
          value={user.role}
          onChange={(e) => updateUserRole(user.id, e.target.value)}
          className={`role-select ${user.role}`}
        >
          <option value="candidate">Candidate</option>
          <option value="employer">Employer</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td>{user.company || "-"}</td>
      <td>
        <select
          value={user.status}
          onChange={(e) => updateUserStatus(user.id, e.target.value)}
          className={`status-select ${user.status}`}
        >
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </td>
      <td>{user.joinDate}</td>
      <td>{user.lastActive}</td>
      <td>
        <div className="profile-completion">
          <div className="completion-bar">
            <div
              className="completion-fill"
              style={{ width: `${user.profileCompletion}%` }}
            ></div>
          </div>
          <span>{user.profileCompletion}%</span>
        </div>
      </td>
      <td>
        <div className="user-actions">
          <button
            className="btn-action view"
            onClick={() => navigate(`/dashboard/admin/users/${user.id}`)}
          >
            View
          </button>
          <button
            className="btn-action edit"
            onClick={() => setEditingUser(user)}
          >
            Edit
          </button>
          <button
            className="btn-action delete"
            onClick={() => deleteUsers([user.id])}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="user-management loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>User Management</h1>
          <p>Manage all users, permissions, and access levels</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowAddUserModal(true)}
        >
          + Add New User
        </button>
      </div>

      {/* Stats Overview */}
      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{users.length}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{users.filter((u) => u.role === "employer").length}</h3>
            <p>Employers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{users.filter((u) => u.role === "candidate").length}</h3>
            <p>Candidates</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{users.filter((u) => u.status === "active").length}</h3>
            <p>Active Users</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-controls">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="candidate">Candidates</option>
            <option value="employer">Employers</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>

          {selectedUsers.length > 0 && (
            <div className="bulk-actions">
              <button
                className="btn-secondary"
                onClick={() =>
                  selectedUsers.forEach((id) => updateUserStatus(id, "active"))
                }
              >
                Activate
              </button>
              <button
                className="btn-secondary"
                onClick={() =>
                  selectedUsers.forEach((id) =>
                    updateUserStatus(id, "suspended")
                  )
                }
              >
                Suspend
              </button>
              <button
                className="btn-danger"
                onClick={() => deleteUsers(selectedUsers)}
              >
                Delete ({selectedUsers.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    selectedUsers.length === currentUsers.length &&
                    currentUsers.length > 0
                  }
                />
              </th>
              <th>User</th>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Last Active</th>
              <th>Profile Completion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelected={selectedUsers.includes(user.id)}
              />
            ))}
          </tbody>
        </table>

        {currentUsers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No users found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={currentPage === page ? "active" : ""}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button onClick={() => setShowAddUserModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="candidate">Candidate</option>
                  <option value="employer">Employer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {newUser.role === "employer" && (
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={newUser.company}
                    onChange={(e) =>
                      setNewUser({ ...newUser, company: e.target.value })
                    }
                    placeholder="Enter company name"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAddUserModal(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddUser}>
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
