// Diagnostic: dump the desktop window tree so we can find the right layer.
const koffi = require('koffi');
const user32 = koffi.load('user32.dll');

const FindWindow = user32.func('FindWindowW', 'uintptr_t', ['str16', 'str16']);
const FindWindowEx = user32.func('FindWindowExW', 'uintptr_t', ['uintptr_t', 'uintptr_t', 'str16', 'str16']);
const SendMessageTimeout = user32.func('SendMessageTimeoutW', 'intptr_t',
  ['uintptr_t', 'uint', 'uintptr_t', 'intptr_t', 'uint', 'uint', 'uintptr_t']);
const GetClassName = user32.func('GetClassNameW', 'int', ['uintptr_t', 'char16_t*', 'int']);
const EnumWindowsProc = koffi.proto('bool EnumWindowsProc(uintptr_t hwnd, intptr_t lParam)');
const EnumWindows = user32.func('EnumWindows', 'bool', [koffi.pointer(EnumWindowsProc), 'intptr_t']);

const isNull = (h) => h === null || h === undefined || BigInt(h) === 0n;
const hex = (h) => (isNull(h) ? '0' : '0x' + BigInt(h).toString(16));
function className(h) {
  const buf = Buffer.alloc(256 * 2);
  const n = GetClassName(BigInt(h), buf, 256);
  return buf.toString('utf16le', 0, n * 2);
}

const progman = FindWindow('Progman', null);
console.log('Progman:', hex(progman), 'DefView-under-Progman:',
  hex(FindWindowEx(progman, 0, 'SHELLDLL_DefView', null)));

console.log('\n--- sending 0x052C to Progman ---');
SendMessageTimeout(progman, 0x052c, 0, 0, 0, 1000, 0);

const workerws = [];
const proc = koffi.register((hwnd) => {
  const cls = className(hwnd);
  if (cls === 'WorkerW' || cls === 'Progman') {
    const def = FindWindowEx(hwnd, 0, 'SHELLDLL_DefView', null);
    workerws.push({ hwnd: hex(hwnd), cls, hasDefView: !isNull(def) });
  }
  return true;
}, koffi.pointer(EnumWindowsProc));
EnumWindows(proc, 0);
koffi.unregister(proc);

console.log('\nTop-level WorkerW / Progman windows:');
for (const w of workerws) console.log(' ', w.cls, w.hwnd, 'DefView:', w.hasDefView);
console.log('\ncount:', workerws.length);
