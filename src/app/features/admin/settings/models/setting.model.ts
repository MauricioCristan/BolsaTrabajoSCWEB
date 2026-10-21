export interface SettingDTO {
  key: string;
  value: string;
  description: string | null;
  editable: boolean;
}

export interface SettingUpdatePayload {
  values: Record<string, string>;
}

