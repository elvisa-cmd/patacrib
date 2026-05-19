'use client'
import { useState } from 'react'

interface Props {
  propertyTitle:  string
  propertyPrice:  number
  propertyEstate: string | null
  propertyCity:   string | null
  propertyId:     string
  landlordPhone?: string | null
  landlordName?:  string | null
}

export default function ContactButtons({
  propertyTitle,
  propertyPrice,
  propertyEstate,
  propertyCity,
  propertyId,
  landlordPhone,
  landlordName,
}: Props) {
  const [copied, setCopied] = useState(false)

  const location       = propertyEstate || propertyCity || 'Nairobi'
  const priceFormatted = `KSh ${propertyPrice?.toLocaleString('en-KE')}`
  const propertyUrl    = `https://patacrib.vercel.app/property/${propertyId}`

  const waMessage = encodeURIComponent(
    `Hi${landlordName ? ` ${landlordName}` : ''}, I saw your property on PataKrib and I am interested.\n\n` +
    `*${propertyTitle}*\n` +
    `📍 ${location}\n` +
    `💰 ${priceFormatted}/month\n\n` +
    `View listing: ${propertyUrl}\n\n` +
    `Could we arrange a viewing?`
  )

  const cleanPhone = landlordPhone
    ? landlordPhone.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '')
    : null

  const waContactUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${waMessage}`
    : `https://wa.me/?text=${waMessage}`

  async function handleShare() {
    const shareData = {
      title: `${propertyTitle} — ${priceFormatted}/mo`,
      text:  `Check out this property on PataKrib — ${propertyTitle} in ${location} at ${priceFormatted}/month. GPS-verified with full property intelligence.`,
      url:   propertyUrl,
    }

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); return } catch { /* cancelled */ }
    }

    try {
      await navigator.clipboard.writeText(`${propertyTitle} — ${priceFormatted}/mo in ${location}\n${propertyUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `🏠 *${propertyTitle}*\n` +
      `📍 ${location}\n` +
      `💰 ${priceFormatted}/month\n` +
      `✅ GPS verified on PataKrib\n\n` +
      `View full details: ${propertyUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const whatsappIconPath = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* PRIMARY — WhatsApp contact */}
      <a
        href={waContactUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '10px',
          width:          '100%',
          padding:        '16px',
          background:     '#25D366',
          color:          '#fff',
          borderRadius:   '16px',
          fontSize:       '15px',
          fontWeight:     700,
          textDecoration: 'none',
          fontFamily:     'inherit',
          boxSizing:      'border-box',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d={whatsappIconPath} />
        </svg>
        Contact on WhatsApp
      </a>

      {/* SECONDARY — Share + Share via WhatsApp */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleShare}
          style={{
            flex:           1,
            padding:        '13px',
            background:     '#f5f5f5',
            border:         'none',
            borderRadius:   '14px',
            fontSize:       '13px',
            fontWeight:     700,
            color:          '#0f0e0c',
            cursor:         'pointer',
            fontFamily:     'inherit',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '7px',
          }}
        >
          {copied ? (
            <>✅ Copied!</>
          ) : (
            <>
              <svg width="15" height="15" fill="none" stroke="#0f0e0c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Share
            </>
          )}
        </button>

        <button
          onClick={shareWhatsApp}
          style={{
            flex:           1,
            padding:        '13px',
            background:     '#f5f5f5',
            border:         'none',
            borderRadius:   '14px',
            fontSize:       '13px',
            fontWeight:     700,
            color:          '#0f0e0c',
            cursor:         'pointer',
            fontFamily:     'inherit',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '7px',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366">
            <path d={whatsappIconPath} />
          </svg>
          Share via WA
        </button>
      </div>

      {!landlordPhone && (
        <div style={{
          padding:      '10px 14px',
          background:   'rgba(232,160,32,0.08)',
          border:       '1px solid rgba(232,160,32,0.2)',
          borderRadius: '10px',
          fontSize:     '12px',
          color:        '#b07a10',
          lineHeight:   1.5,
        }}>
          ⚠️ Landlord has not added a WhatsApp number yet. Tap Share to send the listing.
        </div>
      )}
    </div>
  )
}
