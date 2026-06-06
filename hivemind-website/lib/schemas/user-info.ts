import { z } from "zod"

export const userInfoSchema = z.object({
  // ADDED: Identity fields for OAuth users
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  name: z.string().min(1, "Name is required").optional(),

  // Bio & Identity
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  
  interests: z.string().optional(), 

  // Demographics
  dateOfBirth: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', {
    message: "A valid date of birth is required."
  }),
  gender: z.string().optional(),
  education: z.string().optional(),
  maritalStatus: z.string().optional(),

  // Household
  householdSize: z.number().min(1).optional(),
  childrenCount: z.number().min(0).optional(),
  socialSupportLevel: z.enum(["low", "medium", "high"]).optional(),

  // Origins
  childhoodMathSkill: z.number().min(1).max(10).optional(),
  booksInHome: z.string().optional(),

  // Health
  bmi: z.number().min(10).max(60).optional(),
  smoking: z.string().optional(),
  alcoholConsumption: z.string().optional(),
  mentalHealthScore: z.number().min(0).max(10).optional(),

  // Work
  employmentStatus: z.string().optional(),
  incomePercentile: z.number().min(0).max(100).optional(),
})

export type UserInfoValues = z.infer<typeof userInfoSchema>