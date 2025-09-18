export type TerminologyKey = '保护屏' | '设备间隔' | '压板名称'

export interface TerminologyConfig {
  hard: TerminologyKey[]
  soft: TerminologyKey[]
}

const STORAGE_KEY = 'terminology_config'

const DEFAULT_ORDER: TerminologyKey[] = ['保护屏', '设备间隔', '压板名称']

export function getTerminologyConfig(): TerminologyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { hard: [...DEFAULT_ORDER], soft: [...DEFAULT_ORDER] }
    const parsed = JSON.parse(raw)
    return {
      hard: Array.isArray(parsed?.hard) && parsed.hard.length ? parsed.hard : [...DEFAULT_ORDER],
      soft: Array.isArray(parsed?.soft) && parsed.soft.length ? parsed.soft : [...DEFAULT_ORDER]
    }
  } catch {
    return { hard: [...DEFAULT_ORDER], soft: [...DEFAULT_ORDER] }
  }
}

export function setTerminologyConfig(cfg: TerminologyConfig) {
  const normalized: TerminologyConfig = {
    hard: (cfg.hard || []).filter(Boolean) as TerminologyKey[],
    soft: (cfg.soft || []).filter(Boolean) as TerminologyKey[]
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
}

