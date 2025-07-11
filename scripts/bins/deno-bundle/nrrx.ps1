$ScriptArgs = $args
$RootDir = (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
if (-not (Test-Path "$RootDir\.build-bundle\nrrx.js")) {
  & {
    Set-Location "$RootDir"
    pnpm nrz-build --bins=nrrx --outdir=".build-bundle" bundle > $null 2>&1
  }
}
& {
  deno -A "$RootDir\.build-bundle\nrrx.js" @ScriptArgs
}
