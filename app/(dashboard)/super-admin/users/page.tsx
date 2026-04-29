"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { ConfirmationModal } from "@/components/ui/modals/ConfirmationModal";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   GET /api/super-admin/users
   - Purpose: Fetch all users with filtering and pagination
   - Query params: role, status, search, page, limit
   - Response: { users: User[], total: number, page: number, pages: number }
   - Auth: Super Admin only
   
   POST /api/super-admin/users
   - Purpose: Create new user
   - Body: { name, email, role }
   - Response: { success: boolean, user: User }
   - Auth: Super Admin only
   - Note: Creates user in database, no email sent
   
   PATCH /api/super-admin/users/:id
   - Purpose: Update user role or status
   - Body: { role?, status? }
   - Response: { success: boolean, user: User }
   - Auth: Super Admin only
   
   DELETE /api/super-admin/users/:id
   - Purpose: Hard delete user
   - Response: { success: boolean }
   - Auth: Super Admin only
   - Note: Permanent deletion, cannot be undone
   ============================================================================ */

type UserRole = "applicant" | "training_coordinator" | "elearning_manager" | "payment_verifier" | "admissions_officer" | "super_admin";
type UserStatus = "active" | "inactive";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActive?: string;
  createdAt: string;
}

const C = {
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  whisper: "#E8F5E8",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
  warningBg: "#FEF3C7",
  warningText: "#92400E",
  infoBg: "#DBEAFE",
  infoText: "#1E40AF",
  successBg: "#DCFCE7",
  successText: "#166534",
  dangerBg: "#FEE2E2",
  dangerText: "#991B1B",
};

const shadow = {
  sm: "0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev1: "inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev2: "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12), 0 8px 16px rgba(45,90,45,0.08)",
  drawer: "inset 0 4px 0 rgba(255,255,255,0.85), 0 20px 40px rgba(45,90,45,0.2), 0 40px 60px rgba(45,90,45,0.1)",
};

/* ============================================================================
   MOCK DATA (Replace with API calls)
   ============================================================================ */
const mockUsers: User[] = [
  { id: "1", name: "Aisha Mohammed", email: "aisha.m@email.com", role: "applicant", status: "active", lastActive: "2 min ago", createdAt: "15 Mar 2026" },
  { id: "2", name: "Babatunde Adeyemi", email: "baba.t@email.com", role: "applicant", status: "active", lastActive: "1 hour ago", createdAt: "14 Mar 2026" },
  { id: "3", name: "Chidi Okonkwo", email: "chidi.o@email.com", role: "training_coordinator", status: "active", lastActive: "5 min ago", createdAt: "01 Jan 2026" },
  { id: "4", name: "Grace Nwosu", email: "grace.n@email.com", role: "training_coordinator", status: "active", lastActive: "2 hours ago", createdAt: "01 Jan 2026" },
  { id: "5", name: "Emeka Eze", email: "emeka.e@email.com", role: "elearning_manager", status: "active", lastActive: "1 day ago", createdAt: "01 Feb 2026" },
  { id: "6", name: "Fatima Ibrahim", email: "fatima.i@email.com", role: "elearning_manager", status: "active", lastActive: "30 min ago", createdAt: "01 Feb 2026" },
  { id: "7", name: "Ibrahim Yusuf", email: "ibrahim.y@email.com", role: "admissions_officer", status: "active", lastActive: "10 min ago", createdAt: "01 Jan 2026" },
  { id: "8", name: "Joy Adaeze", email: "joy.a@email.com", role: "admissions_officer", status: "inactive", lastActive: "2 weeks ago", createdAt: "01 Jan 2026" },
  { id: "9", name: "Kemi Olatunji", email: "kemi.o@email.com", role: "payment_verifier", status: "active", lastActive: "1 hour ago", createdAt: "01 Mar 2026" },
  { id: "10", name: "Ladi Yusuf", email: "ladi.y@email.com", role: "payment_verifier", status: "active", lastActive: "3 hours ago", createdAt: "01 Mar 2026" },
  { id: "11", name: "Admin User", email: "admin@tcoefs.org", role: "super_admin", status: "active", lastActive: "Just now", createdAt: "01 Jan 2025" },
  { id: "12", name: "Dr. Ngozi Obi", email: "ngozi.o@email.com", role: "training_coordinator", status: "active", lastActive: "5 hours ago", createdAt: "15 Feb 2026" },
];

