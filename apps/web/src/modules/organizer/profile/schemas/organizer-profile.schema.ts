import { z } from 'zod'

const optionalText = (maxLength: number, label: string) =>
  z.string().trim().max(maxLength, `${label} must be ${maxLength} characters or less`)

const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(2048, `${label} must be 2048 characters or less`)
    .refine((value) => value.length === 0 || URL.canParse(value), {
      message: `Enter a valid ${label.toLowerCase()}`,
    })

export const organizerProfileSchema = z.object({
  organizationName: optionalText(120, 'Organization name'),
  logoUrl: optionalUrl('Logo URL'),
  coverUrl: optionalUrl('Cover URL'),
  description: optionalText(2000, 'Description'),
  contactEmail: z
    .string()
    .trim()
    .max(254, 'Contact email must be 254 characters or less')
    .refine((value) => value.length === 0 || z.string().email().safeParse(value).success, {
      message: 'Enter a valid contact email',
    }),
  supportPhone: optionalText(40, 'Support phone'),
  country: optionalText(80, 'Country'),
  city: optionalText(80, 'City'),
  websiteUrl: optionalUrl('Website URL'),
  facebookUrl: optionalUrl('Facebook URL'),
  instagramUrl: optionalUrl('Instagram URL'),
  discordUrl: optionalUrl('Discord URL'),
})

export type OrganizerProfileFormValues = z.infer<typeof organizerProfileSchema>
