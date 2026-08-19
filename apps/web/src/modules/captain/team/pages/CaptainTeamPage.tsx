import { useState } from 'react'
import { isAxiosError } from 'axios'
import { CircleAlert, LoaderCircle, RotateCw, ShieldPlus } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CaptainTeamForm } from '../components/CaptainTeamForm'
import { CaptainTeamView } from '../components/CaptainTeamView'
import {
  useCreateCaptainTeamMutation,
  useUpdateCaptainTeamMutation,
} from '../mutations/captain-team.mutations'
import {
  mapFormValuesToCreateCaptainTeam,
  mapFormValuesToUpdateCaptainTeam,
  useCaptainTeamService,
} from '../services/captain-team.service'

export function CaptainTeamPage() {
  const [isEditing, setIsEditing] = useState(false)
  const teamQuery = useCaptainTeamService()
  const createTeamMutation = useCreateCaptainTeamMutation()
  const updateTeamMutation = useUpdateCaptainTeamMutation()
  const teamNotFound = teamQuery.isError && isAxiosError(teamQuery.error) && teamQuery.error.response?.status === 404
  const team = teamQuery.data

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.11em] text-[#71dcff]">Captain Workspace</p>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-[#f2f6fb]">
              {team ? 'My Team' : 'Register Your Team'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9da9b8]">
              {team
                ? isEditing ? 'Update your team identity and private coordination details.' : 'Manage the competitive team owned by your Captain account.'
                : 'Create the team identity you will use to build a roster and enter CLUTCHA tournaments.'}
            </p>
          </div>
          <span className="text-xs font-black uppercase tracking-[0.1em] text-[#92a0b0]">
            {team ? isEditing ? 'Edit mode' : 'Registered team' : 'Team setup'}
          </span>
        </div>
      </header>

      {teamQuery.isLoading && (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-[#2c343e] bg-[#15191f] text-sm text-[#9da9b8]">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-[#71dcff]" />
          Loading Captain team...
        </div>
      )}

      {teamQuery.isError && !teamNotFound && (
        <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]">
          <CircleAlert className="h-5 w-5" />
          <AlertTitle>Captain team could not be loaded</AlertTitle>
          <AlertDescription className="text-[#e6b8bc]">Refresh the request or sign in again if the problem continues.</AlertDescription>
          <Button className="mt-3 w-fit" variant="outline" size="sm" onClick={() => void teamQuery.refetch()}>
            <RotateCw /> Try again
          </Button>
        </Alert>
      )}

      {teamNotFound && (
        <div className="space-y-6">
          <div className="rounded-xl border border-dashed border-[#355060] bg-[#121a20] p-6 text-center">
            <ShieldPlus className="mx-auto h-10 w-10 text-[#71dcff]" />
            <h2 className="mt-3 text-xl font-black text-[#eff6fb]">No team registered yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#95a4b4]">Complete the form below once. CLUTCHA derives ownership from your Captain session.</p>
          </div>
          <CaptainTeamForm
            mode="create"
            isSaving={createTeamMutation.isPending}
            onSubmit={(values) => createTeamMutation.mutateAsync({ data: mapFormValuesToCreateCaptainTeam(values) })}
            onSaved={() => setIsEditing(false)}
          />
        </div>
      )}

      {team && (
        isEditing ? (
          <CaptainTeamForm
            mode="edit"
            team={team}
            isSaving={updateTeamMutation.isPending}
            onCancel={() => setIsEditing(false)}
            onSubmit={(values) => updateTeamMutation.mutateAsync({ data: mapFormValuesToUpdateCaptainTeam(values) })}
            onSaved={() => setIsEditing(false)}
          />
        ) : (
          <CaptainTeamView team={team} onEdit={() => setIsEditing(true)} />
        )
      )}
    </div>
  )
}
