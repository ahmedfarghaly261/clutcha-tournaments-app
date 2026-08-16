import { useState, type FormEvent } from 'react'
import { CalendarClock, MapPin, Save, Server, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type {
  TournamentBracketMatch,
  TournamentBracketMode,
  TournamentMatchGamingRoom,
  TournamentMatchScheduleFormValues,
} from '../types/tournament-bracket.types'

type MatchScheduleEditorProps = {
  match: TournamentBracketMatch
  mode: TournamentBracketMode
  timezone: string
  gamingRooms: TournamentMatchGamingRoom[]
  gamingRoomsLoading: boolean
  pending: boolean
  onCancel: () => void
  onSubmit: (values: TournamentMatchScheduleFormValues) => Promise<boolean>
}

function getServerValue(match: TournamentBracketMatch, key: string) {
  const serverInfo = match.onlineServerInfo
  if (typeof serverInfo !== 'object' || serverInfo === null || !(key in serverInfo)) return ''
  const value = serverInfo[key]
  return typeof value === 'string' ? value : ''
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function initialValues(match: TournamentBracketMatch): TournamentMatchScheduleFormValues {
  return {
    scheduledAt: toDateTimeLocal(match.scheduledAt),
    serverRegion: getServerValue(match, 'serverRegion'),
    lobbyName: getServerValue(match, 'lobbyName'),
    lobbyCode: getServerValue(match, 'lobbyCode'),
    lobbyPassword: getServerValue(match, 'lobbyPassword'),
    notes: getServerValue(match, 'notes'),
    gamingRoomId: match.gamingRoomId ?? '',
    onsiteStationLabel: match.onsiteStationLabel ?? '',
  }
}

export function MatchScheduleEditor({
  match,
  mode,
  timezone,
  gamingRooms,
  gamingRoomsLoading,
  pending,
  onCancel,
  onSubmit,
}: MatchScheduleEditorProps) {
  const [values, setValues] = useState(() => initialValues(match))
  const [validationError, setValidationError] = useState<string | null>(null)

  const updateValue = (field: keyof TournamentMatchScheduleFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidationError(null)

    if (!values.scheduledAt) {
      setValidationError('Choose the match date and time.')
      return
    }
    if (mode === 'ONLINE' && (!values.serverRegion.trim() || !values.lobbyName.trim())) {
      setValidationError('Server region and lobby name are required for an online match.')
      return
    }
    if (mode === 'ONSITE' && (!values.gamingRoomId || !values.onsiteStationLabel.trim())) {
      setValidationError('Gaming room and station label are required for an on-site match.')
      return
    }

    await onSubmit(values)
  }

  return (
    <Card className="border-[#695476] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[#d7a5ff]" />
            <CardTitle>Schedule {match.bracketPosition}</CardTitle>
          </div>
          <p className="mt-2 text-xs text-[#948999]">
            {match.teamA?.name ?? 'TBD'} vs {match.teamB?.name ?? 'TBD'} · {timezone}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Close schedule editor" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={(event) => void submit(event)}>
          <div>
            <Label htmlFor="match-scheduled-at" className="mb-2">Match date and time</Label>
            <Input
              id="match-scheduled-at"
              type="datetime-local"
              value={values.scheduledAt}
              onChange={(event) => updateValue('scheduledAt', event.target.value)}
            />
            <p className="mt-1.5 text-[10px] text-[#827786]">Displayed in your local time. Tournament timezone: {timezone}.</p>
          </div>

          {mode === 'ONLINE' ? (
            <div className="space-y-4 rounded-lg border border-[#3d3945] bg-[#151519] p-4">
              <div className="flex items-center gap-2 text-sm font-black text-[#d5f5ff]">
                <Server className="h-4 w-4 text-[#64d9f3]" /> Online lobby assignment
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="server-region" className="mb-2">Server region</Label>
                  <Input id="server-region" value={values.serverRegion} maxLength={100} placeholder="MENA" onChange={(event) => updateValue('serverRegion', event.target.value)} />
                </div>
                <div>
                  <Label htmlFor="lobby-name" className="mb-2">Lobby name</Label>
                  <Input id="lobby-name" value={values.lobbyName} maxLength={120} placeholder="CLUTCHA-R1-M1" onChange={(event) => updateValue('lobbyName', event.target.value)} />
                </div>
                <div>
                  <Label htmlFor="lobby-code" className="mb-2">Lobby code</Label>
                  <Input id="lobby-code" value={values.lobbyCode} maxLength={120} placeholder="Optional" onChange={(event) => updateValue('lobbyCode', event.target.value)} />
                </div>
                <div>
                  <Label htmlFor="lobby-password" className="mb-2">Lobby password</Label>
                  <Input id="lobby-password" value={values.lobbyPassword} maxLength={120} placeholder="Optional" onChange={(event) => updateValue('lobbyPassword', event.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="server-notes" className="mb-2">Captain instructions</Label>
                <Textarea id="server-notes" value={values.notes} maxLength={1000} placeholder="Join time, lobby instructions, or server notes..." onChange={(event) => updateValue('notes', event.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-lg border border-[#3d3945] bg-[#151519] p-4">
              <div className="flex items-center gap-2 text-sm font-black text-[#d8ffe9]">
                <MapPin className="h-4 w-4 text-[#69e0c1]" /> On-site station assignment
              </div>
              <div>
                <Label className="mb-2">Gaming room</Label>
                <Select value={values.gamingRoomId || null} onValueChange={(value) => updateValue('gamingRoomId', value ?? '')}>
                  <SelectTrigger disabled={gamingRoomsLoading || gamingRooms.length === 0}>
                    <SelectValue placeholder={gamingRoomsLoading ? 'Loading rooms...' : 'Select gaming room'} />
                  </SelectTrigger>
                  <SelectContent>
                    {gamingRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>{room.name} · {room.stationCount} stations</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!gamingRoomsLoading && gamingRooms.length === 0 && (
                  <p className="mt-2 text-xs text-[#e4b97a]">Create a gaming room in tournament configuration before scheduling.</p>
                )}
              </div>
              <div>
                <Label htmlFor="station-label" className="mb-2">Station label</Label>
                <Input id="station-label" value={values.onsiteStationLabel} maxLength={120} placeholder="Station A-04" onChange={(event) => updateValue('onsiteStationLabel', event.target.value)} />
              </div>
            </div>
          )}

          {validationError && (
            <p className="rounded-md border border-[#7e3e45] bg-[#361b20] px-3 py-2 text-xs font-bold text-[#ffcbc7]">
              {validationError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={pending || (mode === 'ONSITE' && gamingRooms.length === 0)}>
              <Save className="h-4 w-4" /> {pending ? 'Saving...' : 'Save schedule'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
