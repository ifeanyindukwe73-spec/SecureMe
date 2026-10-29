export default function PrototypeNotice({ children = "Prototype only — sample data and demo access. No real reports or authentication are connected." }: { children?: string }) {
  return <aside className="prototype-notice" role="note">{children}</aside>;
}
