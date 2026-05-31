import { z } from 'zod'

// --- Constants -----------------------------------------------------------

/** Minimum characters for name — prevents single-letter submissions. */
const NAME_MIN = 2

/**
 * International phone regex.
 *
 * - Optional leading `+`
 * - May contain digits, spaces, dashes, dots, parentheses
 * - Length: 7–20 characters (covers local numbers up to full international)
 */
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/

// --- Messages -------------------------------------------------------------

const MSG = {
  name: {
    min: `Full name must be at least ${NAME_MIN} characters.`,
    required: 'Full name is required.',
  },
  email: {
    required: 'Email is required.',
    invalid: 'Please enter a valid email address.',
  },
  phone: {
    required: 'Phone number is required.',
    pattern: 'Please enter a valid phone number (digits, +, spaces, dashes).',
  },
  vision: {
    required: 'Please describe your tattoo idea.',
  },
  artist: {
    required: 'Please select an artist.',
  },
  consent: {
    age: 'You must confirm you are 18 years of age or older.',
    privacy: 'You must agree to the privacy policy.',
  },
} as const

// --- Schema ---------------------------------------------------------------

export const inquiryFormSchema = z.object({
  name: z
    .string({ message: MSG.name.required })
    .trim()
    .min(NAME_MIN, MSG.name.min),

  email: z
    .string({ message: MSG.email.required })
    .trim()
    .email(MSG.email.invalid),

  phone: z
    .string({ message: MSG.phone.required })
    .trim()
    .regex(PHONE_RE, MSG.phone.pattern),

  vision: z
    .string({ message: MSG.vision.required })
    .trim(),

  artist: z
    .union([z.string(), z.number()], { message: MSG.artist.required })
    .refine(
      (v) => (typeof v === 'string' ? v.trim().length > 0 : true),
      MSG.artist.required,
    ),

  // Consent fields use z.boolean().refine() — no type predicate so the
  // inferred output type is `boolean`, compatible with react-hook-form
  // checkbox inputs. Validation rejects `false` at runtime.
  ageConfirmed: z
    .boolean({ message: MSG.consent.age })
    .refine((v) => v === true, MSG.consent.age),

  privacyConsent: z
    .boolean({ message: MSG.consent.privacy })
    .refine((v) => v === true, MSG.consent.privacy),

  // Honeypot field: must be empty if present
  website: z.union([z.literal(""), z.undefined()]),
})

// --- Inferred Type --------------------------------------------------------

/** Strictly-typed inquiry form payload derived from the Zod schema. */
export type InquiryFormPayload = z.infer<typeof inquiryFormSchema>
