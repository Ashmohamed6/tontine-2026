import './globals.css'

export const metadata = {
  title: 'Tontine 2026 - QUENUM Claudelle',
  description: 'Application de tontine organisée par QUENUM Claudelle',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
