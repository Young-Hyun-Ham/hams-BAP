interface MasterCodeRes {
  intg_cd_id: string;
  intg_cd_nm?: string;
  intg_cd_des?: string;
  cre_dt?: string;
  upd_dt?: string;
  use_yn?: string;
  flag?: string;
  del_yn?: string;
}

interface DetailCodeRes {
  intg_cd_id?: string;
  intg_cd_val_cntn: string;
  intg_cd_val_cntn_new?: string;
  intg_cd_val_des?: string;
  intg_cd_val_dsp_seq: number;
  flag?: string;
  delYn?: string;
}

interface SubDetailCodeRes {
  intg_cd_val_sub_cntn: string;
  intg_cd_val_sub_cntn_new?: string;
  intg_cd_val_sub_des: string;
  intg_cd_val_sub_dsp_seq?: number;
  flag?: string;
  delYn?: string;
}

interface FilterState {
  masterCodeId: string;
  masterCodeName: string;
  masterCodeStatus: string;
  masterCodeDescription: string;
}

interface Option {
  label: string;
  value: string;
  code?: string;
}

interface MasterCodeRow {
  id?: string;
  masterCodeId: string;
  masterCodeName: string;
  description: string;
  status: 'Y' | 'N';
  createdDate: string;
  _isNew?: boolean;
  _isEdit?: boolean;
}

interface DetailCodeRow {
  id?: string;
  masterCodeId: string;
  detailCodeId: string;
  newDetailCodeId: string;
  detailCodeName: string;
  sortOrder: number;
  status?: string;
  _isNew?: boolean;
  _isEdit?: boolean;
}

interface SubDetailCodeRow {
  id: string;
  masterCodeId: string;
  detailCodeId: string;
  subCodeId: string;
  newSubCodeId: string;
  subCodeName: string;
  sortOrder: number;
  _isNew?: boolean;
  _isEdit?: boolean;
}

interface MasterData {
  codes: Option[];
  sub_codes: Record<string, Option[]>;
}
interface CommonUdcInput {
  bizType?: string | null;
  bizKey: string | null;
  bizModule?: string | null;

  biz01?: string | null;
  biz02?: string | null;
  biz03?: string | null;
  biz04?: string | null;
  biz05?: string | null;
  biz06?: string | null;
  biz07?: string | null;
  biz08?: string | null;
  biz09?: string | null;
  biz10?: string | null;

  obj01?: string | null;
  obj02?: string | null;
  obj03?: string | null;
  obj04?: string | null;
  obj05?: string | null;
  obj06?: string | null;
  obj07?: string | null;
  obj08?: string | null;
  obj09?: string | null;
  obj10?: string | null;
}

interface CommonUdcOutput {
  value01: string;
  value02: string;
  value03: string;
  value04?: string | null;
  value05?: string | null;
  value06?: string | null;
  value07?: string | null;
  value08?: string | null;
  value09?: string | null;
  value10?: string | null;
  success_yn?: string | null;
  value11?: string | null;
  value12?: string | null;
  value13?: string | null;
  value14?: string | null;
  value15?: string | null;
  value16?: string | null;
  value17?: string | null;
  value18?: string | null;
  value19?: string | null;
  value20?: string | null;
  value21?: string | null;
  value22?: string | null;
  value23?: string | null;
  value24?: string | null;
  value25?: string | null;
  value26?: string | null;
  value27?: string | null;
  value28?: string | null;
  value29?: string | null;
  value30?: string | null;
}

export type {
  FilterState,
  Option,
  MasterCodeRes,
  DetailCodeRes,
  SubDetailCodeRes,
  MasterCodeRow,
  DetailCodeRow,
  SubDetailCodeRow,
  MasterData,
  CommonUdcInput,
  CommonUdcOutput,
};
