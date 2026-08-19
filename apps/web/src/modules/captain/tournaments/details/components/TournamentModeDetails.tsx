import { Cpu, ExternalLink, Gamepad2, MapPin, Monitor, Mouse, Network, Server, Warehouse } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CaptainTournamentDetailsView } from '../types/captain-tournament-details.types'
import { titleCaseTournamentValue } from '../transformers/captain-tournament-details.transformer'

export function TournamentModeDetails({ tournament }: { tournament: CaptainTournamentDetailsView }) {
  if (tournament.mode === 'ONLINE' && tournament.onlineConfiguration) {
    const config = tournament.onlineConfiguration
    return (
      <Card className="border-[#2d3540] bg-[#15191f]">
        <CardHeader><Network className="h-5 w-5 text-[#71dcff]" /><CardTitle>Online tournament setup</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ModeFact icon={Server} label="Server region" value={config.serverRegion} />
          <ModeFact icon={Gamepad2} label="Evidence" value={config.evidenceRequired ? 'Required' : 'Not required'} />
          {config.resultSubmissionDeadlineMinutes != null && <ModeFact icon={Gamepad2} label="Result deadline" value={`${config.resultSubmissionDeadlineMinutes} minutes`} />}
          {config.publicInstructions && <ModeText label="Public instructions" value={config.publicInstructions} />}
          {config.connectionRules && <ModeText label="Connection rules" value={config.connectionRules} />}
          {config.screenshotRequirements && <ModeText label="Screenshot requirements" value={config.screenshotRequirements} />}
        </CardContent>
      </Card>
    )
  }

  if (tournament.mode === 'ONSITE' && tournament.venue) {
    const { location, policy, equipmentPolicy, gamingRooms } = tournament.venue
    return (
      <div className="space-y-6">
        <Card className="border-[#2d3540] bg-[#15191f]">
          <CardHeader><MapPin className="h-5 w-5 text-[#71dcff]" /><CardTitle>Venue</CardTitle></CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-[#303945] bg-[#11151a] p-4">
              <p className="text-lg font-black text-[#edf3f8]">{location.name}</p>
              <p className="mt-2 text-sm leading-6 text-[#a0acba]">{location.address}<br />{location.city}, {location.country}</p>
              <p className="mt-3 text-xs font-bold text-[#8ddff7]">Check-in: {location.checkInLocation}</p>
              {location.mapUrl && <a className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#71dcff] hover:underline" href={location.mapUrl} target="_blank" rel="noreferrer">Open map <ExternalLink className="h-3.5 w-3.5" /></a>}
            </div>
            <div className="space-y-3">
              <PolicyValue label="Parking" value={policy.parkingInfo} />
              <PolicyValue label="Spectators" value={policy.spectatorPolicy} />
              <PolicyValue label="Venue rules" value={policy.venueRules} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2d3540] bg-[#15191f]">
          <CardHeader><Warehouse className="h-5 w-5 text-[#cabdff]" /><CardTitle>Gaming rooms & equipment</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <EquipmentGroup label="Provided" values={equipmentPolicy.equipmentProvided} />
              <EquipmentGroup label="Players may bring" values={equipmentPolicy.playersMayBring} />
              <EquipmentGroup label="Players must bring" values={equipmentPolicy.playersMustBring} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {gamingRooms.map((room) => (
                <div key={room.id} className="rounded-lg border border-[#303945] bg-[#11151a] p-4">
                  <div className="mb-4 flex items-start justify-between gap-3"><div><p className="font-black text-[#edf3f8]">{room.name}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.07em] text-[#71dcff]">{titleCaseTournamentValue(room.purpose)}</p></div><span className="rounded-full border border-[#3b4b56] px-2.5 py-1 text-xs font-bold text-[#c7d2dc]">{room.stationCount} stations</span></div>
                  {room.description && <p className="mb-4 text-xs leading-5 text-[#909dac]">{room.description}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <RoomSpec icon={Cpu} label="CPU" value={room.pcSpecs.cpu} />
                    <RoomSpec icon={Gamepad2} label="GPU" value={room.pcSpecs.gpu} />
                    <RoomSpec icon={Monitor} label="Monitor" value={`${room.monitor.model} · ${room.monitor.refreshRateHz} Hz`} />
                    <RoomSpec icon={Mouse} label="Peripherals" value={`${room.peripherals.mouse} / ${room.peripherals.keyboard}`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

function ModeFact({ icon: Icon, label, value }: { icon: typeof Server; label: string; value: string }) {
  return <div className="rounded-lg border border-[#303945] bg-[#11151a] p-4"><div className="mb-2 flex items-center gap-2 text-[#71dcff]"><Icon className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.07em]">{label}</span></div><p className="text-sm font-bold text-[#e6edf3]">{value}</p></div>
}

function ModeText({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[#303945] bg-[#11151a] p-4 sm:col-span-2"><p className="text-[10px] font-black uppercase tracking-[0.07em] text-[#71dcff]">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#aab5c1]">{value}</p></div>
}

function PolicyValue({ label, value }: { label: string; value?: string | null }) {
  return <div><p className="text-[10px] font-black uppercase tracking-[0.07em] text-[#81909f]">{label}</p><p className="mt-1 text-sm leading-5 text-[#dce4eb]">{value || 'Not specified'}</p></div>
}

function EquipmentGroup({ label, values }: { label: string; values?: object }) {
  const enabled = values ? Object.entries(values).filter(([, value]) => value === true).map(([key]) => titleCaseTournamentValue(key)) : []
  return <div className="rounded-lg border border-[#303945] bg-[#11151a] p-4"><p className="text-[10px] font-black uppercase tracking-[0.07em] text-[#71dcff]">{label}</p><p className="mt-2 text-sm leading-6 text-[#dce4eb]">{enabled.length ? enabled.join(', ') : 'Nothing specified'}</p></div>
}

function RoomSpec({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return <div className="min-w-0"><div className="flex items-center gap-1.5 text-[#7bdcf8]"><Icon className="h-3.5 w-3.5" /><span className="text-[9px] font-black uppercase">{label}</span></div><p className="mt-1 truncate text-xs font-bold text-[#dce5ec]" title={value}>{value}</p></div>
}
