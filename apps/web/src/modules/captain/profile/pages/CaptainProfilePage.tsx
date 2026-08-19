import { useState } from 'react'
import { CircleAlert, LoaderCircle, RotateCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CaptainProfileForm } from '../components/CaptainProfileForm'
import { CaptainProfileView } from '../components/CaptainProfileView'
import { useUpdateCaptainProfileMutation } from '../mutations/captain-profile.mutations'
import { useCaptainProfileService } from '../services/captain-profile.service'

export function CaptainProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const profileQuery = useCaptainProfileService()
  const updateProfileMutation = useUpdateCaptainProfileMutation()

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.11em] text-[#71dcff]">
          Captain Workspace
        </p>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-[#f2f6fb]">
              Captain Profile
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9da9b8]">
              {isEditing
                ? 'Update the personal details used to coordinate your team and tournament participation.'
                : 'Review your CLUTCHA account identity and private tournament contact details.'}
            </p>
          </div>
          <span className="text-xs font-black uppercase tracking-[0.1em] text-[#92a0b0]">
            {isEditing ? 'Edit mode' : 'View mode'}
          </span>
        </div>
      </header>

      {profileQuery.isLoading && (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-[#2c343e] bg-[#15191f] text-sm text-[#9da9b8]">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-[#71dcff]" />
          Loading Captain profile...
        </div>
      )}

      {profileQuery.isError && (
        <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]">
          <CircleAlert className="h-5 w-5" />
          <AlertTitle>Captain profile could not be loaded</AlertTitle>
          <AlertDescription className="text-[#e6b8bc]">
            Refresh the profile request. If the problem continues, sign in again.
          </AlertDescription>
          <Button className="mt-3 w-fit" variant="outline" size="sm" onClick={() => void profileQuery.refetch()}>
            <RotateCw /> Try again
          </Button>
        </Alert>
      )}

      {profileQuery.data && (
        isEditing ? (
          <CaptainProfileForm
            profile={profileQuery.data}
            isSaving={updateProfileMutation.isPending}
            onCancel={() => setIsEditing(false)}
            onSave={(data) => updateProfileMutation.mutateAsync({ data })}
            onSaved={() => setIsEditing(false)}
          />
        ) : (
          <CaptainProfileView
            profile={profileQuery.data}
            onEdit={() => setIsEditing(true)}
          />
        )
      )}
    </div>
  )
}
