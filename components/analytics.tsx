'use client'

import Script from 'next/script'

/**
 * Vercel Web Analytics, loaded WITHOUT the @vercel/analytics npm package.
 *
 * Why no package: this repo uses pnpm with a committed lockfile and Vercel runs
 * `pnpm install --frozen-lockfile`, so adding a dependency without regenerating the
 * lockfile would fail the build. Instead we inject Vercel's first-party script,
 * which is served same-origin at /_vercel/insights/script.js — also keeping it safe
 * under the COEP: require-corp header set in next.config.js.
 *
 * Auto-tracks page views. Custom events go through `track()` in src/lib/analytics.ts.
 * Requires Web Analytics to be enabled for the project in the Vercel dashboard;
 * otherwise the script 404s and nothing is collected.
 */
export default function VercelAnalytics() {
  return (
    <>
      <Script id="va-init" strategy="afterInteractive">
        {`window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};`}
      </Script>
      <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
    </>
  )
}
