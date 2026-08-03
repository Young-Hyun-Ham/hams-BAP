import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Dialog, DialogContent, Typography } from '@mui/material';
import { Zap } from 'lucide-react';

interface LLMPipelineDialogProps {
  open: boolean;
  executionStep: number;
}

const STEPS = [
  { id: 1, labelKey: 'Step 1: Milvus Vector Search (L4 Candidate Inference)' },
  { id: 2, labelKey: 'Step 2: Verify Master Prompt and Enterprise Rules' },
  { id: 3, labelKey: 'Step 3: Create Cypher MERGE Query and Load Age' },
];

const LLMPipelineDialog: React.FC<LLMPipelineDialogProps> = ({
  open,
  executionStep,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          bgcolor: '#ffffff',
          color: '#0f172a',
          borderRadius: '24px',
          p: 4,
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Spinner */}
        <Box
          sx={{
            position: 'relative',
            width: 80,
            height: 80,
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '3px solid rgba(14, 165, 233, 0.1)',
              borderTopColor: '#0ea5e9',
              animation: 'llm-spin 1.2s linear infinite',
              '@keyframes llm-spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(14, 165, 233, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={24} color="#0ea5e9" fill="#0ea5e9" />
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, mb: 1, fontSize: '1.25rem', color: '#0f172a' }}
        >
          {t('Two-Step LLM Pipeline Processing')}
        </Typography>

        {/* Description */}
        <Typography
          sx={{
            color: '#475569',
            fontSize: '0.875rem',
            mb: 3,
            lineHeight: 1.5,
            px: 2,
          }}
        >
          {t(
            'This is the process of secondary mapping and structuring Cypher queries based on maritime logistics domain rules.',
          )}
        </Typography>

        {/* Steps */}
        <Box
          sx={{
            bgcolor: '#f8fafc',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            p: 2.5,
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {STEPS.map((s) => {
            const isActive = executionStep === s.id;
            const isCompleted = executionStep > s.id;

            let textColor = '#94a3b8';
            if (isActive) textColor = '#0284c7';
            else if (isCompleted) textColor = '#0369a1';

            return (
              <Box
                key={s.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: isActive || isCompleted ? 600 : 500,
                    color: textColor,
                    fontSize: '0.875rem',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {t(s.labelKey)}
                </Typography>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    flexShrink: 0,
                    bgcolor: isCompleted
                      ? '#0ea5e9'
                      : isActive
                        ? 'transparent'
                        : '#e2e8f0',
                    border: isActive ? '3.5px solid #0ea5e9' : 'none',
                    boxShadow: isActive
                      ? '0 0 6px rgba(14, 165, 233, 0.4)'
                      : 'none',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isCompleted && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#ffffff',
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(LLMPipelineDialog);
