import { ImageResponse } from 'next/og'

// Auto-generated social link-preview card (Open Graph + Twitter). Shown when the site URL is
// pasted into Stockbit / WhatsApp / X / Telegram, etc. Rendered in code via next/og — no manual
// image file and no extra dependency (next/og ships with Next). 1200×630 is the standard OG size.
export const runtime = 'edge'
export const alt = 'BDMFlow — IDX Flow Intelligence'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #070b16 0%, #0f1629 55%, #1c1408 100%)',
          color: '#f8fafc',
        }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '104px',
              height: '104px',
              borderRadius: '26px',
              background: 'linear-gradient(135deg, #e7b733, #c49a1a)',
              color: '#0a122c',
              fontSize: '64px',
              fontWeight: 800,
              marginRight: '30px',
            }}
          >
            B
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '82px', color: '#f8fafc', lineHeight: 1 }}>BDMFlow</div>
            <div style={{ fontSize: '27px', letterSpacing: '7px', color: '#e7b733', marginTop: '12px' }}>
              IDX FLOW INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ fontSize: '42px', color: '#e2e8f0', lineHeight: 1.3, maxWidth: '940px' }}>
          Lacak Smart Money, Foreign Flow &amp; KSEI di pasar saham Indonesia.
        </div>

        {/* Feature line */}
        <div style={{ fontSize: '25px', color: '#8b9bb4', marginTop: '40px' }}>
          Screener Pro · Broker Tracker · Backtest · MSCI / FTSE
        </div>

        {/* URL pill */}
        <div style={{ display: 'flex', marginTop: '52px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '23px',
              color: '#0a122c',
              background: '#e7b733',
              padding: '10px 26px',
              borderRadius: '999px',
              fontWeight: 700,
            }}
          >
            bdm-flow-v2.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
