import { type OnlineConfigurationResponseDto } from '../dtos/online-configuration-response.dto';

export type OnlineConfigurationRecord = {
  id: string;
  tournamentId: string;
  serverRegion: string;
  publicInstructions: string | null;
  connectionRules: string | null;
  evidenceRequired: boolean;
  screenshotRequirements: string | null;
  resultSubmissionDeadlineMinutes: number | null;
  discordServerUrl: string | null;
  captainSupportChannel: string | null;
  matchReportingChannel: string | null;
  lobbyInstructions: string | null;
  privateSupportContact: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const toOnlineConfigurationResponse = (
  configuration: OnlineConfigurationRecord,
): OnlineConfigurationResponseDto => ({
  id: configuration.id,
  tournamentId: configuration.tournamentId,
  publicDetails: {
    serverRegion: configuration.serverRegion,
    publicInstructions: configuration.publicInstructions,
    connectionRules: configuration.connectionRules,
    evidenceRequired: configuration.evidenceRequired,
    screenshotRequirements: configuration.screenshotRequirements,
    resultSubmissionDeadlineMinutes:
      configuration.resultSubmissionDeadlineMinutes,
  },
  privateDetails: {
    discordServerUrl: configuration.discordServerUrl,
    captainSupportChannel: configuration.captainSupportChannel,
    matchReportingChannel: configuration.matchReportingChannel,
    lobbyInstructions: configuration.lobbyInstructions,
    privateSupportContact: configuration.privateSupportContact,
  },
  createdAt: configuration.createdAt,
  updatedAt: configuration.updatedAt,
});
