class ToastServiceClass {
    private showHandler: ((message: string, duration?: number) => void) | null = null;
  
    registerShowHandler(handler: (message: string, duration?: number) => void) {
      this.showHandler = handler;
    }
  
    show(message: string, duration?: number) {
      if (this.showHandler) {
        this.showHandler(message, duration);
      } else {
        console.warn('ToastService: ToastProvider is not mounted.');
      }
    }
  }
  
  export const ToastService = new ToastServiceClass();