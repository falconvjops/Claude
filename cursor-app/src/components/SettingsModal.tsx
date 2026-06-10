import { useState } from 'react'
import { useStore } from '../state/store'
import { MODELS } from '../types'
import { CloseIcon } from './icons'

export function SettingsModal() {
  const { settings, updateSettings, settingsOpen, setSettingsOpen } = useStore()
  const [key, setKey] = useState(settings.apiKey)

  if (!settingsOpen) return null

  return (
    <div className="modal-backdrop" onMouseDown={() => setSettingsOpen(false)}>
      <div className="settings-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span>Settings</span>
          <button onClick={() => setSettingsOpen(false)}>
            <CloseIcon size={13} />
          </button>
        </div>

        <div className="settings-body">
          <label className="settings-field">
            <span className="settings-label">Anthropic API key</span>
            <input
              type="password"
              placeholder="sk-ant-…"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onBlur={() => updateSettings({ apiKey: key.trim() })}
            />
            <span className="settings-help">
              Stored only in this browser's localStorage. Requests go directly from your
              browser to the Anthropic API. Leave empty for demo mode.
            </span>
          </label>

          <label className="settings-field">
            <span className="settings-label">Chat model</span>
            <select
              value={settings.model}
              onChange={(e) => updateSettings({ model: e.target.value })}
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label className="settings-field row">
            <input
              type="checkbox"
              checked={settings.autocompleteEnabled}
              onChange={(e) => updateSettings({ autocompleteEnabled: e.target.checked })}
            />
            <span className="settings-label">Tab autocomplete (ghost text, uses claude-haiku-4-5)</span>
          </label>
        </div>

        <div className="settings-footer">
          <button
            className="btn-accept"
            onClick={() => {
              updateSettings({ apiKey: key.trim() })
              setSettingsOpen(false)
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
