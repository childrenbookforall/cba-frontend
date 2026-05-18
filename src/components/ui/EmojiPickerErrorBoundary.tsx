import { Component, type ReactNode } from 'react'

export default class EmojiPickerErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <span className="text-xs text-muted p-2">Emoji picker unavailable</span>
    return this.props.children
  }
}
