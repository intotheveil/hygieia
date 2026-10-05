import { describe, expect, it } from 'vitest'
import { scrubText, scrubUrl, scrubContext, scrubPayload } from './scrub'
import type { RawErrorInput } from './types'

describe('scrubText — secrets are redacted (no leakage)', () => {
  it('redacts a JWT', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N'
    expect(scrubText(`token ${jwt} end`)).toBe('token [REDACTED_JWT] end')
  })

  it('redacts a PEM private key block', () => {
    const pem =
      '-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAKj\nabc\n-----END RSA PRIVATE KEY-----'
    expect(scrubText(pem)).toBe('[REDACTED_PRIVATE_KEY]')
  })

  it('redacts a truncated PEM private key (BEGIN with no END)', () => {
    const out = scrubText('-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAA\n\ntail')
    expect(out).toContain('[REDACTED_PRIVATE_KEY]')
    expect(out).not.toContain('b3BlbnNzaC1r')
    expect(out).toContain('tail')
  })

  it('redacts Authorization headers and Bearer tokens', () => {
    // (the key=value rule may re-render "Authorization:" as "Authorization="; either way
    // the credential is gone — assert the security property, not the punctuation)
    const authOut = scrubText('Authorization: Basic YWxhZGRpbjpvcGVu')
    expect(authOut).not.toContain('YWxhZGRpbjpvcGVu')
    expect(authOut).toContain('[REDACTED]')
    expect(scrubText('sent Bearer abc.DEF-123_xyz here')).toBe('sent Bearer [REDACTED] here')
  })

  it('redacts provider-prefixed keys (OpenAI/GitHub/AWS/Google/Stripe/Slack)', () => {
    expect(scrubText('key sk-abcdefghijklmnopqrstuvwx')).toBe('key [REDACTED_KEY]')
    expect(scrubText('ghp_abcdefghijklmnopqrstuvwxyz0123')).toBe('[REDACTED_KEY]')
    expect(scrubText('AKIAIOSFODNN7EXAMPLE here')).toBe('[REDACTED_KEY] here')
    expect(scrubText('AIzaSyA1234567890abcdefghijklmnopqrstuv')).toBe('[REDACTED_KEY]')
    expect(scrubText('sk_live_abcdefghij1234567890')).toBe('[REDACTED_KEY]')
    expect(scrubText('xoxb-1234567890-abcdef')).toBe('[REDACTED_KEY]')
  })

  it('redacts key=value / key:"value" assignments', () => {
    expect(scrubText('password=hunter2')).toBe('password=[REDACTED]')
    expect(scrubText('api_key: "s3cr3tValue"')).toBe('api_key=[REDACTED]')
    expect(scrubText('DB_TOKEN=abc123def')).toBe('DB_TOKEN=[REDACTED]')
  })
})

describe('scrubText — PII is redacted', () => {
  it('redacts emails, IPv4, and phone numbers', () => {
    expect(scrubText('from someone@example.com')).toBe('from [REDACTED_EMAIL]')
    expect(scrubText('host 192.168.1.100 down')).toBe('host [REDACTED_IP] down')
    expect(scrubText('call +30 210 000 0000 now')).toContain('[REDACTED_PHONE]')
  })
})

// The scrubber is DELIBERATELY conservative: it must NOT mangle the diagnostic data an
// error needs to stay debuggable. This pins that contract (see the long comment in scrub.ts).
describe('scrubText — diagnostic data is PRESERVED', () => {
  it('keeps a git SHA, a short SHA, and a UUID', () => {
    expect(scrubText('at commit 5fb378a9c1e4d2b3a6f7089e1c2d3b4a5f6e7d8c')).toBe(
      'at commit 5fb378a9c1e4d2b3a6f7089e1c2d3b4a5f6e7d8c',
    )
    expect(scrubText('id 3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBe(
      'id 3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    )
  })

  it('keeps stack-frame file:line:col and webpack chunk ids', () => {
    const frame = 'at render (src/components/Foo.tsx:128:19)'
    expect(scrubText(frame)).toBe(frame)
    const chunk = 'at fn (chunk-AbC12de.js:1024:56)'
    expect(scrubText(chunk)).toBe(chunk)
  })

  it('non-string input yields empty string; empty string stays empty', () => {
    // @ts-expect-error — defensive path for untrusted callers
    expect(scrubText(null)).toBe('')
    // @ts-expect-error — untrusted non-string input
    expect(scrubText(42)).toBe('')
    expect(scrubText('')).toBe('')
  })
})

describe('scrubUrl', () => {
  it('strips every query-string value but keeps keys and path', () => {
    const out = scrubUrl('https://ares.mil.gr/docs?token=abc123&camp=north#frag')
    expect(out).toContain('https://ares.mil.gr/docs')
    expect(out).toContain('token=[REDACTED]')
    expect(out).toContain('camp=[REDACTED]')
    expect(out).not.toContain('abc123')
    expect(out).not.toContain('north')
  })

  it('scrubs a secret embedded in the path too', () => {
    expect(scrubUrl('https://x/callback/eyJhbGciOiJIUzI1NiJ9.eyJhIjoxfQ.sig')).toContain(
      '[REDACTED_JWT]',
    )
  })
})

describe('scrubContext — strict allowlist (role/page/action only)', () => {
  it('keeps only allowed keys and drops everything else', () => {
    const out = scrubContext({
      role: 'officer',
      page: '/assets',
      action: 'edit',
      password: 'x',
      ssn: '1',
    })
    expect(out).toEqual({ role: 'officer', page: '/assets', action: 'edit' })
  })

  it('scrubs the surviving values (defense in depth)', () => {
    const out = scrubContext({ action: 'mailed someone@example.com' })
    expect(out).toEqual({ action: 'mailed [REDACTED_EMAIL]' })
  })

  it('returns null when nothing allowed remains, or input is not an object', () => {
    expect(scrubContext({ evil: 'x' })).toBeNull()
    expect(scrubContext(undefined)).toBeNull()
    expect(scrubContext({})).toBeNull()
  })
})

describe('scrubPayload — full payload, never throws', () => {
  const base: RawErrorInput = {
    product_id: 'ares',
    severity: 'error' as RawErrorInput['severity'],
    source: 'client' as RawErrorInput['source'],
    error_message: 'boom',
  }

  it('scrubs message/stack/url and allowlists context', () => {
    const out = scrubPayload({
      ...base,
      error_message: 'failed for someone@example.com',
      stack: 'at f (app.js:1:1) token sk-abcdefghijklmnopqrstuvwx',
      url: 'https://x/p?token=secret',
      user_context: { role: 'admin', evil: 'drop me' },
    })
    expect(out.error_message).toBe('failed for [REDACTED_EMAIL]')
    expect(out.stack).toContain('app.js:1:1') // frame preserved
    expect(out.stack).toContain('[REDACTED_KEY]') // secret redacted
    expect(out.url).toContain('token=[REDACTED]')
    expect(out.user_context_json).toEqual({ role: 'admin' })
  })

  it('defaults occurred_at to an ISO timestamp when missing', () => {
    const out = scrubPayload(base)
    expect(out.occurred_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(out.stack).toBeNull()
    expect(out.url).toBeNull()
  })

  it('coerces a non-string product_id and never throws on odd input', () => {
    // @ts-expect-error — untrusted input (empty object)
    expect(() => scrubPayload({})).not.toThrow()
    // @ts-expect-error — non-string fields from an untrusted caller
    const out = scrubPayload({ product_id: 123, error_message: 5 })
    expect(out.product_id).toBe('123')
    expect(out.error_message).toBe('5')
  })
})
