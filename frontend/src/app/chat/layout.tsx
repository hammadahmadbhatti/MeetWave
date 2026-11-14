export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-surface-950">
      {children}
    </div>
  );
}
