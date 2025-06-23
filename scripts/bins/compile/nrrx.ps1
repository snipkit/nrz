$ScriptArgs = $args
$RootDir = (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
if (-not (Test-Path "$RootDir\.build-compile\nrrx.exe")) {
  & {
    Set-Location "$RootDir"
    pnpm nrz-build --bins=nrrx --outdir=".build-compile" compile > $null 2>&1
  }
}
& {
  & "$RootDir\.build-compile\nrrx.exe" @ScriptArgs
}
