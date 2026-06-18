import { CheckCircle, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { Player } from "@remotion/player";
import { SearchAnimation } from "./remotion/SearchAnimation";
import { LoadingGameAnimation } from "./remotion/LoadingGameAnimation";

function App() {
  return (
    <div className="min-h-screen font-sans bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-brand-blue tracking-tight">FlowIQ</span>
          </div>
          <button className="bg-brand-red hover:bg-red-700 text-white px-5 py-2 rounded-full font-medium transition-colors">
            Falar com Consultor
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-brand-blue/5 to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                Zere a inadimplência com uma <span className="text-brand-red">experiência mágica</span> para o aluno.
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                Esqueça as cobranças frias e os portais confusos. O FlowIQ transforma a renegociação de boletos em um momento simples, acolhedor e altamente eficaz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-brand-blue hover:bg-blue-900 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl">
                  Agendar Demonstração <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Integração Rápida</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 100% Automático</div>
              </div>
            </div>

            {/* Remotion Player - Hero (Search Input) */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100 bg-white aspect-[16/10] flex items-center justify-center">
              <Player
                component={SearchAnimation}
                durationInFrames={150}
                compositionWidth={800}
                compositionHeight={500}
                fps={30}
                autoPlay
                loop
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Como o FlowIQ transforma sua gestão</h2>
            <p className="text-lg text-gray-600">Um ecossistema desenhado para remover qualquer atrito entre o seu aluno e o pagamento.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Feature 1: Engajamento na Espera */}
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-white aspect-[16/10] flex items-center justify-center">
              <Player
                component={LoadingGameAnimation}
                durationInFrames={300}
                compositionWidth={800}
                compositionHeight={500}
                fps={30}
                autoPlay
                loop
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-brand-red" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Engajamento até na espera</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Consultar débitos não precisa ser chato. Nosso modal de carregamento duplo oferece um mini-game interativo enquanto o sistema busca os dados em tempo real. O aluno se diverte, o tempo voa e a ansiedade desaparece.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-red" />
            <span className="text-xl font-bold text-white tracking-tight">FlowIQ</span>
          </div>
          <p>© 2026 FlowIQ Technologies. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
