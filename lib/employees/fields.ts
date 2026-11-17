import { z } from 'zod'

/**
 * Campos de empleado que acaban en un correo. El nombre va al asunto y al cuerpo,
 * y el email al destinatario, así que un salto de línea en cualquiera de los dos
 * permite inyectar cabeceras. Se rechazan aquí, en la puerta, y se sanean otra vez
 * al componer el mensaje.
 *
 * Los correos tienen que ser válidos: los datos antiguos con emails inventados se
 * descartan al preparar el envío, no al leer.
 */
const noControlChars = (value: string) => !/[\r\n\u0000]/.test(value)

export const employeeName = z
  .string()
  .trim()
  .min(1, 'El nombre no puede estar vacío')
  .max(120, 'El nombre es demasiado largo')
  .refine(noControlChars, 'El nombre no puede contener saltos de línea')

export const employeeEmail = z
  .string()
  .trim()
  .max(254, 'El email es demasiado largo')
  .refine(noControlChars, 'El email no puede contener saltos de línea')
  .email('El email no tiene un formato válido')
