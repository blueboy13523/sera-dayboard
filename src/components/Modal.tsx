import type { ReactNode } from 'react'
import { X } from 'lucide-react'
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X /></button></header>{children}</section></div>
}
