import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { clientPromise, connectDB } from '@/lib/mongodb/client'
import { emailLookup } from './email'

const CredentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export type AuthorizedUser = {
  id: string
  email: string
  name?: string
  image?: string
}

// Se busca con la misma normalización y collation que el alta. Sin esto, quien
// se registraba como Ana@Example.COM (el alta guarda ana@example.com) no podía
// entrar después, ni con su contraseña: el acceso buscaba el correo tal cual.
// De paso deja entrar a las cuentas antiguas guardadas con mayúsculas.
export async function authorizeWithPassword(credentials: unknown): Promise<AuthorizedUser | null> {
  const parsed = CredentialsSchema.safeParse(credentials)
  if (!parsed.success) return null

  await connectDB()
  const client = await clientPromise
  const { filter, options } = emailLookup(parsed.data.email)
  const user = await client.db().collection('users').findOne(filter, options)

  if (!user?.password) return null

  const valid = await bcrypt.compare(parsed.data.password, user.password)
  if (!valid) return null

  return { id: user._id.toString(), email: user.email, name: user.name, image: user.image }
}
