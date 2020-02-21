declare var window: any;
declare var globalThis: any;
declare var global: any;

export const TypeError: TypeErrorConstructor = (function () {
  try { const x = this.TypeError; if (x) return x; } catch (e) { };
  try { const x = globalThis.TypeError; if (x) return x; } catch (e) { };
  try { const x = global.TypeError; if (x) return x; } catch (e) { };
  try { const x = window.TypeError; if (x) return x; } catch (e) { };
  try { const x = (0, eval)("this").TypeError; if (x) return x; } catch (e) { };

  return class TypeError extends Error { };
})();
