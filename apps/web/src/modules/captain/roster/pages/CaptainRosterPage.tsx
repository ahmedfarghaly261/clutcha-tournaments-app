import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { CircleAlert, LoaderCircle, Search, Shield, UserPlus, UsersRound } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RosterPlayerCard } from '../components/RosterPlayerCard'
import { RosterPlayerForm } from '../components/RosterPlayerForm'
import { useCaptainRosterMutations } from '../mutations/captain-roster.mutations'
import { useCaptainRosterService } from '../services/captain-roster.service'
import {
  transformFormValuesToCreateRosterPlayer,
  transformFormValuesToUpdateRosterPlayer,
} from '../transformers/captain-roster.transformer'
import type { RosterEditorMode, RosterPlayer } from '../types/captain-roster.types'

type EditorState = { mode: RosterEditorMode; player?: RosterPlayer } | null
const emptyRoster: RosterPlayer[] = []

export function CaptainRosterPage() {
  const [editor, setEditor] = useState<EditorState>(null)
  const [search, setSearch] = useState('')
  const [requestError, setRequestError] = useState<string | null>(null)
  const rosterQuery = useCaptainRosterService()
  const mutations = useCaptainRosterMutations()
  const noTeam = rosterQuery.isError && isAxiosError(rosterQuery.error) && rosterQuery.error.response?.status === 404
  const players = rosterQuery.data ?? emptyRoster
  const normalizedSearch = search.trim().toLowerCase()
  const visiblePlayers = useMemo(() => players.filter((player) =>
    !normalizedSearch || [player.gamerTag, player.realName, player.gameAccountId, player.rank, player.country]
      .some((value) => value?.toLowerCase().includes(normalizedSearch)),
  ), [players, normalizedSearch])
  const starters = players.filter((player) => player.rosterType === 'STARTER').length
  const substitutes = players.filter((player) => player.rosterType === 'SUBSTITUTE').length
  const eligible = players.filter((player) => player.eligibilityStatus === 'ELIGIBLE').length

  const removePlayer = async (player: RosterPlayer) => {
    setRequestError(null)
    try {
      await mutations.deletePlayer({ playerId: player.id })
    } catch {
      setRequestError('Could not remove this roster player. Please try again.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.11em] text-[#71dcff]">Captain Workspace</p>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#f2f6fb]">Team Roster</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9da9b8]">Manage starters and substitutes, private contact details, verification, and eligibility state.</p>
        </div>
        {!noTeam && !editor && <Button onClick={() => setEditor({ mode: 'create' })}><UserPlus /> Add player</Button>}
      </header>

      {rosterQuery.isLoading && <div className="flex min-h-64 items-center justify-center rounded-xl border border-[#2c343e] bg-[#15191f] text-sm text-[#9da9b8]"><LoaderCircle className="mr-2 h-5 w-5 animate-spin text-[#71dcff]" /> Loading roster...</div>}

      {noTeam && (
        <Card className="border-dashed border-[#385361] bg-[#121a20]"><CardContent className="py-12 text-center"><Shield className="mx-auto h-11 w-11 text-[#71dcff]" /><h2 className="mt-4 text-xl font-black text-[#eef5fa]">Create your team first</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#96a4b4]">Roster records must belong to your Captain-owned team.</p><Button render={<Link to="/captain/team" />} className="mt-5"><Shield /> Register team</Button></CardContent></Card>
      )}

      {rosterQuery.isError && !noTeam && <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]"><CircleAlert className="h-5 w-5" /><AlertTitle>Roster could not be loaded</AlertTitle><AlertDescription className="text-[#e6b8bc]">Refresh the page or sign in again if the problem continues.</AlertDescription></Alert>}

      {editor && (
        <RosterPlayerForm
          mode={editor.mode}
          player={editor.player}
          isSaving={editor.mode === 'create' ? mutations.isCreating : mutations.isUpdating}
          onCancel={() => setEditor(null)}
          onSubmit={(values) => editor.mode === 'create'
            ? mutations.createPlayer({ data: transformFormValuesToCreateRosterPlayer(values) })
            : mutations.updatePlayer({ playerId: editor.player!.id, data: transformFormValuesToUpdateRosterPlayer(values) })}
          onSaved={() => setEditor(null)}
        />
      )}

      {rosterQuery.isSuccess && !editor && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total players" value={players.length} />
            <Metric label="Starters" value={starters} />
            <Metric label="Substitutes" value={substitutes} />
            <Metric label="Eligible" value={eligible} />
          </section>

          {requestError && <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]"><CircleAlert className="h-5 w-5" /><AlertTitle>Roster action failed</AlertTitle><AlertDescription>{requestError}</AlertDescription></Alert>}

          {players.length > 0 && <div className="relative max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#82909f]" /><Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roster players..." /></div>}

          {players.length === 0 ? (
            <Card className="border-dashed border-[#385361] bg-[#121a20]"><CardContent className="py-12 text-center"><UsersRound className="mx-auto h-11 w-11 text-[#71dcff]" /><h2 className="mt-4 text-xl font-black text-[#eef5fa]">Your roster is empty</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#96a4b4]">Add starters and substitutes as managed player records. They will not receive login accounts.</p><Button className="mt-5" onClick={() => setEditor({ mode: 'create' })}><UserPlus /> Add first player</Button></CardContent></Card>
          ) : visiblePlayers.length > 0 ? (
            <section className="grid gap-5 xl:grid-cols-2">{visiblePlayers.map((player) => <RosterPlayerCard key={player.id} player={player} isDeleting={mutations.isDeleting} onEdit={() => setEditor({ mode: 'edit', player })} onDelete={() => removePlayer(player)} />)}</section>
          ) : (
            <Card><CardContent className="py-10 text-center text-sm text-[#9aa7b6]">No roster players match “{search}”.</CardContent></Card>
          )}
        </>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card className="border-[#2c343e] bg-[#15191f]"><CardContent className="p-4"><p className="text-2xl font-black text-[#edf5fb]">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#83909f]">{label}</p></CardContent></Card>
}
