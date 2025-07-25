import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import vercel from '@astrojs/vercel'
import { ExpressiveCodeTheme } from '@astrojs/starlight/expressive-code'
import * as TypedocPlugin from './src/plugins/typedoc.ts'
import { readFileSync } from 'node:fs'
import starlightLinksValidator from 'starlight-links-validator'

if (process.env.CI && process.env.RUNNER_OS === 'Windows') {
  console.log(
    'Skipping astro in CI on Windows because it only needs to be run for linting but not tests',
  )
  process.exit(0)
}

const MIXPANEL_TOKEN = '7853b372fb0f20e238be6d11e53f60fe'

export default defineConfig({
  site: 'https://docs.nrz.sh',
  trailingSlash: 'never',
  integrations: [
    starlight({
      head: [
        {
          tag: 'script',
          content:
            '(function (f, b) { if (!b.__SV) { var e, g, i, h; window.mixpanel = b; b._i = []; b.init = function (e, f, c) { function g(a, d) { var b = d.split("."); 2 == b.length && ((a = a[b[0]]), (d = b[1])); a[d] = function () { a.push([d].concat(Array.prototype.slice.call(arguments, 0))); }; } var a = b; "undefined" !== typeof c ? (a = b[c] = []) : (c = "mixpanel"); a.people = a.people || []; a.toString = function (a) { var d = "mixpanel"; "mixpanel" !== c && (d += "." + c); a || (d += " (stub)"); return d; }; a.people.toString = function () { return a.toString(1) + ".people (stub)"; }; i = "disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split( " "); for (h = 0; h < i.length; h++) g(a, i[h]); var j = "set set_once union unset remove delete".split(" "); a.get_group = function () { function b(c) { d[c] = function () { call2_args = arguments; call2 = [c].concat(Array.prototype.slice.call(call2_args, 0)); a.push([e, call2]); }; } for ( var d = {}, e = ["get_group"].concat( Array.prototype.slice.call(arguments, 0)), c = 0; c < j.length; c++) b(j[c]); return d; }; b._i.push([e, f, c]); }; b.__SV = 1.2; e = f.createElement("script"); e.type = "text/javascript"; e.async = !0; e.src = "undefined" !== typeof MIXPANEL_CUSTOM_LIB_URL ? MIXPANEL_CUSTOM_LIB_URL : "file:" === f.location.protocol && "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//) ? "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js" : "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"; g = f.getElementsByTagName("script")[0]; g.parentNode.insertBefore(e, g); } })(document, window.mixpanel || []);',
        },
        {
          tag: 'script',
          // We use autocapture everywhere else but I think we need track_pageview here because its not a SPA
          content: `mixpanel.init("${MIXPANEL_TOKEN}", { autocapture: true, track_pageview: true });`,
        },
      ],
      expressiveCode: {
        themes: [
          ExpressiveCodeTheme.fromJSONString(
            readFileSync(
              `./src/styles/custom-syntax-theme.json`,
              'utf-8',
            ),
          ),
        ],
        styleOverrides: {
          frames: {
            terminalTitlebarDotsForeground: '#FFFFFF',
            terminalTitlebarDotsOpacity: '0.3',
          },
        },
        defaultProps: {
          wrap: true,
          preserveIndent: true,
        },
      },
      title: 'nrz /vōlt/',
      social: {
        linkedin: 'https://www.linkedin.com/company/nrz',
        twitter: 'https://twitter.com/nrz',
        github: 'https://github.com/khulnasoft-lab/nrz',
        discord: 'https://discord.gg/nrz',
      },
      components: {
        PageFrame: './src/components/page-frame/page-frame.astro',
        ContentPanel:
          './src/components/content-panel/content-panel.astro',
        PageTitle: './src/components/page-title/page-title.astro',
        Pagination: './src/components/pagination/pagination.astro',
        PageSidebar:
          './src/components/page-sidebar/page-sidebar.astro',
        TwoColumnContent:
          './src/components/two-column-layout/two-column-layout.astro',
        Footer: './src/components/footer/footer.astro',
        ThemeProvider:
          './src/components/theme-provider/theme-provider.astro',
      },
      customCss: ['./src/styles/globals.css'],
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 5,
      },
      plugins: [TypedocPlugin.plugin, starlightLinksValidator()],
      sidebar: [
        {
          label: 'CLI',
          collapsed: false,
          autogenerate: { directory: 'cli' },
        },
        {
          label: 'Packages',
          collapsed: true,
          autogenerate: { directory: TypedocPlugin.directory },
        },
      ],
    }),
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  output: 'static',
  adapter: vercel(),
})
