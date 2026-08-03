import { Switch } from '@mui/material';
import { ICellRendererParams } from 'ag-grid-community';

export default function SwitchCellRenderer(params: ICellRendererParams) {
  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (params.context?.onRegisterChange) {
      await params.context.onRegisterChange(params.data, checked, params);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <Switch
        size="small"
        checked={params.value === 'Y' || params.value === true}
        onChange={handleChange}
        color="primary"
      />
    </div>
  );
}
