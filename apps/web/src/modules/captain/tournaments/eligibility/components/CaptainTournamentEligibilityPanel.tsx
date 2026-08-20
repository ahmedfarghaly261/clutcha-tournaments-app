import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  RotateCw,
  ShieldCheck,
  ShieldX,
  UserRoundSearch,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCaptainTournamentEligibilityService } from '../services/captain-tournament-eligibility.service'
import { transformTournamentEligibility } from '../transformers/captain-tournament-eligibility.transformer'

export function CaptainTournamentEligibilityPanel({ tournamentId }: { tournamentId: string }) {
  const eligibilityQuery = useCaptainTournamentEligibilityService(tournamentId)
  const eligibility = eligibilityQuery.data
    ? transformTournamentEligibility(eligibilityQuery.data)
    : null
  const noTeam = eligibilityQuery.isError
    && isAxiosError(eligibilityQuery.error)
    && eligibilityQuery.error.response?.status === 422

  if (eligibilityQuery.isLoading) {
    return (
      <Card className="border-[#2d4652] bg-[#151b20]">
        <CardContent className="flex items-center justify-center py-8 text-sm text-[#9da9b8]">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-[#71dcff]" />
          Checking team eligibility...
        </CardContent>
      </Card>
    )
  }

  if (noTeam) {
    return (
      <Card className="border-[#735f2c] bg-[#231e14]">
        <CardHeader><UserRoundSearch className="h-5 w-5 text-[#f0d17f]" /><CardTitle>Team required</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-[#d1bf91]">Register your Captain-owned team before CLUTCHA can check its tournament eligibility.</p>
          <Button render={<Link to="/captain/team" />} className="mt-4 w-full justify-between">Register team <ArrowRight /></Button>
        </CardContent>
      </Card>
    )
  }

  if (eligibilityQuery.isError || !eligibility) {
    return (
      <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]">
        <CircleAlert className="h-5 w-5" />
        <AlertTitle>Eligibility could not be checked</AlertTitle>
        <AlertDescription className="text-[#e6b8bc]">Refresh the eligibility result and try again.</AlertDescription>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void eligibilityQuery.refetch()}><RotateCw /> Retry check</Button>
      </Alert>
    )
  }

  if (eligibility.eligible) {
    return (
      <Card className="border-[#2b715b] bg-[#15342b] shadow-[0_0_35px_rgba(67,211,163,0.08)]">
        <CardHeader><ShieldCheck className="h-5 w-5 text-[#8ef0cf]" /><CardTitle className="text-[#c9fae9]">Team eligible</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg border border-[#34745f] bg-[#173b30] p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#8ef0cf]" />
            <div><p className="text-sm font-black text-[#d8fff1]">{eligibility.team?.name ?? 'Your team'} meets the current requirements.</p><p className="mt-1 text-xs leading-5 text-[#a8dac9]">Eligibility is evaluated again when registration is submitted.</p></div>
          </div>
          <Button className="mt-4 w-full" disabled><ShieldCheck /> Registration submission is next</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#704149] bg-[#27191c]">
      <CardHeader><ShieldX className="h-5 w-5 text-[#ffabb3]" /><div><CardTitle className="text-[#ffd8dc]">Team not eligible yet</CardTitle>{eligibility.team && <p className="mt-1 text-xs text-[#c69ca1]">Checked for {eligibility.team.name}</p>}</div></CardHeader>
      <CardContent className="space-y-3">
        {eligibility.issues.map((issue) => (
          <div key={`${issue.code}-${issue.field}`} className="rounded-lg border border-[#633a41] bg-[#321d21] p-4">
            <p className="text-sm font-black text-[#ffd3d7]">{issue.title}</p>
            <p className="mt-1 text-xs leading-5 text-[#d4a8ad]">{issue.message}</p>
            {issue.action && <Button render={<Link to={issue.action.to} />} variant="outline" size="sm" className="mt-3 justify-between">{issue.action.label} <ArrowRight /></Button>}
          </div>
        ))}
        <Button variant="outline" className="w-full" disabled={eligibilityQuery.isFetching} onClick={() => void eligibilityQuery.refetch()}>
          {eligibilityQuery.isFetching ? <LoaderCircle className="animate-spin" /> : <RotateCw />}
          Recheck eligibility
        </Button>
      </CardContent>
    </Card>
  )
}
