import z from "zod"

export const AuthInput = z.object({
    username: z.string().min(1),
    password: z.string().min(6)
})
