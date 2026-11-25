// El correo se guarda en minúsculas, pero puede haber cuentas antiguas escritas
// con mayúsculas. Se busca siempre igual y con collation de fuerza 2 (ignora
// mayúsculas, respeta tildes), para que `Ana@Example.COM` y `ana@example.com`
// sean la misma cuenta al entrar y al darse de alta, sin migrar nada.
export const EMAIL_COLLATION = { locale: 'es', strength: 2 } as const

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// Devuelve el filtro y las opciones ya listos para `collection.findOne`, para
// que ningún sitio repita la normalización y la collation por su cuenta.
export function emailLookup(email: string) {
  return {
    filter: { email: normalizeEmail(email) },
    options: { collation: EMAIL_COLLATION },
  }
}
