export type RouteCommands = readonly (string | number)[];

const ROOT = 'admin' as const;
const USERS = 'users' as const;
const ROLES = 'roles' as const;
const SETTINGS = 'settings' as const;
const MODERATION = 'moderation' as const;
const JOBS = 'empleos' as const;
const NEW = 'new' as const;
const EDIT = 'edit' as const;

export const ADMIN_ROUTES = {
  ROOT: {
    PATH: ROOT,
    FULL_PATH: `/${ROOT}` as const,
    COMMANDS: ['/', ROOT] as RouteCommands,
  },
  USERS: {
    PATH: USERS,
    LIST: {
      PATH: '' as const,
      FULL_PATH: `/${ROOT}/${USERS}` as const,
      COMMANDS: ['/', ROOT, USERS] as RouteCommands,
    },
    CREATE: {
      PATH: NEW,
      FULL_PATH: `/${ROOT}/${USERS}/${NEW}` as const,
      COMMANDS: ['/', ROOT, USERS, NEW] as RouteCommands,
    },
    EDIT: {
      PATH: ':id/edit' as const,
      fullPath: (id: string | number) => `/${ROOT}/${USERS}/${id}/${EDIT}`,
      commands: (id: string | number): RouteCommands => ['/', ROOT, USERS, id, EDIT],
    },
  },
  ROLES: {
    PATH: ROLES,
    LIST: {
      PATH: '' as const,
      FULL_PATH: `/${ROOT}/${ROLES}` as const,
      COMMANDS: ['/', ROOT, ROLES] as RouteCommands,
    },
    CREATE: {
      PATH: NEW,
      FULL_PATH: `/${ROOT}/${ROLES}/${NEW}` as const,
      COMMANDS: ['/', ROOT, ROLES, NEW] as RouteCommands,
    },
    EDIT: {
      PATH: ':id/edit' as const,
      fullPath: (id: string | number) => `/${ROOT}/${ROLES}/${id}/${EDIT}`,
      commands: (id: string | number): RouteCommands => ['/', ROOT, ROLES, id, EDIT],
    },
  },
  SETTINGS: {
    PATH: SETTINGS,
    FULL_PATH: `/${ROOT}/${SETTINGS}` as const,
    COMMANDS: ['/', ROOT, SETTINGS] as RouteCommands,
  },
  MODERATION: {
    PATH: MODERATION,
    FULL_PATH: `/${ROOT}/${MODERATION}` as const,
    COMMANDS: ['/', ROOT, MODERATION] as RouteCommands,
  },
  JOBS: {
    PATH: JOBS,
    LIST: {
      PATH: '' as const,
      FULL_PATH: `/${ROOT}/${JOBS}` as const,
      COMMANDS: ['/', ROOT, JOBS] as RouteCommands,
    },
    CREATE: {
      PATH: NEW,
      FULL_PATH: `/${ROOT}/${JOBS}/${NEW}` as const,
      COMMANDS: ['/', ROOT, JOBS, NEW] as RouteCommands,
    },
    EDIT: {
      PATH: ':id/edit' as const,
      fullPath: (id: string | number) => `/${ROOT}/${JOBS}/${id}/${EDIT}`,
      commands: (id: string | number): RouteCommands => ['/', ROOT, JOBS, id, EDIT],
    },
  },
} as const;
