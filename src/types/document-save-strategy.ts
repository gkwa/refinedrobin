export interface DocumentSaveStrategy {
  save(): Promise<void>
  isAvailable(): boolean
  getName(): string
}
