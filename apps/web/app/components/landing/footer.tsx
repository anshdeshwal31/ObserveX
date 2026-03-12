export function Footer() {
  return (
    <footer className="mx-auto flex w-[min(1120px,calc(100%-48px))] flex-col items-start justify-between gap-4 border-t border-white/10 py-10 md:flex-row md:items-center">
      <div className="flex flex-col gap-1">
        <p className="text-[1.05rem] font-bold tracking-[-0.02em] text-[#f7f1e8]">PingNova</p>
        <p className="text-sm text-[#ece3d7a8]">&copy; 2026 PingNova. All rights reserved.</p>
      </div>
      <nav className="flex flex-wrap items-center gap-4 text-sm text-[#ece3d7bf]">
        <a href="/#features">Features</a>
        <a href="/#pricing">Pricing</a>
        <a href="/#faq">FAQ</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/auth">Sign In</a>
      </nav>
    </footer>
  );
}
