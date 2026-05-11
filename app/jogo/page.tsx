import { JsonLd } from "@/components/common/json-ld";
import { buildPageJsonLd, buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata("/jogo");

export default function JogoPage() {
  return (
    <>
      <JsonLd
        data={buildPageJsonLd("/jogo", {
          about: {
            "@type": "LearningResource",
            name: "Missão Reciclar",
            educationalUse: "Jogo educativo",
            learningResourceType: "Interactive game"
          }
        })}
      />

      <section className="px-2 md:px-6">
        <div className="mx-auto w-full max-w-[1220px]">
          <div className="mb-4 flex flex-col gap-3 px-2 md:flex-row md:items-end md:justify-between md:px-0">
            <div>
              <span className="section-label">Jogo educativo</span>
              <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">
                Missão Reciclar
              </h1>
            </div>
            <a href="/jogo-educativo/index.html" target="_blank" rel="noopener noreferrer" className="button-secondary">
              Abrir em tela cheia
            </a>
          </div>

          <iframe
            title="Jogo educativo Missão Reciclar"
            src="/jogo-educativo/index.html"
            className="h-[1120px] w-full rounded-[8px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] md:h-[1040px]"
          />
        </div>
      </section>
    </>
  );
}
