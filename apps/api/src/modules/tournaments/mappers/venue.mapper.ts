import { type VenueResponseDto } from '../dtos/venue-response.dto';

export type VenueRecord = {
  id: string;
  tournamentId: string;
  name: string;
  country: string;
  city: string;
  address: string;
  mapUrl: string | null;
  checkInLocation: string;
  parkingInfo: string | null;
  spectatorPolicy: string | null;
  venueRules: string | null;
  emergencyContact: string | null;
  equipmentProvided: unknown;
  playersMayBring: unknown;
  playersMustBring: unknown;
  personalPeripheralsAllowed: boolean;
  controllersAllowed: boolean;
  usbDevicesAllowed: boolean;
  driverInstallationAllowed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const toVenueResponse = (venue: VenueRecord): VenueResponseDto => ({
  id: venue.id,
  tournamentId: venue.tournamentId,
  location: {
    name: venue.name,
    country: venue.country,
    city: venue.city,
    address: venue.address,
    mapUrl: venue.mapUrl,
    checkInLocation: venue.checkInLocation,
  },
  policy: {
    parkingInfo: venue.parkingInfo,
    spectatorPolicy: venue.spectatorPolicy,
    venueRules: venue.venueRules,
    emergencyContact: venue.emergencyContact,
  },
  equipmentPolicy: {
    equipmentProvided: venue.equipmentProvided,
    playersMayBring: venue.playersMayBring,
    playersMustBring: venue.playersMustBring,
    personalPeripheralsAllowed: venue.personalPeripheralsAllowed,
    controllersAllowed: venue.controllersAllowed,
    usbDevicesAllowed: venue.usbDevicesAllowed,
    driverInstallationAllowed: venue.driverInstallationAllowed,
  },
  createdAt: venue.createdAt,
  updatedAt: venue.updatedAt,
});
