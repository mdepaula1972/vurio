import Link from "next/link";
import { QrCode, MessageSquare, Utensils, Shield, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-slate-950 rounded-xl flex items-center justify-center text-white font-black text-lg">V</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Vurio</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <ButtonWithRef className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg px-4 py-2">
                Área do Admin
              </ButtonWithRef>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block bg-slate-900/5 text-slate-900 border border-slate-900/10 rounded-full px-4 py-1 text-xs font-semibold">
            Pedidos & Atendimento por IA para Food Service
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Peça pelo seu nome. Divida do seu jeito. Vá embora sem esperar.
          </h1>
          <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            O Vurio é o garçom digital que reduz custos operacionais do restaurante, elimina o tempo de espera do cliente e resolve a divisão de conta de forma justa. Tudo com mensalidade fixa e sem intermediar pagamentos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/chat?establishment=exemplo">
              <ButtonWithRef className="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 text-white font-semibold rounded-xl px-8 py-3 shadow-lg flex items-center justify-center gap-2">
                <MessageSquare className="h-5 w-5" /> Testar Chatbot Demo
              </ButtonWithRef>
            </Link>
            <Link href="/kitchen?establishment=exemplo">
              <ButtonWithRef className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl px-8 py-3 shadow-sm flex items-center justify-center gap-2">
                <Utensils className="h-5 w-5" /> Abrir Painel da Cozinha
              </ButtonWithRef>
            </Link>
          </div>
        </div>
      </section>

      {/* Diferenciais Section */}
      <section className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <CardFeature
          icon={<Shield className="h-6 w-6 text-slate-900" />}
          title="Dinheiro Sempre Seu"
          description="Diferente dos concorrentes, o Vurio cobra apenas uma mensalidade fixa. O dinheiro dos pedidos dos clientes vai direto para a sua conta."
        />
        <CardFeature
          icon={<QrCode className="h-6 w-6 text-slate-900" />}
          title="Identidade por CPF"
          description="Identificamos o cliente pelo CPF e confirmamos identidades para evitar números reciclados. A comanda acompanha o cliente caso ele mude de mesa."
        />
        <CardFeature
          icon={<CheckCircle className="h-6 w-6 text-slate-900" />}
          title="Conformidade LGPD"
          description="Dois níveis de consentimento explícitos e CPF sempre mascarado nas telas dos garçons e cozinha. Segurança jurídica para o estabelecimento."
        />
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-6 text-center text-xs text-slate-400">
        <p>© 2026 Vurio. Todos os direitos reservados. vurio.com.br | vurio.online</p>
      </footer>
    </div>
  );
}

function CardFeature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-bold text-lg text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

// Botão Simples Isomórfico de auxílio
function ButtonWithRef({ children, className, ...props }: any) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
