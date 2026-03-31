Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint proccess);
}
"@

$hwnd = [Win32]::GetForegroundWindow()
$procId = 0
[Win32]::GetWindowThreadProcessId($hwnd, [ref]$procId) | Out-Null

$p = Get-Process -Id $procId -ErrorAction SilentlyContinue
if ($p) {
    if ($p.MainWindowTitle) {
        Write-Output "__APP_NAME__:$($p.MainWindowTitle)"
    } else {
        Write-Output "__APP_NAME__:$($p.ProcessName)"
    }
} else {
    Write-Output "__APP_NAME__:System"
}
