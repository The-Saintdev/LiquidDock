' Launch LiquidLaunch silently (no console window).
' Double-click this, pin it, or drop a shortcut to it in shell:startup.
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
exe = appDir & "\node_modules\electron\dist\electron.exe"
Set ws = CreateObject("WScript.Shell")
ws.CurrentDirectory = appDir
ws.Run """" & exe & """ """ & appDir & """", 0, False
