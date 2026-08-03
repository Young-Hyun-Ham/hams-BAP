import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

type PendingBranchSelection = {
  title?: string;
  replies: Array<{
    display: string;
    value: string;
  }>;
} | null;

type BranchSelectionModalProps = {
  pendingBranchSelection: PendingBranchSelection;
  onCancel: () => void;
  onSelectReply: (value: string) => void;
};

export default function BranchSelectionModal({
  pendingBranchSelection,
  onCancel,
  onSelectReply,
}: BranchSelectionModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={!!pendingBranchSelection}
      onClose={onCancel}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{t('Select Branch')}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          {pendingBranchSelection?.title ||
            t('Please select the flow that you want to proceed with.')}
        </Typography>
        <Stack spacing={1.5}>
          {pendingBranchSelection?.replies.map((reply) => (
            <Button
              key={reply.value}
              fullWidth
              variant="outlined"
              onClick={() => onSelectReply(reply.value)}
              sx={{
                justifyContent: 'flex-start',
                py: 1.5,
                px: 2,
                textAlign: 'left',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                },
              }}
            >
              {reply.display}
            </Button>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} color="inherit">
          {t('Cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
