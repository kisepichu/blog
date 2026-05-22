import satori from 'satori'

interface DefImageProps {
  title: string
  english: string
  tags: string[]
  siteUrl: string
  fonts: {
    dotGothic16: ArrayBuffer
    mplusRounded: ArrayBuffer
  }
}

export async function renderDefImage({
  title,
  english,
  tags,
  siteUrl,
  fonts,
}: DefImageProps): Promise<string> {
  return satori(
    <div
      style={{
        width: 1200,
        height: 630,
        backgroundColor: '#fafaf8',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 72px',
        fontFamily: 'DotGothic16',
      }}
    >
      {/* 右上: サイト名 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 16, color: '#aeae9e' }}>{siteUrl}</span>
      </div>

      {/* 中央: ラベル + タイトル + 英語名 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, justifyContent: 'center' }}>
        <span style={{ fontSize: 20, color: '#3d9e8a', letterSpacing: '0.12em' }}>DEFINITION</span>
        <div
          style={{
            fontSize: 52,
            color: '#252520',
            lineHeight: 1.35,
            maxWidth: 1000,
            flexWrap: 'wrap',
            display: 'flex',
          }}
        >
          {title}
        </div>
        {english && (
          <span
            style={{
              fontSize: 24,
              color: '#747468',
              fontFamily: 'MPLUSRounded',
            }}
          >
            {english}
          </span>
        )}
      </div>

      {/* 下部: タグ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        {tags.map((tag) => (
          <span key={tag} style={{ fontSize: 18, color: '#8878c8' }}>
            #{tag}
          </span>
        ))}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'DotGothic16', data: fonts.dotGothic16, weight: 400, style: 'normal' },
        { name: 'MPLUSRounded', data: fonts.mplusRounded, weight: 400, style: 'normal' },
      ],
    },
  )
}
