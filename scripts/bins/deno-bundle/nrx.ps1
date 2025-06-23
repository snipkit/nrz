$ScriptArgs = $args
$RootDir = (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
if (-not (Test-Path "$RootDir\.build-bundle\nrx.js")) {
  & {
    Set-Location "$RootDir"
    pnpm nrz-build --bins=nrx --outdir=".build-bundle" bundle > $null 2>&1
  }
}
& {
  deno -A "$RootDir\.build-bundle\nrx.js" @ScriptArgs
}
