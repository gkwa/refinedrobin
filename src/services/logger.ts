import { Logger } from "../types/extension.js"

export class ConsoleLogger implements Logger {
  private verboseLevel: number

  constructor(verboseLevel: number = 0) {
    this.verboseLevel = verboseLevel
  }

  debug(message: string): void {
    if (this.verboseLevel >= 2) {
      console.log(`[DEBUG] ${message}`)
    }
  }

  info(message: string): void {
    if (this.verboseLevel >= 1) {
      console.log(`[INFO] ${message}`)
    }
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`)
  }
}
