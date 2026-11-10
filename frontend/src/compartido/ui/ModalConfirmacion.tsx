import { Button, Modal } from '@heroui/react';

export function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  confirmarEtiqueta = 'Confirmar',
  cancelarEtiqueta = 'Volver',
  pendiente = false,
  onConfirmar,
  onCerrar,
}: {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  confirmarEtiqueta?: string;
  cancelarEtiqueta?: string;
  pendiente?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  return (
    <Modal.Backdrop
      isOpen={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="sc-modal-cuadro sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{titulo}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p className="text-sm text-slate-700">{mensaje}</p>
          </Modal.Body>
          <Modal.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="sc-btn-cuadro"
              isDisabled={pendiente}
              onPress={onCerrar}
            >
              {cancelarEtiqueta}
            </Button>
            <Button
              type="button"
              className="sc-btn-cuadro"
              isDisabled={pendiente}
              isPending={pendiente}
              onPress={onConfirmar}
            >
              {confirmarEtiqueta}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
