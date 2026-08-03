import React from 'react';
import { useTranslation } from 'react-i18next';
import { Panel } from '@xyflow/react';
import { Box, Button } from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { Save, Plus, Sparkles, Settings } from 'lucide-react';

interface FlowToolbarProps {
  isMobile: boolean;
  isLoading: boolean;
  onLayout: () => void;
  onExecute: () => void;
  onOpenRules: () => void;
  onCreateNode: () => void;
  onSave: () => void;
  mode?: 'main' | 'popup';
}

/**
 * Toolbar panel for the graph editor.
 * Renders a mobile bottom bar or desktop top-right toolbar based on screen size.
 */
const FlowToolbar = ({
  isMobile,
  isLoading,
  onLayout,
  onExecute,
  onOpenRules,
  onCreateNode,
  onSave,
  mode = 'main',
}: FlowToolbarProps) => {
  const { t } = useTranslation();

  if (isMobile) {
    return (
      <Panel position="bottom-center">
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            bgcolor: 'white',
            p: 1.5,
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
            width: '100%',
            justifyContent: 'center',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          {mode === 'popup' ? (
            <Button
              variant="outlined"
              onClick={onLayout}
              startIcon={<GpsFixedIcon />}
              sx={{
                bgcolor: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                flex: 1,
                py: 1,
                fontSize: '0.8rem',
              }}
            >
              {t('Auto Layout')}
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={onExecute}
                disabled={isLoading}
                startIcon={<Sparkles size={16} />}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  flex: 1,
                  py: 1,
                  fontSize: '0.8rem',
                  bgcolor: 'white',
                }}
              >
                {isLoading ? t('Executing...') : t('Two-step execution')}
              </Button>
              <Button
                variant="outlined"
                onClick={onOpenRules}
                startIcon={<Settings size={16} />}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  flex: 1,
                  py: 1,
                  fontSize: '0.8rem',
                  bgcolor: 'white',
                }}
              >
                {t('Rules')}
              </Button>
              <Button
                variant="contained"
                disableElevation
                onClick={onSave}
                startIcon={<Save size={18} />}
                sx={{
                  bgcolor: '#4f46e5',
                  borderRadius: '12px',
                  textTransform: 'none',
                  flex: 1,
                  py: 1,
                }}
              >
                {t('Save')}
              </Button>
            </>
          )}
        </Box>
      </Panel>
    );
  }

  return (
    <Panel position="top-right" style={{ paddingRight: '24px' }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onLayout}
          startIcon={<GpsFixedIcon />}
          sx={{
            bgcolor: 'white',
            borderRadius: '8px',
            textTransform: 'none',
            px: 2,
          }}
        >
          {t('Auto Layout')}
        </Button>
        {mode !== 'popup' && (
          <>
            <Button
              variant="outlined"
              onClick={onExecute}
              disabled={isLoading}
              startIcon={<Sparkles size={18} />}
              sx={{
                bgcolor: 'white',
                borderRadius: '8px',
                textTransform: 'none',
                px: 2,
              }}
            >
              {isLoading
                ? t('Executing...')
                : t('Two-step LLM Mapping Execution')}
            </Button>
            <Button
              variant="outlined"
              onClick={onOpenRules}
              startIcon={<Settings size={18} />}
              sx={{
                bgcolor: 'white',
                borderRadius: '8px',
                textTransform: 'none',
                px: 2,
              }}
            >
              {t('Mapping Rule Definitions')}
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={onSave}
              sx={{
                bgcolor: '#4f46e5',
                borderRadius: '8px',
                textTransform: 'none',
                px: 3,
                '&:hover': { bgcolor: '#4338ca' },
              }}
            >
              {isLoading ? t('Saving...') : t('Save')}
            </Button>
          </>
        )}
      </Box>
    </Panel>
  );
};

export default React.memo(FlowToolbar);
