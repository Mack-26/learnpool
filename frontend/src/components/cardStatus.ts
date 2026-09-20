import type { SessionSummary } from '../types/api'

/**
 * Canonical card status. Legacy callers still pass 'live' | 'past'; normalise
 * them here so every card in the app speaks one status language.
 */
export type CardStatus = SessionSummary['status']
export type LegacyCardStatus = CardStatus | 'live' | 'past'

export function normalizeStatus(status: LegacyCardStatus): CardStatus {
  if (status === 'live') return 'active'
  if (status === 'past') return 'ended'
  return status
}

/** Chip label. */
export const STATUS_LABEL: Record<CardStatus, string> = {
  active: 'Live',
  upcoming: 'Not open yet',
  ended: 'Archived',
  released: 'Released',
}

/** Answers "is it open?" in one short phrase, for the card's meta line. */
export const OPEN_STATE: Record<CardStatus, string> = {
  active: 'Q&A open now',
  upcoming: 'Opens when the lecture starts',
  ended: 'Q&A closed',
  released: 'Open to read',
}
