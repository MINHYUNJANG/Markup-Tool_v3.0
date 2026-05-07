import './globals.css'

export const metadata = {
  title: 'Markup Tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
