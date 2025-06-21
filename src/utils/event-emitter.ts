class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(eventName: string, listener: Function) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  off(eventName: string, listener: Function) {
    if (!this.events[eventName]) {
      return;
    }
    this.events[eventName] = this.events[eventName].filter(l => l !== listener);
  }

  emit(eventName: string, ...args: any[]) {
    if (!this.events[eventName]) {
      return;
    }
    this.events[eventName].forEach(listener => listener(...args));
  }
}

export const eventEmitter = new EventEmitter();