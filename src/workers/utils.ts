let _isModuleWorkerSupported: boolean | null = null;

/**
 * Checks whether current environment supports ES Module Workers.
 */
export function isModuleWorkerSupported(): boolean {
  if (_isModuleWorkerSupported !== null) {
    return _isModuleWorkerSupported;
  }

  try {
    // https://stackoverflow.com/a/62963963
    new Worker('blob://', {
      get type() {
        _isModuleWorkerSupported = true;
        return 'module' as const;
      },
    });
  } catch {
    // Do nothing. 'blob://' should always throw an error to prevent the
    // browser from creating an (expensive) worker. We care whether the
    // 'type' getter was called, not about the error.
  } finally {
    // If 'type' getter wasn't called, modules are unsupported.
    _isModuleWorkerSupported ||= false;
  }

  return _isModuleWorkerSupported;
}
