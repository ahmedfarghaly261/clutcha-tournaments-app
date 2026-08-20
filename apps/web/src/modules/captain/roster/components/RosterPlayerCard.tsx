import { Mail, MessageCircle, Pencil, Phone, ShieldCheck, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { RosterPlayer } from '../types/captain-roster.types'

type RosterPlayerCardProps = {
  player: RosterPlayer
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => Promise<void>
}

const statusStyles: Record<string, string> = {
  VERIFIED: 'border-[#276150] bg-[#17372e] text-[#8ce5ca]',
  ELIGIBLE: 'border-[#276150] bg-[#17372e] text-[#8ce5ca]',
  REJECTED: 'border-[#704047] bg-[#351d21] text-[#ffb7bd]',
  INELIGIBLE: 'border-[#704047] bg-[#351d21] text-[#ffb7bd]',
  PENDING: 'border-[#735f2c] bg-[#332916] text-[#f1d384]',
  PENDING_REVIEW: 'border-[#735f2c] bg-[#332916] text-[#f1d384]',
  UNVERIFIED: 'border-[#46505c] bg-[#20262d] text-[#b6c0cb]',
}

export function RosterPlayerCard({ player, isDeleting, onEdit, onDelete }: RosterPlayerCardProps) {
  return (
    <Card className="border-[#2c343e] bg-[#15191f]">
      <CardHeader className="items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#17303a] text-lg font-black text-[#7fe1ff]">{player.gamerTag.charAt(0).toUpperCase()}</span>
          <div className="min-w-0">
            <CardTitle className="truncate">{player.gamerTag}</CardTitle>
            <p className="mt-1 truncate text-xs text-[#8f9baa]">{player.realName || player.gameAccountId}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {player.isCaptain && (
            <span className="rounded-full border border-[#7857a2] bg-[#2d1e3b] px-2.5 py-1 text-[10px] font-black uppercase text-[#dcb0ff]">Captain</span>
          )}
          <span className="rounded-full border border-[#38576a] bg-[#172c36] px-2.5 py-1 text-[10px] font-black uppercase text-[#8be4ff]">{player.rosterType}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge value={player.verificationStatus} />
          <StatusBadge value={player.eligibilityStatus} />
        </div>
        <div className="space-y-2 border-y border-[#2b333d] py-4 text-xs text-[#aab5c2]">
          <Detail icon={ShieldCheck} value={player.gameAccountId} />
          <Detail icon={Phone} value={player.phoneNumber} />
          {player.email && <Detail icon={Mail} value={player.email} />}
          {player.discordUsername && <Detail icon={MessageCircle} value={player.discordUsername} />}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="min-w-0 text-xs text-[#8592a1]">
            <span>{player.rank || 'Rank not added'}</span>
            {player.country && <span> · {player.country}</span>}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}><Pencil /> Edit</Button>
            {!player.isCaptain && (
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}><Trash2 /> Remove</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {player.gamerTag}?</AlertDialogTitle>
                    <AlertDialogDescription>This permanently removes the player record from your current roster. The action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep player</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={() => void onDelete()}>{isDeleting ? 'Removing...' : 'Remove player'}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ value }: { value: string }) {
  return <span className={cn('rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.05em]', statusStyles[value] ?? statusStyles.UNVERIFIED)}>{value.replaceAll('_', ' ')}</span>
}

function Detail({ icon: Icon, value }: { icon: typeof Phone; value: string }) {
  return <div className="flex min-w-0 items-center gap-2"><Icon className="h-3.5 w-3.5 shrink-0 text-[#70d9f8]" /><span className="truncate">{value}</span></div>
}
