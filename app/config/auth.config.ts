// app/config/auth.config.ts
// Configuration for authentication routes and behavior
// Centralized configuration to avoid hardcoded values

export interface AuthConfig {
  publicRoutes: string[]
  redirectAfterLogin: string
  redirectAfterLogout: string
  adminRedirect: string
  staffAllowedPaths: string[]
  userAllowedPaths: string[]
}

export const authConfig: AuthConfig = {
  // Routes that don't require authentication
  publicRoutes: ['/', 
    '/login', 
    '/about', 
    '/contact', 
    '/sketches', 
    '/sketches/editorial-list', 
    '/sketches/entity-row-actions',
    '/sketches/editorial-indicator',
    '/sketches/create-flow',
    '/sketches/delete-preview',
    '/sketches/dashboard-v2',
    '/sketches/studio-card-editor',
    '/sketches/editorial-board',
    '/sketches/image-system',
    '/sketches/feedback-workflow',
    '/sketches/card-views',
    '/sketches/entity-map'
    ],
  
  // Redirect destinations
  redirectAfterLogin: '/user',
  redirectAfterLogout: '/login',
  adminRedirect: '/manage',
  
  // Role-based path allowances
  staffAllowedPaths: ['/manage', '/user'],
  userAllowedPaths: ['/user'],
}

export function isPublicRoute(path: string): boolean {
  return authConfig.publicRoutes.includes(path)
}

export function canAccessPath(path: string, isAdmin: boolean, isStaff: boolean, isUser: boolean): boolean {
  if (isAdmin) return true
  if (isStaff) return authConfig.staffAllowedPaths.some(p => path.startsWith(p))
  if (isUser) return authConfig.userAllowedPaths.some(p => path.startsWith(p))
  return false
}
