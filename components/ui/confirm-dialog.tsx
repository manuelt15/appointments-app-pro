'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLocale } from '@/lib/i18n/client'

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  loading = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  loading?: boolean
  onConfirm: () => void | Promise<void>
}) {
  const { t } = useLocale()
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>{t('common.keep')}</Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? t('common.working') : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