const roles: { value: UserRole; label: string }[] = [
  { value: "applicant", label: "Applicant" },
  { value: "training_coordinator", label: "Training Coordinator" },
  { value: "elearning_manager", label: "E-Learning Manager" },
  { value: "admissions_officer", label: "Admissions Officer" },
  { value: "payment_verifier", label: "Payment Verifier" },
  { value: "super_admin", label: "Super Admin" },
];

const tabs = [
  { key: "all", label: "All Users" },
  { key: "applicant", label: "Applicants" },
  { key: "training_coordinator", label: "Coordinators" },
  { key: "elearning_manager", label: "E-Learning" },
  { key: "admissions_officer", label: "Admissions" },
  { key: "payment_verifier", label: "Payments" },
  { key: "super_admin", label: "Admins" },
];

const getRoleBadge = (role: UserRole) => {
  const colors: Record<UserRole, { bg: string; color: string }> = {
    applicant: { bg: C.canvas, color: C.textSec },
    training_coordinator: { bg: C.successBg, color: C.successText },
    elearning_manager: { bg: C.infoBg, color: C.infoText },
    admissions_officer: { bg: C.whisper, color: C.primary },
    payment_verifier: { bg: C.warningBg, color: C.warningText },
    super_admin: { bg: "#EDE9FE", color: "#5B21B6" },
  };
  const labels: Record<UserRole, string> = {
    applicant: "Applicant",
    training_coordinator: "Coordinator",
    elearning_manager: "E-Learning",
    admissions_officer: "Admissions",
    payment_verifier: "Payments",
    super_admin: "Admin",
  };
  const style = colors[role];
  return (
    <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, background: style.bg, color: style.color, fontSize: 11, fontWeight: 600 }}>
      {labels[role]}
    </span>
  );
};

/* ============================================================================
   USER MANAGEMENT PAGE
   ============================================================================ */
