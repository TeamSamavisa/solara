import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Assignment } from '@/interfaces/assignment';

interface DeleteAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  assignment: Assignment | null;
}

export function DeleteAssignmentDialog({
  isOpen,
  onClose,
  onConfirm,
  assignment,
}: DeleteAssignmentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a atribuição da disciplina{' '}
            <span className="font-medium">{assignment?.subject?.name}</span>
            ?
            <br />
            <span className="text-red-600">
              Esta ação não pode ser desfeita.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
