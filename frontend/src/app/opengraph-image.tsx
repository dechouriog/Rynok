import { ImageResponse } from 'next/og';

export const alt = 'Rynok: bienes raíces en cripto con escrow';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Imagen Open Graph generada en el build (sin fuentes remotas). */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 60%)',
        color: '#0f172a',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, background: '#1d4ed8', display: 'flex' }} />
        <div style={{ fontSize: 56, fontWeight: 800 }}>Rynok</div>
      </div>
      <div style={{ marginTop: 40, fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
        Bienes raíces, comprados y vendidos en cripto
      </div>
      <div style={{ marginTop: 24, fontSize: 30, color: '#334155' }}>
        Pago en ETH protegido por un smart contract de escrow
      </div>
    </div>,
    size,
  );
}
