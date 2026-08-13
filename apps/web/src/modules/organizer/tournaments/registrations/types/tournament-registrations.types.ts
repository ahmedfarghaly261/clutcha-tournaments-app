export type RegistrationApprovalFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

export interface RegistrationFilters {
  search: string
  approvalStatus: RegistrationApprovalFilter
}

export interface CaptainContactSnapshot {
  displayName: string
  email: string
  phoneNumber: string | null
  discordUsername: string | null
}

export interface RosterSnapshotMember {
  rosterPlayerId: string
  gamerTag: string
  realName: string | null
  gameAccountId: string
  phoneNumber: string
  email: string | null
  discordUsername: string | null
  rosterType: string
  rank: string | null
  country: string | null
}
