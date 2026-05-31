import { useEffect } from 'react'

/**
 * useSeo — lightweight, dependency-free per-page SEO.
 *
 * Sets <title>, meta description, canonical, and OG/Twitter tags on mount
 * and restores nothing (each page sets its own; SPA navigation simply
 * overwrites). Avoids pulling in react-helmet for a handful of fields.
 */
const SITE = 'NetLayer Cloud'
const ORIGIN = 'https://netlayer.cloud'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export interface SeoOptions {
  title: string
  description?: string
  /** Path beginning with "/" — used for canonical + og:url. */
  path?: string
  image?: string
  noTitleSuffix?: boolean
}

export function useSeo({ title, description, path, image, noTitleSuffix }: SeoOptions) {
  useEffect(() => {
    const fullTitle = noTitleSuffix ? title : `${title} — ${SITE}`
    document.title = fullTitle

    const url = path ? `${ORIGIN}${path}` : ORIGIN
    const img = image || `${ORIGIN}/favicon.svg`

    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', SITE)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', img)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:image', img)
    upsertLink('canonical', url)
  }, [title, description, path, image, noTitleSuffix])
}
