'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tab,
  Tabs,
  Chip,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
} from '@mui/material';
import { Layers as LayersIcon } from '@mui/icons-material';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';

import {
  DisplayKey,
  DisplayValue,
  FormDataJson,
  InputElement,
  type ElementType,
  type FormElement,
} from './type';
import SavedFormContentModal from './components/modals/SavedFormContentModal';
import Canvas from './components/Canvas';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import JsonPanel from './components/JsonPanel';
import {
  FORM_ELEMENT_REGISTRY,
  FORM_ELEMENT_TYPES,
} from './stores/elementRegistry';
import { useFormEditorStore } from './stores/useFormEditorStore';
import { useModal } from '@/providers/ModalProvider';

const createId = (type: string) =>
  `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createFormId = () => createId('form');

const isElementType = (value: unknown): value is ElementType =>
  typeof value === 'string' &&
  FORM_ELEMENT_TYPES.includes(value as ElementType);

const normalizeDisplayValues = (
  value: unknown,
  fallback: DisplayValue[],
): DisplayValue[] => {
  if (!Array.isArray(value)) return fallback;

  const displayValues = value
    .map((item) => {
      if (typeof item === 'string') {
        return {
          value: item,
          label: item,
        };
      }

      if (!item || typeof item !== 'object') return null;

      const displayValue = item as Partial<DisplayValue>;
      if (!displayValue.value) return null;

      return {
        value: String(displayValue.value),
        label: displayValue.label
          ? String(displayValue.label)
          : String(displayValue.value),
      };
    })
    .filter((item): item is DisplayValue => Boolean(item));

  return displayValues.length ? displayValues : fallback;
};

const normalizeElement = (value: unknown): FormElement | null => {
  if (!value || typeof value !== 'object') return null;

  const element = value as Partial<FormElement> & Record<string, unknown>;
  if (!isElementType(element.type)) return null;

  const base = {
    id: typeof element.id === 'string' ? element.id : createId(element.type),
    name: typeof element.name === 'string' ? element.name : '',
    label: typeof element.label === 'string' ? element.label : '',
  };

  switch (element.type) {
    case 'input':
      return {
        ...base,
        type: 'input',
        validation: {
          type:
            element.validation &&
            typeof element.validation === 'object' &&
            'type' in element.validation &&
            ['text', 'email', 'number', 'custom'].includes(
              String(element.validation.type),
            )
              ? (element.validation.type as InputElement['validation']['type'])
              : 'text',
        },
        placeholder:
          typeof element.placeholder === 'string' ? element.placeholder : '',
        defaultValue:
          typeof element.defaultValue === 'string' ? element.defaultValue : '',
      };
    case 'date':
      return {
        ...base,
        type: 'date',
        defaultValue:
          typeof element.defaultValue === 'string' ? element.defaultValue : '',
      };
    case 'checkbox':
      return {
        ...base,
        type: 'checkbox',
        options: normalizeDisplayValues(element.options, [
          { value: 'Option 1', label: 'Option 1' },
          { value: 'Option 2', label: 'Option 2' },
        ]),
        defaultValue: Array.isArray(element.defaultValue)
          ? element.defaultValue.map(String)
          : [],
      };
    case 'dropbox':
      return {
        ...base,
        type: 'dropbox',
        options: normalizeDisplayValues(element.options, [
          { value: 'Option 1', label: 'Option 1' },
          { value: 'Option 2', label: 'Option 2' },
        ]),
        optionsSlot:
          typeof element.optionsSlot === 'string' ? element.optionsSlot : '',
        defaultValue:
          typeof element.defaultValue === 'string' ? element.defaultValue : '',
      };
    case 'grid': {
      const rows =
        typeof element.rows === 'number' && element.rows > 0 ? element.rows : 2;
      const columns =
        typeof element.columns === 'number' && element.columns > 0
          ? element.columns
          : 2;

      return {
        ...base,
        type: 'grid',
        rows,
        columns,
        data: Array.from({ length: rows * columns }, (_, index) =>
          Array.isArray(element.data) && element.data[index] != null
            ? String(element.data[index])
            : '',
        ),
        displayKeys: Array.isArray(element.displayKeys)
          ? element.displayKeys
              .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const displayKey = item as Partial<DisplayKey>;
                if (!displayKey.key) return null;
                return {
                  key: String(displayKey.key),
                  label: displayKey.label
                    ? String(displayKey.label)
                    : String(displayKey.key),
                };
              })
              .filter((item): item is DisplayKey => Boolean(item))
          : [],
        optionsSlot:
          typeof element.optionsSlot === 'string' ? element.optionsSlot : '',
      };
    }
    default:
      return null;
  }
};

function ScenarioFormBuilder() {
  const { showConfirm } = useModal();
  const [activeTab, setActiveTab] = useState(0);
  const [dataSource, setDataSource] = useState('');
  const [dataSourceType, setDataSourceType] = useState<'json' | 'api'>('json');
  const [enableExcelUpload, setEnableExcelUpload] = useState(false);
  const [elementFormId, setElementFormId] = useState(createFormId);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);
  const [isElementDialogOpen, setIsElementDialogOpen] = useState(false);
  const [isElementManagementDialogOpen, setIsElementManagementDialogOpen] =
    useState(false);
  const [isSavedContentModalOpen, setIsSavedContentModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const formId = useFormEditorStore((state) => state.formId);
  const setFormId = useFormEditorStore((state) => state.setFormId);
  const formTitle = useFormEditorStore((state) => state.title);
  const elements = useFormEditorStore((state) => state.elements);
  const selectedId = useFormEditorStore((state) => state.selectedElementId);
  const selectElement = useFormEditorStore((state) => state.selectElement);
  const addElement = useFormEditorStore((state) => state.addElement);
  const moveElement = useFormEditorStore((state) => state.moveElement);
  const replaceForm = useFormEditorStore((state) => state.replaceForm);
  const resetForm = useFormEditorStore((state) => state.resetForm);
  const saveForm = useFormEditorStore((state) => state.saveForm);

  // ===========================================================================
  // Load element types from API
  const elementTypes = useFormEditorStore((state) => state.elementTypes);
  const elementTypesLoading = useFormEditorStore(
    (state) => state.elementTypesLoading,
  );
  const elementTypesError = useFormEditorStore(
    (state) => state.elementTypesError,
  );
  const loadElementTypes = useFormEditorStore(
    (state) => state.loadElementTypes,
  );

  useEffect(() => {
    void loadElementTypes();
  }, [loadElementTypes]);

  const availableElementTypes = useMemo(
    () =>
      elementTypes
        .map((item) => item.type_cd)
        .filter((type): type is ElementType => isElementType(type)),
    [elementTypes],
  );

  const formElementTypesJson = useFormEditorStore(
    (state) => state.formElementTypesJson,
  );
  const setFormElementTypesJson = useFormEditorStore(
    (state) => state.setFormElementTypesJson,
  );
  // ===========================================================================

  const handleResetForm = () => {
    resetForm();
    setElementFormId(createFormId());
    setDataSource('');
    setDataSourceType('json');
    setEnableExcelUpload(false);
    setJsonText('');
    setJsonError('');
  };

  const formJson = useMemo<FormDataJson>(
    () => ({
      id: elementFormId,
      data: {
        id: elementFormId,
        title: formTitle,
        elements,
        dataSource,
        dataSourceType,
        enableExcelUpload,
      },
      type: 'form',
      width: 320,
      height: 597,
      dragging: false,
      selected: false,
    }),
    [
      dataSource,
      dataSourceType,
      elements,
      enableExcelUpload,
      elementFormId,
      formTitle,
    ],
  );

  const openJsonTab = () => {
    setJsonText(JSON.stringify(formJson, null, 2));
    setJsonError('');
  };

  const applyJsonText = (value: string) => {
    setJsonText(value);

    try {
      const parsed = JSON.parse(value) as Partial<FormDataJson>;
      const parsedData = parsed.data;

      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('data object is required.');
      }

      const nextElements = Array.isArray(parsedData.elements)
        ? parsedData.elements
            .map((element) => normalizeElement(element))
            .filter((element): element is FormElement => Boolean(element))
        : [];

      const nextFormId =
        typeof parsedData.id === 'string'
          ? parsedData.id
          : typeof parsed.id === 'string'
            ? parsed.id
            : elementFormId;

      setElementFormId(nextFormId);
      replaceForm({
        id: nextFormId,
        title:
          typeof parsedData.title === 'string' ? parsedData.title : formTitle,
        elements: nextElements,
      });
      setDataSource(
        typeof parsedData.dataSource === 'string' ? parsedData.dataSource : '',
      );
      setDataSourceType(parsedData.dataSourceType === 'api' ? 'api' : 'json');
      setEnableExcelUpload(Boolean(parsedData.enableExcelUpload));
      setJsonError('');
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  };

  const addComponent = (type: ElementType) => {
    addElement(type);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const type = event.dataTransfer.getData(
      'application/x-form-component',
    ) as ElementType;
    setIsDragOver(false);

    if (availableElementTypes.includes(type)) {
      addComponent(type);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const handleElementDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    moveElement(String(active.id), String(over.id));
  };

  const isFullFormData = (obj: Partial<FormDataJson>): obj is FormDataJson => {
    return (
      obj !== null &&
      typeof obj === 'object' &&
      'data' in obj &&
      obj.data !== undefined &&
      'id' in obj.data
    );
  };

  const loadFormJson = (id: string, nextFormJson: Partial<FormDataJson>) => {
    if (!nextFormJson || typeof nextFormJson !== 'object') return;

    if (isFullFormData(nextFormJson)) {
      setElementFormId(nextFormJson.data.id);
      setFormId(id);
      replaceForm({
        id: nextFormJson.data.id,
        title: nextFormJson.data.title,
        elements: Array.isArray(nextFormJson.data.elements)
          ? nextFormJson.data.elements
              .map((element) => normalizeElement(element))
              .filter((element): element is FormElement => Boolean(element))
          : [],
      });
      setDataSource(nextFormJson.data.dataSource ?? '');
      setDataSourceType(nextFormJson.data.dataSourceType ?? 'json');
      setEnableExcelUpload(nextFormJson.data.enableExcelUpload ?? false);
    } else {
      setElementFormId(createFormId);
      setFormId(null);
      replaceForm({
        id: createFormId(),
        title: 'new form',
        elements: [],
      });
      setDataSource('');
      setDataSourceType('json');
      setEnableExcelUpload(false);
    }
    setJsonText(JSON.stringify(nextFormJson, null, 2));
    setJsonError('');
  };

  async function saveFormBuilder() {
    const confirmed = await showConfirm('Do you want to save the Form?',);
    if (!confirmed) return;

    await saveForm(formJson);
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      sx={{ minHeight: 0, bgcolor: 'background.default' }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: '64px !important' }}>
          <LayersIcon
            sx={{ color: 'primary.main', fontSize: 28 }}
            onClick={() => setIsElementManagementDialogOpen(true)}
          />
          <Typography variant="h6" fontWeight={700} sx={{ mr: 0.5 }}>
            Form Builder
          </Typography>
          <Chip
            label="v0.1"
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />

          <Tabs
            value={activeTab}
            onChange={(_, v) => {
              if (v === 1) openJsonTab();
              setActiveTab(v);
            }}
            sx={{
              ml: 4,
              flex: 1,
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              },
            }}
          >
            <Tab label="Preview" />
            <Tab label="JSON" />
          </Tabs>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={() => setIsSavedContentModalOpen(true)}
            sx={{ borderColor: 'divider' }}
          >
            Get Saved Content
          </Button>
          <Button
            variant="contained"
            size="small"
            disableElevation
            onClick={saveFormBuilder}
          >
            Save Form
          </Button>
        </Toolbar>
      </AppBar>

      {activeTab === 0 ? (
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Box
            sx={{
              width: 260,
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <LeftPanel
              addComponent={addComponent}
              elementTypes={availableElementTypes}
              loading={elementTypesLoading}
              error={elementTypesError}
            />
          </Box>

          <Canvas
            elements={elements}
            selectedId={selectedId}
            setSelectedId={selectElement}
            setIsElementDialogOpen={setIsElementDialogOpen}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            handleDrop={handleDrop}
            handleElementDragEnd={handleElementDragEnd}
            sensors={sensors}
          />

          <Box
            sx={{
              width: 340,
              bgcolor: 'background.paper',
              borderLeft: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <RightPanel
              setIsJsonDialogOpen={setIsJsonDialogOpen}
              onResetForm={handleResetForm}
            />
          </Box>
        </Box>
      ) : (
        <JsonPanel
          jsonText={jsonText}
          applyJsonText={applyJsonText}
          jsonError={jsonError}
        />
      )}

      <Dialog
        open={isJsonDialogOpen}
        onClose={() => setIsJsonDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Form JSON</DialogTitle>
        <DialogContent dividers>
          <Paper
            variant="outlined"
            sx={{
              bgcolor: '#f6f8fa',
              borderColor: 'grey.300',
              borderRadius: 1,
              p: 1.5,
              overflow: 'auto',
              maxHeight: '70vh',
            }}
          >
            <Box
              component="pre"
              sx={{
                m: 0,
                fontSize: 12,
                fontFamily: 'monospace',
                whiteSpace: 'pre',
                minWidth: 720,
              }}
            >
              {JSON.stringify(formJson, null, 2)}
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsJsonDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isElementDialogOpen}
        onClose={() => setIsElementDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Element 선택</DialogTitle>
        <DialogContent dividers>
          <List
            disablePadding
            sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            {availableElementTypes.map((type) => {
              const comp = FORM_ELEMENT_REGISTRY[type];

              return (
                <ListItemButton
                  key={type}
                  onClick={() => {
                    addComponent(type);
                    setIsElementDialogOpen(false);
                  }}
                  sx={{
                    border: 1,
                    borderColor: 'primary.light',
                    borderRadius: 1,
                    color: 'primary.main',
                    py: 1,
                    '&:hover': { bgcolor: 'primary.50' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                    {comp.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={comp.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsElementDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isElementManagementDialogOpen}
        onClose={() => setIsElementManagementDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Element 표시설정 [관리자용]</DialogTitle>
        <DialogContent dividers>
          <List
            disablePadding
            sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            {formElementTypesJson
              .filter((item) => item.del_yn !== 'Y')
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((item) => {
                const type = item.type_cd;
                const comp = FORM_ELEMENT_REGISTRY[type];

                return (
                  <Box
                    key={type}
                    sx={{
                      border: 1,
                      borderColor: 'primary.light',
                      borderRadius: 1,
                      color: 'primary.main',
                      py: 1,
                      px: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                      {comp.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={comp.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    />
                    <Checkbox
                      size="small"
                      checked={item.visible}
                      onChange={(_, checked) => {
                        const updatedElementTypes = formElementTypesJson.map(
                          (elementType) =>
                            elementType.type_cd === item.type_cd
                              ? { ...elementType, visible: checked }
                              : elementType,
                        );

                        setFormElementTypesJson(updatedElementTypes);
                        void loadElementTypes();
                      }}
                      sx={{ p: 0.5, flexShrink: 0 }}
                    />
                  </Box>
                );
              })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsElementManagementDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <SavedFormContentModal
        isOpen={isSavedContentModalOpen}
        onClose={() => setIsSavedContentModalOpen(false)}
        onSelect={loadFormJson}
      />
    </Box>
  );
}

export default ScenarioFormBuilder;
