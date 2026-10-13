import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserAccount, UserRole } from '@/types/crm';

export const MASTER_ADMIN_EMAIL = 'tauhidadslab@gmail.com';
export const MASTER_ADMIN_PASSWORD = 'Sakib@tauhid7464';

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin-1',
    name: 'Tauhid (Super Admin)',
    email: MASTER_ADMIN_EMAIL,
    passwordHash: MASTER_ADMIN_PASSWORD,
    role: 'admin',
    isActive: true,
    createdAt: '2026-01-01',
    lastLogin: undefined,
  },
  {
    id: 'user-hunter-2',
    name: 'Sales Hunter Team',
    email: 'hunter@nexus.io',
    passwordHash: 'Hunt@2026',
    role: 'hunter',
    isActive: true,
    createdAt: '2026-01-15',
    lastLogin: undefined,
  },
];

interface AuthState {
  currentUser: UserAccount | null;
  users: UserAccount[];

  // Authentication
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;

  // Admin User Management
  addUser: (input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => { success: boolean; error?: string };
  updateUser: (id: string, updates: Partial<Omit<UserAccount, 'id' | 'createdAt'>>) => void;
  deleteUser: (id: string) => { success: boolean; error?: string };
  toggleUserStatus: (id: string) => void;
  resetAdminPassword: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: INITIAL_USERS,

      login: (emailInput, passwordInput) => {
        const cleanEmail = emailInput.trim().toLowerCase();
        const cleanPassword = passwordInput.trim();

        // Ensure Master Admin always exists and has the correct designated password
        let currentUsers = get().users;
        const adminExists = currentUsers.some((u) => u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase());
        if (!adminExists) {
          currentUsers = [INITIAL_USERS[0], ...currentUsers];
          set({ users: currentUsers });
        }

        const user = currentUsers.find(
          (u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === cleanPassword
        );

        if (!user) {
          return {
            success: false,
            error: 'Invalid email or password. Please check your credentials.',
          };
        }

        if (!user.isActive) {
          return {
            success: false,
            error: 'This account has been deactivated by the Admin.',
          };
        }

        const now = new Date().toISOString();
        const updatedUser = { ...user, lastLogin: now };
        const updatedUsers = currentUsers.map((u) => (u.id === user.id ? updatedUser : u));

        set({
          currentUser: updatedUser,
          users: updatedUsers,
        });

        return { success: true };
      },

      logout: () => {
        set({ currentUser: null });
      },

      addUser: ({ name, email, password, role }) => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();

        if (!cleanEmail || !cleanPassword || !name.trim()) {
          return { success: false, error: 'Name, email, and password are required.' };
        }

        const existing = get().users.find((u) => u.email.toLowerCase() === cleanEmail);
        if (existing) {
          return { success: false, error: 'A member with this email already exists.' };
        }

        const newUser: UserAccount = {
          id: `user-${Date.now()}`,
          name: name.trim(),
          email: cleanEmail,
          passwordHash: cleanPassword,
          role,
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0],
        };

        set((state) => ({
          users: [...state.users, newUser],
        }));

        return { success: true };
      },

      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
          currentUser:
            state.currentUser?.id === id
              ? { ...state.currentUser, ...updates }
              : state.currentUser,
        }));
      },

      deleteUser: (id) => {
        const user = get().users.find((u) => u.id === id);
        if (user && user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
          return { success: false, error: 'Master Admin account cannot be deleted.' };
        }

        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
          currentUser: state.currentUser?.id === id ? null : state.currentUser,
        }));

        return { success: true };
      },

      toggleUserStatus: (id) => {
        const user = get().users.find((u) => u.id === id);
        if (user && user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
          return; // Cannot deactivate Master Admin
        }

        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, isActive: !u.isActive } : u
          ),
          currentUser:
            state.currentUser?.id === id && state.currentUser.isActive
              ? null // Log out if deactivated
              : state.currentUser,
        }));
      },

      resetAdminPassword: () => {
        set((state) => ({
          users: state.users.map((u) =>
            u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
              ? { ...u, passwordHash: MASTER_ADMIN_PASSWORD, isActive: true }
              : u
          ),
        }));
      },
    }),
    {
      name: 'nexus_crm_auth_store',
      version: 2,
    }
  )
);
