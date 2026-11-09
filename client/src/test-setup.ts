// jsdom has no ResizeObserver, which AdminPageHeader uses.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;

// jsdom has <dialog> but not showModal() and close(), which the drawers and ConfirmDialog use.
// Like the browser, close() sends a close event. Set here once, so no spec file replaces them
// with versions that behave differently.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false;
  this.dispatchEvent(new Event('close'));
};
