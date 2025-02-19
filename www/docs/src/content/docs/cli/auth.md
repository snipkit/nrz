---
title: Authentication
sidebar:
  label: Authentication
  order: 2
---

The nrz client supports logging into multiple different
registries.

## npm Web Login

To log into a registry that supports the npm web login, such as
the public npm registry, use the `nrz login` command.

For example, to log into the default registry:

```bash
nrz login
```

To log into a custom registry that supports npm web login, run
the same command, specifying the registry to log into:

```bash
nrz login --registry=https://my-custom-registry.mycompany.local/
```

To remove your authorization to a given registry, including
attempting to destroy the token on the server side, use the `nrz
logout` command.

## Other Registries

If your registry provides a bearer token that should be presented
for authentication, it can be added using the `nrz token add`
command.

This will prompt you to paste in the token.

To remove a token from nrz's keychain, use the `nrz token rm`
command. Note that this will _not_ delete the token from the
server; it only removes it from the local keychain store.

## CI (and Other Headless Environments)

A token for the default registry can be provided in the
`NRZ_TOKEN` environment variable.

For example:

```
NRZ_TOKEN="helloworldtokendeadbeef" nrz install
```

To provide a token for other registries, replace all
non-alphanumeric characters in the registry URL with `_`, and set
the appropriate `NRZ_TOKEN_{...}` variable.

```
NRZ_TOKEN_https_my_custom_registry_mycompany_local="helloworldtokendeadbeef" nrz install
```

## OTP

One-time password (OTP) and MFA is supported for non-headless
environments by opening a web browser or prompting on the command
line for a OTP from your authenticator app, when the registry
prompts for multifactor auth.

For headless environments, an OTP token may be provided in the
`NRZ_OTP` environment variable.

## Why Environment Variables and Not Config

The nrz client is designed to make it less likely that passwords
are leaked in configuration files that might be checked into
source control, which is a surprisingly common security failure
mode.

With nrz, sensitive information is _only_ kept in a tightly
restricted keychain file, or in the environment. Of course,
perfect security is often impossible, but it is nevertheless
important to do our best to make it less likely that passwords
can be leaked by accident.

## Credential Management

Each "identity" in nrz is a set of authentication tokens for
known registries.

For example, you could have a `corp` identity with the
credentials that you use for the work on corporate projects, and
a `personal` account with your own personal npm registry login
credentials.

Running `nrz config set identity=corp` will switch into `corp`
mode. `nrz config set identity=personal` will switch into
`personal` mode.

This can also be set in a project root with a `nrz.json` config
file, to make it easier to set per project. For example, you
could have this in your `nrz.json` in the project root:

```json
{
  "identity": "corp"
}
```
