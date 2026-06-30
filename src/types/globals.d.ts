interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

interface GoatCounter {
  count(vars?: { path?: string; title?: string; referrer?: string; event?: boolean }): void
  bind_events(): void
  get_query(name: string): string | undefined
  url(vars?: { path?: string; title?: string; referrer?: string; event?: boolean }): string
}

interface Window {
  goatcounter?: GoatCounter
}
