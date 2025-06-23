$ScriptArgs = $args
$RootDir = (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
if (-not (Test-Path "$RootDir\.build-compile\nrz.exe")) {
  & {
    Set-Location "$RootDir"
    pnpm nrz-build --bins=nrz --outdir=".build-compile" compile > $null 2>&1
  }
}
& {
  & "$RootDir\.build-compile\nrz.exe" @ScriptArgs
}
