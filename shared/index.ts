// shared/index.ts - Client-safe exports
// Export user schemas
export {
  userStatusEnum,
  userQuerySchema,
  userCreateSchema,
  userUpdateSchema,
  userLoginSchema,
  userRegisterSchema,
  type UserStatus,
  type UserQuery,
  type UserCreate,
  type UserUpdate,
  type UserLogin,
  type UserRegister
} from './schemas/user'

// Export common schemas
export {
  CardStatusEnum,
  type CardStatus,
  cardStatusSchema,
  languageCodeSchema,
  optionalLanguageCodeSchema,
  languageCodeWithDefault,
  paginationSchema,
  baseEntityFields,
  translationFields,
  effectsSchema
} from './schemas/common'

// Export entity schemas
export {
  baseCardSchema,
  baseCardCreateSchema,
  baseCardUpdateSchema,
  baseCardQuerySchema,
  type BaseCard,
  type BaseCardCreate,
  type BaseCardUpdate,
  type BaseCardQuery
} from './schemas/entities/base-card'

// Export admin user schemas
export {
  adminUserStatusEnum,
  adminUserCreateSchema,
  adminUserUpdateSchema,
  type AdminUserStatus,
  type AdminUserCreate,
  type AdminUserUpdate
} from './schemas/admin/user'
