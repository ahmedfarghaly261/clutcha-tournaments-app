type CaptainPlaceholderPageProps = {
  title: string
  description: string
}

export function CaptainPlaceholderPage({ title, description }: CaptainPlaceholderPageProps) {
  return (
    <section className="rounded-xl border border-[#29303a] bg-[#171a20] p-6 shadow-[0_0_80px_rgba(72,194,235,0.06)]">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.1em] text-[#71dcff]">Captain Workspace</p>
      <h1 className="mb-2 text-3xl font-black tracking-[-0.03em] text-[#f1f5fb]">{title}</h1>
      <p className="max-w-2xl text-sm leading-6 text-[#aeb9ca]">{description}</p>
    </section>
  )
}
