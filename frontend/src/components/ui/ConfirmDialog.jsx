import { Icons } from "../Icons";
import Modal from "./Modal";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, busy }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || "Confirmer la suppression"}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Suppression..." : "Confirmer"}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Icons.alertCircle className="h-5 w-5" />
        </span>
        <p className="pt-1.5 text-sm text-slate-600">{message}</p>
      </div>
    </Modal>
  );
}
