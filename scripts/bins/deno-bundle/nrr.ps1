$ScriptArgs = $args
$RootDir = (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
if (-not (Test-Path "$RootDir\.build-bundle\nrr.js")) {
  & {
    Set-Location "$RootDir"
    pnpm nrz-build --bins=nrr --outdir=".build-bundle" bundle > $null 2>&1
  }
}
& {
  deno -A "$RootDir\.build-bundle\nrr.js" @ScriptArgs
}
