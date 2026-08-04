import { RosterType } from '@clutcha/database';
import {
  CaptainDashboardAction,
  type CaptainDashboardResponseDto,
  type CaptainDashboardRosterDto,
  type CaptainDashboardTeamDto,
} from '../dto/captain-dashboard-response.dto';

type CaptainDashboardProfileRecord = {
  id: string;
  displayName: string;
  phoneNumber: string | null;
};

type CaptainDashboardTeamRecord = {
  id: string;
  name: string;
  slug: string;
  gameKey: string;
  region: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  status: CaptainDashboardTeamDto['status'];
};

type CaptainDashboardRosterRecord = {
  rosterType: RosterType;
};

export const toCaptainDashboardResponse = (
  profile: CaptainDashboardProfileRecord,
  team: CaptainDashboardTeamRecord | null,
  rosterPlayers: CaptainDashboardRosterRecord[],
): CaptainDashboardResponseDto => {
  const profileComplete = Boolean(profile.phoneNumber);
  const roster = team ? toRosterSummary(rosterPlayers) : null;
  const requiredActions = resolveRequiredActions(profileComplete, team, roster);

  return {
    profile: {
      id: profile.id,
      displayName: profile.displayName,
      profileComplete,
    },
    team: team ? toTeamSummary(team) : null,
    roster,
    activeTournamentRegistrations: null,
    upcomingTournament: null,
    upcomingMatch: null,
    actionRequired: requiredActions[0] ?? CaptainDashboardAction.NONE,
    requiredActions,
  };
};

const toTeamSummary = (
  team: CaptainDashboardTeamRecord,
): CaptainDashboardTeamDto => ({
  id: team.id,
  name: team.name,
  slug: team.slug,
  gameKey: team.gameKey,
  region: team.region,
  logoUrl: team.logoUrl,
  coverUrl: team.coverUrl,
  status: team.status,
});

const toRosterSummary = (
  rosterPlayers: CaptainDashboardRosterRecord[],
): CaptainDashboardRosterDto => {
  const starterCount = rosterPlayers.filter(
    (player) => player.rosterType === RosterType.STARTER,
  ).length;
  const substituteCount = rosterPlayers.filter(
    (player) => player.rosterType === RosterType.SUBSTITUTE,
  ).length;

  return {
    totalCount: rosterPlayers.length,
    starterCount,
    substituteCount,
  };
};

const resolveRequiredActions = (
  profileComplete: boolean,
  team: CaptainDashboardTeamRecord | null,
  roster: CaptainDashboardRosterDto | null,
): CaptainDashboardAction[] => {
  const actions: CaptainDashboardAction[] = [];

  if (!team) {
    actions.push(CaptainDashboardAction.CREATE_TEAM);
  }

  if (!profileComplete) {
    actions.push(CaptainDashboardAction.COMPLETE_PROFILE);
  }

  if (team && (!roster || roster.totalCount === 0)) {
    actions.push(CaptainDashboardAction.ADD_ROSTER_PLAYERS);
  }

  return actions.length > 0 ? actions : [CaptainDashboardAction.NONE];
};
