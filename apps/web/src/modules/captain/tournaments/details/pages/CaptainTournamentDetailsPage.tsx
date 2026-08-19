import { Link, useParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  CircleDollarSign,
  Gamepad2,
  Globe2,
  Gavel,
  LoaderCircle,
  LockKeyhole,
  Medal,
  RotateCw,
  ShieldCheck,
  Trophy,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TournamentModeDetails } from '../components/TournamentModeDetails'
import { TournamentTimeline } from '../components/TournamentTimeline'
import { useCaptainTournamentDetailsService } from '../services/captain-tournament-details.service'
import { transformTournamentDetails } from '../transformers/captain-tournament-details.transformer'

export function CaptainTournamentDetailsPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const detailsQuery = useCaptainTournamentDetailsService(slug)
  const tournament = detailsQuery.data ? transformTournamentDetails(detailsQuery.data) : null
  const notFound = detailsQuery.isError && isAxiosError(detailsQuery.error) && detailsQuery.error.response?.status === 404

  if (detailsQuery.isLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-sm text-[#9da9b8]"><LoaderCircle className="mr-2 h-5 w-5 animate-spin text-[#71dcff]" /> Loading tournament details...</div>
  }

  if (detailsQuery.isError || !tournament) {
    return <div className="mx-auto max-w-3xl pt-8"><Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]"><CircleAlert className="h-5 w-5" /><AlertTitle>{notFound ? 'Tournament not found' : 'Tournament details could not be loaded'}</AlertTitle><AlertDescription className="text-[#e6b8bc]">{notFound ? 'This tournament is not publicly discoverable or no longer exists.' : 'Refresh the request and try again.'}</AlertDescription><div className="mt-4 flex gap-3"><Button render={<Link to="/captain/tournaments" />} variant="outline"><ArrowLeft /> Back to tournaments</Button>{!notFound && <Button variant="outline" onClick={() => void detailsQuery.refetch()}><RotateCw /> Retry</Button>}</div></Alert></div>
  }

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <Button render={<Link to="/captain/tournaments" />} variant="ghost" className="mb-4"><ArrowLeft /> Back to tournaments</Button>

      <section className="relative min-h-[360px] overflow-hidden rounded-2xl border border-[#2e3943] bg-[#11151a]">
        {tournament.coverUrl ? <img className="absolute inset-0 h-full w-full object-cover opacity-55" src={tournament.coverUrl} alt={`${tournament.name} cover`} /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(113,220,255,0.22),transparent_34%),linear-gradient(125deg,#172b35,#11151a_58%,#211a32)]" />}
        <div className="absolute inset-0 bg-linear-to-t from-[#11151a] via-[#11151a]/65 to-black/30" />
        <div className="relative flex min-h-[360px] flex-col justify-end p-6 sm:p-8 lg:p-10">
          <div className="mb-4 flex flex-wrap gap-2"><span className="rounded-full border border-[#2b725b] bg-[#15392f] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#93edcf]">{tournament.statusLabel}</span><span className="rounded-full border border-[#4a4857] bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#e0dbe5]">{tournament.gameLabel}</span></div>
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="min-w-0"><h1 className="max-w-4xl text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">{tournament.name}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#c1cbd4]">{tournament.shortDescription || tournament.description || 'Competitive tournament hosted on CLUTCHA.'}</p></div>
            {tournament.logoUrl && <img className="h-20 w-20 shrink-0 rounded-xl border border-white/20 bg-black/30 object-cover" src={tournament.logoUrl} alt={`${tournament.name} logo`} />}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#e1e8ee]"><HeroFact icon={Trophy} value={tournament.prizePoolLabel} /><HeroFact icon={CalendarDays} value={tournament.startDateLabel} /><HeroFact icon={Globe2} value={`${tournament.modeLabel}${tournament.allowedRegion ? ` · ${tournament.allowedRegion}` : ''}`} /></div>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-6">
          <section className="grid gap-6 md:grid-cols-2">
            <Card className="border-[#2d3540] bg-[#15191f]"><CardHeader><Trophy className="h-5 w-5 text-[#cabdff]" /><CardTitle>Prize pool</CardTitle></CardHeader><CardContent><p className="text-3xl font-black text-[#d7b9ff]">{tournament.prizePoolLabel}</p>{tournament.prizeDistributionItems.length > 0 && <div className="mt-4 space-y-2">{tournament.prizeDistributionItems.map((item) => <div key={item.label} className="flex justify-between border-t border-[#2d3540] pt-2 text-xs"><span className="text-[#9ba7b4]">{item.label}</span><span className="font-black text-[#e6edf3]">{item.value}%</span></div>)}</div>}</CardContent></Card>
            <Card className="border-[#2d3540] bg-[#15191f]"><CardHeader><Gamepad2 className="h-5 w-5 text-[#71dcff]" /><CardTitle>Competition format</CardTitle></CardHeader><CardContent className="space-y-3"><InfoRow label="Format" value={tournament.formatLabel} /><InfoRow label="Standard matches" value={`Best of ${tournament.defaultBestOf}`} /><InfoRow label="Final" value={`Best of ${tournament.finalBestOf}`} /><InfoRow label="Seeding" value={tournament.seedingLabel} /><InfoRow label="Third-place match" value={tournament.thirdPlaceMatch ? 'Enabled' : 'Not included'} /></CardContent></Card>
          </section>

          {tournament.description && <Card className="border-[#2d3540] bg-[#15191f]"><CardHeader><Medal className="h-5 w-5 text-[#71dcff]" /><CardTitle>Overview</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-[#aab5c1]">{tournament.description}</p></CardContent></Card>}

          <TournamentTimeline items={tournament.timeline} />

          <Card className="border-[#2d3540] bg-[#15191f]"><CardHeader><Gavel className="h-5 w-5 text-[#ffb5ad]" /><CardTitle>Rules & requirements</CardTitle></CardHeader><CardContent className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Requirement label="Region" value={tournament.allowedRegion || 'Open region'} /><Requirement label="Countries" value={tournament.allowedCountries.length ? tournament.allowedCountries.join(', ') : 'No country restriction'} /><Requirement label="Platforms" value={tournament.allowedPlatforms.length ? tournament.allowedPlatforms.join(', ') : 'Not specified'} /><Requirement label="Player age" value={tournament.minimumPlayerAge ? `${tournament.minimumPlayerAge}+` : 'No minimum'} /><Requirement label="Rank range" value={tournament.minimumRank || tournament.maximumRank ? `${tournament.minimumRank || 'Any'} – ${tournament.maximumRank || 'Any'}` : 'No rank restriction'} /><Requirement label="Game account ID" value={tournament.requiredGameAccountId ? 'Required' : 'Not required'} /></div><div className="rounded-lg border-l-2 border-[#d7a5ff] bg-[#1c1a1f] p-4"><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#d7a5ff]">Rules version {tournament.rulesVersion}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#d1c8d4]">{tournament.rules}</p></div>{tournament.rosterChangeRules && <RuleText label="Roster changes" value={tournament.rosterChangeRules} />}{tournament.checkInRules && <RuleText label="Check-in" value={tournament.checkInRules} />}{tournament.matchReportingRules && <RuleText label="Match reporting" value={tournament.matchReportingRules} />}{tournament.forfeitRules && <RuleText label="Forfeits" value={tournament.forfeitRules} />}{tournament.codeOfConduct && <RuleText label="Code of conduct" value={tournament.codeOfConduct} />}</CardContent></Card>

          <TournamentModeDetails tournament={tournament} />
        </main>

        <aside className="space-y-5 xl:sticky xl:top-6">
          <Card className="border-[#3b4652] bg-[#171b20]"><CardHeader><ShieldCheck className="h-5 w-5 text-[#71dcff]" /><div><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8d9aa8]">Registration</p><CardTitle>{tournament.statusLabel}</CardTitle></div></CardHeader><CardContent className="space-y-4"><InfoRow label="Entry fee" value={tournament.registrationFeeLabel} /><InfoRow label="Team capacity" value={tournament.teamCapacityLabel} /><InfoRow label="Roster" value={tournament.rosterSizeLabel} /><InfoRow label="Window" value={tournament.registrationWindowLabel} /><Button className="w-full" disabled><LockKeyhole /> Eligibility check is next</Button><p className="text-center text-xs leading-5 text-[#83909f]">Your team’s eligibility and tournament registration will be connected in the next feature.</p></CardContent></Card>
          <Card className="border-[#2d3540] bg-[#15191f]"><CardContent className="space-y-3"><InfoRow label="Starts" value={tournament.startDateLabel} /><InfoRow label="Ends" value={tournament.endDateLabel} /><InfoRow label="Timezone" value={tournament.timezone} /><InfoRow label="Waitlist" value={tournament.waitlistEnabled ? tournament.maximumWaitlistSize ? `Enabled · ${tournament.maximumWaitlistSize} teams` : 'Enabled' : 'Disabled'} /></CardContent></Card>
          {(tournament.refundPolicy || tournament.cancellationPolicy) && <Card className="border-[#2d3540] bg-[#15191f]"><CardHeader><CircleDollarSign className="h-5 w-5 text-[#cabdff]" /><CardTitle>Policies</CardTitle></CardHeader><CardContent className="space-y-4">{tournament.refundPolicy && <RuleText label="Refunds" value={tournament.refundPolicy} />}{tournament.cancellationPolicy && <RuleText label="Cancellation" value={tournament.cancellationPolicy} />}</CardContent></Card>}
        </aside>
      </div>
    </div>
  )
}

function HeroFact({ icon: Icon, value }: { icon: typeof Trophy; value: string }) { return <span className="flex items-center gap-2"><Icon className="h-5 w-5 text-[#caa6ff]" />{value}</span> }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 border-b border-[#2c343e] pb-3 last:border-0 last:pb-0"><span className="text-xs font-bold text-[#8794a3]">{label}</span><span className="text-right text-xs font-black text-[#e5ecf2]">{value}</span></div> }
function Requirement({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-[#303945] bg-[#11151a] p-4"><p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#7bdcf8]">{label}</p><p className="mt-2 text-sm font-bold text-[#e4ebf1]">{value}</p></div> }
function RuleText({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#9ba7b4]">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#d2dae1]">{value}</p></div> }
