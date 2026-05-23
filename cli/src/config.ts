import Conf from 'conf'

interface CliConfig {
  apiUrl: string
  apiKey: string
  defaultRegion?: string
}

/**
 * Persistent CLI config — stored in the OS-conventional location
 * (~/.config/netlayer-cli on Linux, %APPDATA% on Windows). The user
 * never edits this directly; `nl login` and `nl config` write to it.
 */
export const config = new Conf<CliConfig>({
  projectName: 'netlayer-cli',
  defaults: {
    apiUrl: process.env.NETLAYER_API_URL || 'http://localhost:5000/api',
    apiKey: process.env.NETLAYER_API_KEY || '',
  },
  schema: {
    apiUrl: { type: 'string', format: 'uri' },
    apiKey: { type: 'string' },
    defaultRegion: { type: 'string' },
  },
})
