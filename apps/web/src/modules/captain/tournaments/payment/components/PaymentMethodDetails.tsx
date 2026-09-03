import { ExternalLink } from 'lucide-react'
import type { TournamentPaymentMethodResponseDto } from '@/api/generated'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const coordinateLabels: Array<[keyof TournamentPaymentMethodResponseDto, string]> = [
  ['accountHolderName', 'Account holder'],
  ['accountIdentifier', 'Account ID'],
  ['phoneNumber', 'Phone number'],
  ['instapayAddress', 'InstaPay address'],
  ['bankName', 'Bank name'],
  ['bankBranch', 'Bank branch'],
  ['bankAccountNumber', 'Bank account'],
  ['iban', 'IBAN'],
  ['swiftCode', 'SWIFT code'],
]

function formatMethodType(value: string) {
  return value.toLowerCase().split('_').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
}

export function PaymentMethodDetails({ method }: { method: TournamentPaymentMethodResponseDto }) {
  const coordinates = coordinateLabels
    .map(([key, label]) => ({ label, value: method[key] }))
    .filter((item): item is { label: string; value: string } => typeof item.value === 'string' && item.value.trim().length > 0)

  return (
    <Card className="rounded-lg border-[#38323b] bg-[#121113]">
      <CardHeader className="flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-black text-[#eee7f0]">{method.displayName}</p>
          <p className="mt-1 text-[10px] font-black uppercase text-[#8d8193]">{formatMethodType(method.type)}</p>
        </div>
        {method.externalUrl && (
          <Button render={<a href={method.externalUrl} target="_blank" rel="noreferrer" />} variant="secondary" size="sm">
            <ExternalLink className="h-4 w-4" /> Open link
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {coordinates.length > 0 && (
          <dl className="grid gap-2 sm:grid-cols-2">
            {coordinates.map((item) => (
              <div key={item.label} className="rounded-md border border-[#302b33] bg-[#1b191c] p-3">
                <dt className="text-[10px] font-black uppercase text-[#8d8193]">{item.label}</dt>
                <dd className="mt-1 break-words text-sm font-bold text-[#f0eaf2]">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-4 rounded-md border border-[#302b33] bg-[#1b191c] p-3">
          <p className="text-[10px] font-black uppercase text-[#8d8193]">Payment instructions</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#d2c8d6]">{method.instructions}</p>
        </div>

        {method.notes && (
          <div className="mt-3 rounded-md border border-[#302b33] bg-[#1b191c] p-3">
            <p className="text-[10px] font-black uppercase text-[#8d8193]">Organizer note</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#c9becd]">{method.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
