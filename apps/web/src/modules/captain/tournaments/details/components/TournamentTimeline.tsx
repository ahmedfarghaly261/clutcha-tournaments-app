import { CalendarClock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TournamentTimelineItem } from '../types/captain-tournament-details.types'

export function TournamentTimeline({ items }: { items: TournamentTimelineItem[] }) {
  return (
    <Card className="border-[#2d3540] bg-[#15191f]">
      <CardHeader><CalendarClock className="h-5 w-5 text-[#71dcff]" /><CardTitle>Tournament timeline</CardTitle></CardHeader>
      <CardContent>
        <ol className="relative ml-2 border-l border-[#3c4854] pl-6">
          {items.map((item, index) => (
            <li key={item.key} className={index === items.length - 1 ? '' : 'pb-6'}>
              <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#15191f] bg-[#71dcff] ring-1 ring-[#426b79]" />
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#71dcff]">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-[#e7eef4]">{item.dateLabel}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
