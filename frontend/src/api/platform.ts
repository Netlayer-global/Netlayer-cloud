import api from './client'

export interface ModuleDefinition {
  key: string
  label: string
  group: string
  default: boolean
  required: boolean
  desc: string
}

export interface PlatformModulesResponse {
  modules: Record<string, boolean>
  definitions: ModuleDefinition[]
}

export const platformAPI = {
  getModules: () =>
    api.get<{ data: PlatformModulesResponse }>('/platform/modules').then((r) => r.data.data),
}
