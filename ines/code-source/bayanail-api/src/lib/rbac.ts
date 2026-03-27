export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT";

export type Action = "create" | "read" | "update" | "delete" | "manage" | "upload" | "pay";

export type Resource = 
  | "user" 
  | "profile" 
  | "offer" 
  | "pre-registration" 
  | "payment" 
  | "invoice" 
  | "document" 
  | "audit-log" 
  | "notification-log"
  | "lesson"
  | "availability";

interface Permission {
  action: Action[];
  resource: Resource;
  condition?: (user: any, record: any) => boolean;
}

const ROLES_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    { action: ["manage"], resource: "user" },
    { action: ["manage"], resource: "profile" },
    { action: ["manage"], resource: "offer" },
    { action: ["manage"], resource: "pre-registration" },
    { action: ["manage"], resource: "payment" },
    { action: ["manage"], resource: "invoice" },
    { action: ["manage"], resource: "document" },
    { action: ["manage"], resource: "audit-log" },
    { action: ["manage"], resource: "notification-log" },
    { action: ["manage"], resource: "lesson" },
    { action: ["manage"], resource: "availability" },
  ],
  INSTRUCTOR: [
    { 
      action: ["read"], 
      resource: "user",
      condition: (user, student) => student.instructorId === user.id // Exemple de condition
    },
    { action: ["read", "update"], resource: "availability" },
    { action: ["create", "read", "update", "delete"], resource: "lesson" },
    { 
      action: ["read"], 
      resource: "document",
      condition: (user, doc) => doc.student?.instructorId === user.id
    },
    { action: ["create", "read", "update"], resource: "profile" }, // son propre profil + notes élèves
  ],
  STUDENT: [
    { 
      action: ["read", "update"], 
      resource: "profile",
      condition: (user, profile) => profile.userId === user.id
    },
    { action: ["read"], resource: "lesson" },
    { action: ["create"], resource: "pre-registration" },
    { action: ["upload"], resource: "document" },
    { action: ["read"], resource: "payment" },
    { action: ["read"], resource: "invoice" },
  ],
};

export function can(role: Role, action: Action, resource: Resource, context?: { user: any, record: any }): boolean {
  const permissions = ROLES_PERMISSIONS[role];
  if (!permissions) return false;

  return permissions.some(p => {
    const actionMatches = p.action.includes("manage") || p.action.includes(action);
    const resourceMatches = p.resource === resource;
    
    if (actionMatches && resourceMatches) {
      if (p.condition && context) {
        return p.condition(context.user, context.record);
      }
      return true;
    }
    return false;
  });
}

