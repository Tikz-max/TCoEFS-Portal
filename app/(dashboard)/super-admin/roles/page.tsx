"use client";

import React, { useState } from "react";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Info,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { ConfirmationModal } from "@/components/ui/modals/ConfirmationModal";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   GET /api/super-admin/roles
   - Purpose: Fetch all roles with their permissions
   - Response: { roles: Role[] }
   - Auth: Super Admin only
   
   POST /api/super-admin/roles
   - Purpose: Create a new role
   - Body: { name, displayName, description, permissions: string[] }
   - Response: { success: boolean, role: Role }
   - Auth: Super Admin only
   
   PATCH /api/super-admin/roles/:id
   - Purpose: Update role name, description, or permissions
   - Body: { displayName?, description?, permissions?: string[] }
   - Response: { success: boolean, role: Role }
   - Auth: Super Admin only
   
   DELETE /api/super-admin/roles/:id
   - Purpose: Delete a role (only if no users assigned)
   - Response: { success: boolean }
   - Auth: Super Admin only
   - Note: Cannot delete super_admin or system roles
   ============================================================================ */

interface Permission {
  key: string;
  label: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  userCount: number;
  permissions: string[];
  color: string;
  system?: boolean;
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
};

const mockRoles: Role[] = [
  { id: "super_admin", name: "super_admin", displayName: "Super Admin", description: "Full system access with all administrative privileges", userCount: 2, color: "#7C3AED", permissions: ["all"], system: true },
  { id: "training_coordinator", name: "training_coordinator", displayName: "Training Coordinator", description: "Manages training programmes and e-learning courses", userCount: 8, color: "#059669", permissions: ["training:create", "training:edit:own", "training:request_publish", "elearning:create", "elearning:edit:own", "elearning:request_publish", "payments:view:own", "reports:view:own"], system: true },
  { id: "elearning_manager", name: "elearning_manager", displayName: "E-Learning Manager", description: "Manages e-learning content, modules, and assessments", userCount: 4, color: "#0284C7", permissions: ["elearning:create", "elearning:edit:own", "elearning:request_publish", "elearning:grade", "payments:view:own", "reports:view:own"], system: true },
  { id: "admissions_officer", name: "admissions_officer", displayName: "Admissions Officer", description: "Reviews and processes applications", userCount: 6, color: "#DC2626", permissions: ["applications:review", "applications:approve", "applications:reject", "payments:view", "reports:view"], system: true },
  { id: "payment_verifier", name: "payment_verifier", displayName: "Payment Verifier", description: "Verifies and manages payment records", userCount: 3, color: "#D97706", permissions: ["payments:view", "payments:verify", "payments:override"], system: true },
  { id: "training_participant", name: "training_participant", displayName: "Training Participant", description: "Registered participant in training programmes", userCount: 342, color: "#6B7280", permissions: ["training:view:enrolled", "training:register", "documents:upload", "payments:view:own"] },
  { id: "elearning_participant", name: "elearning_participant", displayName: "E-Learning Participant", description: "Student enrolled in e-learning courses", userCount: 892, color: "#7C3AED", permissions: ["elearning:view:enrolled", "elearning:complete", "certificates:view"] },
  { id: "applicant", name: "applicant", displayName: "Applicant", description: "User who has submitted or is preparing an application", userCount: 1234, color: "#8B5CF6", permissions: ["applications:submit", "applications:view:own", "documents:upload", "payments:view:own"] },
];

const allPermissions: Permission[] = [
  { key: "all", label: "All Permissions", description: "Full access to all system features" },
  { key: "training:create", label: "Create Training", description: "Can create new training programmes" },
  { key: "training:edit:own", label: "Edit Own Training", description: "Can edit training programmes they created" },
  { key: "training:edit:all", label: "Edit All Training", description: "Can edit any training programme" },
  { key: "training:request_publish", label: "Request Publish", description: "Can request training to be published" },
  { key: "training:publish", label: "Publish Training", description: "Can directly publish training" },
  { key: "elearning:create", label: "Create Courses", description: "Can create e-learning courses" },
  { key: "elearning:edit:own", label: "Edit Own Courses", description: "Can edit courses they created" },
  { key: "elearning:edit:all", label: "Edit All Courses", description: "Can edit any course" },
  { key: "elearning:request_publish", label: "Request Publish", description: "Can request course to be published" },
  { key: "elearning:publish", label: "Publish Courses", description: "Can directly publish courses" },
  { key: "elearning:grade", label: "Grade Assessments", description: "Can grade assignments and quizzes" },
  { key: "applications:review", label: "Review Applications", description: "Can review submitted applications" },
  { key: "applications:approve", label: "Approve Applications", description: "Can approve applications" },
  { key: "applications:reject", label: "Reject Applications", description: "Can reject applications" },
  { key: "applications:view:own", label: "View Own Applications", description: "Can view their own applications" },
  { key: "payments:view", label: "View All Payments", description: "Can view all payment records" },
  { key: "payments:view:own", label: "View Own Payments", description: "Can only view their own payments" },
  { key: "payments:verify", label: "Verify Payments", description: "Can verify payment records" },
  { key: "payments:override", label: "Override Payments", description: "Can manually override payment status" },
  { key: "reports:view", label: "View All Reports", description: "Can view all reports" },
  { key: "reports:view:own", label: "View Own Reports", description: "Can only view their own reports" },
  { key: "documents:upload", label: "Upload Documents", description: "Can upload documents" },
  { key: "certificates:view", label: "View Certificates", description: "Can view earned certificates" },
];

