export interface PageMonitoringHandler {
  readonly name: string
  handle(...args: any[]): void
}

export interface TitleChangeHandler extends PageMonitoringHandler {
  handle(newTitle: string, oldTitle: string): void
}

export interface TimeoutHandler extends PageMonitoringHandler {
  handle(): void
}

export interface UrlChangeHandler extends PageMonitoringHandler {
  handle(newUrl: string, oldUrl: string): void
}

export interface PageMonitoringConfig {
  timeoutMs: number
  stopOnFirstTitleChange: boolean
  stopOnFirstUrlChange: boolean
  enabledHandlers: {
    titleChange: boolean
    timeout: boolean
    urlChange: boolean
  }
  handlers: {
    titleChange: TitleChangeHandler[]
    timeout: TimeoutHandler[]
    urlChange: UrlChangeHandler[]
  }
}
