// shared/editorial/index.ts
export { CardStatus } from './card-status'
export type { CardStatus as CardStatusType } from './card-status'
export { cardStatusTransitions, transitionRequirements } from './transitions'
export type { TransitionRequirement } from './transitions'
export { canTransition } from './guard'
export type { EditorialContext, EditorialUserContext, TransitionResult } from './guard'