const roleColors = ["#7C3AED", "#059669", "#0284C7", "#DC2626", "#D97706", "#0891B2", "#7C2D12", "#5B21B6"];

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(mockRoles[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newRoleModalOpen, setNewRoleModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: "", description: "", permissions: [] as string[] });
  const [newRoleForm, setNewRoleForm] = useState({ name: "", displayName: "", description: "", permissions: [] as string[] });

  const filteredRoles = roles.filter(
    (role) =>
      !searchQuery ||
      role.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = () => {
    if (selectedRole) {
      setEditForm({ displayName: selectedRole.displayName, description: selectedRole.description, permissions: [...selectedRole.permissions] });
      setEditModalOpen(true);
    }
  };

  const saveEdit = () => {
    if (selectedRole) {
      setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, displayName: editForm.displayName, description: editForm.description, permissions: editForm.permissions } : r));
      setSelectedRole({ ...selectedRole, displayName: editForm.displayName, description: editForm.description, permissions: editForm.permissions });
      setEditModalOpen(false);
    }
  };

  const togglePermission = (perm: string, isNew: boolean) => {
    if (isNew) {
      setNewRoleForm(prev => ({ ...prev, permissions: prev.permissions.includes(perm) ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm] }));
    } else {
      setEditForm(prev => ({ ...prev, permissions: prev.permissions.includes(perm) ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm] }));
    }
  };

  const handleDeleteRole = () => {
    if (selectedRole && selectedRole.userCount === 0) {
      const newRoles = roles.filter(r => r.id !== selectedRole.id);
      setRoles(newRoles);
      setSelectedRole(newRoles[0] || null);
    }
    setDeleteModalOpen(false);
  };

  const handleCreateRole = () => {
    if (!newRoleForm.name || !newRoleForm.displayName) return;
    const newRole: Role = {
      id: `role_${Date.now()}`,
      name: newRoleForm.name.toLowerCase().replace(/\s+/g, "_"),
      displayName: newRoleForm.displayName,
      description: newRoleForm.description,
      userCount: 0,
      permissions: newRoleForm.permissions,
      color: roleColors[roles.length % roleColors.length],
    };
    setRoles([...roles, newRole]);
    setSelectedRole(newRole);
    setNewRoleModalOpen(false);
    setNewRoleForm({ name: "", displayName: "", description: "", permissions: [] });
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: C.canvas }}>
      <Sidebar user={{ name: "Super Admin", initials: "SA", role: "super_admin", roleLabel: "Super Admin" }} activeItem="roles" badges={{}} />

      <main style={{ flex: 1, padding: "32px 40px" }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: "-0.6px", marginBottom: 4 }}>Role Management</h1>
            <p style={{ fontSize: 14, color: C.textSec }}>Create, edit, and manage system roles and permissions</p>
          </div>
          <button onClick={() => setNewRoleModalOpen(true)} style={{ height: 40, padding: "0 16px", borderRadius: 6, border: "none", background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: shadow.elev1 }}>
            <Plus size={14} />Add Role
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 }}>
          {/* Role List */}
          <div style={{ background: C.white, borderRadius: 8, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderSubtle}`, background: C.canvas }}>
              <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search roles..." style={{ width: "100%", height: 36, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, background: C.white, fontSize: 13, color: C.text, outline: "none" }} />
            </div>
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {filteredRoles.map((role) => (
                <div key={role.id} onClick={() => setSelectedRole(role)} style={{ padding: "14px 16px", borderBottom: `1px solid ${C.borderSubtle}`, cursor: "pointer", background: selectedRole?.id === role.id ? C.whisper : "transparent", transition: "background 100ms ease" }} onMouseEnter={(e) => { if (selectedRole?.id !== role.id) e.currentTarget.style.background = C.canvas; }} onMouseLeave={(e) => { if (selectedRole?.id !== role.id) e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: role.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{role.displayName}{role.system && <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 6 }}>(System)</span>}</div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{role.userCount} users</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Details */}
          {selectedRole && (
            <div style={{ background: C.white, borderRadius: 8, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: `${selectedRole.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={24} color={selectedRole.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>{selectedRole.displayName}{selectedRole.system && <span style={{ fontSize: 12, fontWeight: 400, color: C.textMuted, marginLeft: 8 }}>({selectedRole.name})</span>}</h2>
                  <p style={{ fontSize: 13, color: C.textSec, margin: 0 }}>{selectedRole.description}</p>
                  <div style={{ marginTop: 12, display: "flex", gap: 16 }}>
                    <div><div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{selectedRole.userCount.toLocaleString()}</div><div style={{ fontSize: 11, color: C.textMuted }}>Users</div></div>
                    <div><div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{selectedRole.permissions.length}</div><div style={{ fontSize: 11, color: C.textMuted }}>Permissions</div></div>
                  </div>
                </div>
                {!selectedRole.system && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={startEditing} style={{ height: 36, padding: "0 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Edit size={14} />Edit</button>
                    <button onClick={() => setDeleteModalOpen(true)} disabled={selectedRole.userCount > 0} style={{ height: 36, padding: "0 12px", borderRadius: 6, border: "none", background: selectedRole.userCount > 0 ? C.canvas : C.dangerBg, color: selectedRole.userCount > 0 ? C.textMuted : C.dangerText, fontSize: 13, fontWeight: 600, cursor: selectedRole.userCount > 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: selectedRole.userCount > 0 ? 0.5 : 1 }}><Trash2 size={14} />Delete</button>
                  </div>
                )}
              </div>

              <div style={{ padding: "20px 24px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Permissions</h3>
                {selectedRole.permissions[0] === "all" ? (
                  <div style={{ padding: "16px", background: C.successBg, borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle size={20} color={C.successText} />
                    <div><div style={{ fontSize: 14, fontWeight: 600, color: C.successText }}>Full System Access</div><div style={{ fontSize: 12, color: C.successText }}>This role has access to all system features and settings</div></div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                    {selectedRole.permissions.map((perm) => (
                      <div key={perm} style={{ padding: "10px 12px", background: C.canvas, borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle size={14} color={C.successText} />
                        <span style={{ fontSize: 13, color: C.text }}>{allPermissions.find(p => p.key === perm)?.label || perm}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Permission Reference */}
        <div style={{ marginTop: 24, background: C.white, borderRadius: 8, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 10 }}>
            <Info size={18} color={C.infoText} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>Permission Reference</h3>
          </div>
          <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {allPermissions.slice(1).map((perm) => (<div key={perm.key}><div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{perm.label}</div><div style={{ fontSize: 12, color: C.textMuted }}>{perm.description}</div></div>))}
          </div>
        </div>
      </main>

      {/* Edit Role Modal */}
      <ConfirmationModal open={editModalOpen} title="Edit Role" message={
        <div style={{ textAlign: "left" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Display Name</label>
            <input type="text" value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} style={{ width: "100%", height: 40, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, color: C.text, outline: "none" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Description</label>
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, color: C.text, outline: "none", resize: "vertical" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Permissions</label>
            <div style={{ maxHeight: 200, overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {allPermissions.slice(1).map((perm) => (
                <label key={perm.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: C.canvas, borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={editForm.permissions.includes(perm.key)} onChange={() => togglePermission(perm.key, false)} style={{ cursor: "pointer" }} />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      } iconType="info" confirmLabel="Save Changes" onConfirm={saveEdit} onCancel={() => setEditModalOpen(false)} />

      {/* Delete Confirmation */}
      <ConfirmationModal open={deleteModalOpen} title="Delete Role" message={selectedRole?.userCount === 0 ? `Delete the role "${selectedRole?.displayName}"? This cannot be undone.` : `Cannot delete "${selectedRole?.displayName}" - it has ${selectedRole?.userCount} users assigned. Reassign users first.`} iconType="danger" confirmLabel="Delete" destructive onConfirm={handleDeleteRole} onCancel={() => setDeleteModalOpen(false)} />

      {/* New Role Modal */}
      <ConfirmationModal open={newRoleModalOpen} title="Create New Role" message={
        <div style={{ textAlign: "left" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Name (internal, no spaces)</label>
            <input type="text" value={newRoleForm.name} onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })} placeholder="e.g. content_manager" style={{ width: "100%", height: 40, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, color: C.text, outline: "none" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Display Name</label>
            <input type="text" value={newRoleForm.displayName} onChange={(e) => setNewRoleForm({ ...newRoleForm, displayName: e.target.value })} placeholder="e.g. Content Manager" style={{ width: "100%", height: 40, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, color: C.text, outline: "none" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Description</label>
            <textarea value={newRoleForm.description} onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })} rows={2} placeholder="Brief description of this role..." style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, color: C.text, outline: "none", resize: "vertical" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Permissions</label>
            <div style={{ maxHeight: 200, overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {allPermissions.slice(1).map((perm) => (
                <label key={perm.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: C.canvas, borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={newRoleForm.permissions.includes(perm.key)} onChange={() => togglePermission(perm.key, true)} style={{ cursor: "pointer" }} />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      } iconType="info" confirmLabel="Create Role" onConfirm={handleCreateRole} onCancel={() => { setNewRoleModalOpen(false); setNewRoleForm({ name: "", displayName: "", description: "", permissions: [] }); }} />
    </div>
  );
}
