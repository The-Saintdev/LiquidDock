// win32-desktop.js — pin a window to the Windows desktop "wallpaper" layer
// (behind normal windows) using the classic Progman/WorkerW trick, via koffi
// (a prebuilt FFI, so no native compiler is needed).
//
// On 64-bit Windows there is a single calling convention, so we don't specify
// __stdcall. All HWNDs are handled as uintptr_t (BigInt in JS).

const koffi = require('koffi');
const user32 = koffi.load('user32.dll');

const FindWindow = user32.func('FindWindowW', 'uintptr_t', ['str16', 'str16']);
const FindWindowEx = user32.func('FindWindowExW', 'uintptr_t', ['uintptr_t', 'uintptr_t', 'str16', 'str16']);
const SendMessageTimeout = user32.func('SendMessageTimeoutW', 'intptr_t',
  ['uintptr_t', 'uint', 'uintptr_t', 'intptr_t', 'uint', 'uint', 'uintptr_t']);
const SetParent = user32.func('SetParent', 'uintptr_t', ['uintptr_t', 'uintptr_t']);

const EnumWindowsProc = koffi.proto('bool EnumWindowsProc(uintptr_t hwnd, intptr_t lParam)');
const EnumWindows = user32.func('EnumWindows', 'bool', [koffi.pointer(EnumWindowsProc), 'intptr_t']);

const isNull = (h) => h === null || h === undefined || BigInt(h) === 0n;
const hex = (h) => (isNull(h) ? '0' : '0x' + BigInt(h).toString(16));

// Find the correct window to parent into so our content renders on the desktop,
// behind normal app windows. Handles both layouts:
//   - Win10 / some Win11: SHELLDLL_DefView sits under a WorkerW  -> use that WorkerW's sibling
//   - Win11 26200 (this machine): DefView sits under Progman     -> use Progman
function desktopParent() {
  const progman = FindWindow('Progman', null);
  // 0x052C nudges Progman to fork the WorkerW/desktop-icon pair (no-op if already done).
  SendMessageTimeout(progman, 0x052c, 0, 0, 0x0000 /* SMTO_NORMAL */, 1000, 0);

  let workerw = 0n;
  const proc = koffi.register((hwnd) => {
    const defView = FindWindowEx(hwnd, 0, 'SHELLDLL_DefView', null);
    if (!isNull(defView)) workerw = FindWindowEx(0, hwnd, 'WorkerW', null);
    return true;
  }, koffi.pointer(EnumWindowsProc));
  EnumWindows(proc, 0);
  koffi.unregister(proc);

  if (!isNull(workerw)) return { parent: workerw, progman, kind: 'workerw' };

  // Win11 path: icons are hosted directly by Progman.
  const defUnderProgman = FindWindowEx(progman, 0, 'SHELLDLL_DefView', null);
  return {
    parent: progman,
    progman,
    kind: isNull(defUnderProgman) ? 'progman-fallback' : 'progman',
  };
}

// Diagnostic: report the chosen parent without touching any window.
function probe() {
  const { parent, progman, kind } = desktopParent();
  return { progman: hex(progman), parent: hex(parent), kind, ok: !isNull(parent) };
}

// Pin the given HWND (BigInt) into the desktop layer.
function pinToDesktop(hwnd) {
  const { parent, kind } = desktopParent();
  const res = SetParent(BigInt(hwnd), parent);
  return { parent: hex(parent), kind, setParentResult: hex(res), ok: !isNull(res) };
}

module.exports = { probe, pinToDesktop, desktopParent };
