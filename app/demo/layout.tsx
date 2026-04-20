// Minimal layout for embedded demo apps. No site header/footer.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