export default function UserManagementPage() {
  const [users, setUsers] = useState(mockUsers);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "applicant" as UserRole });
  const [editRole, setEditRole] = useState<UserRole>("applicant");

  const filteredUsers = users.filter((user) => {
    const matchesTab = activeTab === "all" || user.role === activeTab;
    const matchesSearch =
      !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getCounts = (role: string) => {
    if (role === "all") return users.length;
    return users.filter((u) => u.role === role).length;
  };

  const handleAddUser = () => {
    const user: User = {
      id: String(users.length + 1),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "active",
      createdAt: new Date().toLocaleDateString("en-GB"),
    };
    setUsers([user, ...users]);
    setAddModalOpen(false);
    setNewUser({ name: "", email: "", role: "applicant" });
  };

  const handleEditUser = () => {
    if (selectedUser) {
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, role: editRole } : u)));
    }
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      setUsers(users.filter((u) => u.id !== selectedUser.id));
    }
    setDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: C.canvas }}>
      <Sidebar
        user={{ name: "Super Admin", initials: "SA", role: "super_admin", roleLabel: "Super Admin" }}
        activeItem="users"
        badges={{}}
      />

      <main style={{ flex: 1, padding: "32px 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: "-0.6px", marginBottom: 4 }}>
              User Management
            </h1>
            <p style={{ fontSize: 14, color: C.textSec }}>Manage all portal users and roles</p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 6,
              border: "none",
              background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`,
              color: C.white,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: shadow.elev1,
            }}
          >
            <Plus size={14} />
            Add User
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.borderSubtle}` }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
              style={{
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                color: activeTab === tab.key ? C.primary : C.textSec,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                borderBottom: activeTab === tab.key ? `2px solid ${C.primary}` : "2px solid transparent",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {tab.label}
              <span style={{
                padding: "2px 8px",
                borderRadius: 10,
                background: activeTab === tab.key ? C.whisper : C.canvas,
                color: activeTab === tab.key ? C.primary : C.textMuted,
                fontSize: 12,
              }}>
                {getCounts(tab.key)}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: "relative", maxWidth: 400 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              style={{
                height: 40,
                paddingLeft: 36,
                paddingRight: 12,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                background: C.white,
                fontSize: 13,
                color: C.text,
                outline: "none",
                width: "100%",
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: C.white, borderRadius: 8, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.canvas }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>User</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>Role</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>Status</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>Last Active</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted, width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice((currentPage - 1) * 10, currentPage * 10).map((user) => (
                  <tr key={user.id} style={{ borderTop: `1px solid ${C.borderSubtle}` }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.canvas, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: C.textSec }}>
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{user.name}</div>
                          <div style={{ fontSize: 12, color: C.textMuted }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{getRoleBadge(user.role)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: user.status === "active" ? C.successBg : C.canvas, color: user.status === "active" ? C.successText : C.textMuted, fontSize: 11, fontWeight: 600 }}>
                        {user.status === "active" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.successText }} />}
                        {user.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.textSec }}>{user.lastActive || "Never"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button onClick={() => openEditModal(user)} style={{ height: 32, padding: "0 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Edit size={12} /> Edit
                        </button>
                        <button onClick={() => openDeleteModal(user)} style={{ height: 32, padding: "0 10px", borderRadius: 6, border: "none", background: C.dangerBg, color: C.dangerText, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div style={{ padding: 48, textAlign: "center" }}>
              <User size={48} color={C.textMuted} style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 14, color: C.textSec, margin: 0 }}>No users found</p>
            </div>
          )}

          {/* Pagination */}
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>
              Showing {Math.min((currentPage - 1) * 10 + 1, filteredUsers.length)}-{Math.min(currentPage * 10, filteredUsers.length)} of {filteredUsers.length}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{ height: 32, width: 32, borderRadius: 4, border: `1px solid ${C.border}`, background: C.white, color: currentPage === 1 ? C.textMuted : C.textSec, cursor: currentPage === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentPage === 1 ? 0.5 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, padding: "0 12px", display: "flex", alignItems: "center" }}>
                Page {currentPage} of {Math.max(1, Math.ceil(filteredUsers.length / 10))}
              </span>
              <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= Math.ceil(filteredUsers.length / 10)} style={{ height: 32, width: 32, borderRadius: 4, border: `1px solid ${C.border}`, background: C.white, color: currentPage >= Math.ceil(filteredUsers.length / 10) ? C.textMuted : C.textSec, cursor: currentPage >= Math.ceil(filteredUsers.length / 10) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentPage >= Math.ceil(filteredUsers.length / 10) ? 0.5 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      <ConfirmationModal
        open={addModalOpen}
        title="Add New User"
        message={
          <div style={{ textAlign: "left" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Full Name</label>
              <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} style={{ width: "100%", height: 40, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, color: C.text, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Email Address</label>
              <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} style={{ width: "100%", height: 40, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, color: C.text, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Role</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })} style={{ width: "100%", height: 40, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, color: C.text, outline: "none", cursor: "pointer" }}>
                {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        }
        iconType="info"
        confirmLabel="Add User"
        cancelLabel="Cancel"
        onConfirm={handleAddUser}
        onCancel={() => { setAddModalOpen(false); setNewUser({ name: "", email: "", role: "applicant" }); }}
      />

      {/* Edit Role Modal */}
      <ConfirmationModal
        open={editModalOpen}
        title="Change User Role"
        message={
          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: 13, color: C.textSec, marginBottom: 16 }}>
              Change role for <strong>{selectedUser?.name}</strong>
            </p>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Role</label>
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} style={{ width: "100%", height: 40, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, color: C.text, outline: "none", cursor: "pointer" }}>
                {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        }
        iconType="info"
        confirmLabel="Update Role"
        cancelLabel="Cancel"
        onConfirm={handleEditUser}
        onCancel={() => { setEditModalOpen(false); setSelectedUser(null); }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${selectedUser?.name}? This action cannot be undone.`}
        iconType="danger"
        confirmLabel="Delete User"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDeleteUser}
        onCancel={() => { setDeleteModalOpen(false); setSelectedUser(null); }}
      />
    </div>
  );
}
