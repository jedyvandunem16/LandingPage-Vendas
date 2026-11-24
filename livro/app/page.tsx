import { OrderForm } from "./forms";
import { price, kz } from "@/lib";

export const dynamic = "force-dynamic";

const faq = [
  [
    "Como posso adquirir o livro?",
    "Preenches o formulário de encomenda, recebes os dados de pagamento, pagas e envias o comprovativo na página de pagamento.",
  ],
  [
    "Quais são os métodos de pagamento?",
    "Transferência bancária e Multicaixa Express. Os dados aparecem depois de fazeres a encomenda.",
  ],
  [
    "Como envio o comprovativo?",
    "Na página de pagamento, com o código da encomenda. Aceitamos PDF, JPG ou PNG até 4 MB.",
  ],
  [
    "Quanto tempo demora a receber o livro?",
    "Até 24 horas depois de confirmarmos o teu pagamento.",
  ],
  [
    "Como recebo o livro?",
    "Por e-mail, com um link privado para descarregares o PDF.",
  ],
  [
    "E se o comprovativo for rejeitado?",
    "Recebes um e-mail a explicar o motivo e podes enviar um novo comprovativo com o mesmo código.",
  ],
];

export default function Home() {
  const p = price();
  const mail = process.env.SUPPORT_EMAIL;

  return (
    <main>
      <section className="hero">
        <img src="/capa.png" alt="Capa do Manual de Gestão de Vendas - Empire GA" />
        <div>
          <p className="eyebrow">EMPIRE GA · GESTÃO COMERCIAL</p>
          <h1>Manual de Gestão de Vendas</h1>
          <p className="hero-question">
            <b>A tua empresa vende por acaso ou vende por processo?</b>
          </p>
          <p>
            O guia prático que te mostra onde a tua empresa perde dinheiro e o que fazer a seguir,
            para responderes certo no momento certo e poupares tempo, esforço e dinheiro.
          </p>
          <p className="price">
            <b>{p ? kz(p) : "Preço em breve"}</b>
          </p>
          <a className="btn" href="#encomenda">
            ADQUIRIR O LIVRO
          </a>
        </div>
      </section>

      <section>
        <h2>O que vais aprender</h2>
        <ul>
          {[
            "Perceber onde a tua empresa perde dinheiro",
            "Aplicar a fórmula do crescimento comercial",
            "Definir metas realistas",
            "Organizar a tua equipa",
            "Fazer prospeção ativa",
            "Montar um funil de vendas",
            "Qualificar clientes com pontuação",
            "Estruturar o follow-up",
            "Registar e gerir leads num CRM",
          ].map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p>
          Com ele, ganhas previsibilidade de receita, perdes menos oportunidades, dependes menos de
          descontos e ficas com uma equipa alinhada e uma base sólida para crescer.
        </p>
        <p>
          <b>Para quem é:</b> donos de micro empresas, gestores comerciais e empreendedores que
          querem profissionalizar as suas vendas, com linguagem simples, tabelas prontas a adaptar e
          exemplos práticos.
        </p>
      </section>

      <section className="author-section">
        <div className="author-grid">
          <div className="author-media">
            <img src="/autor.png" alt="Guerreiro António - Consultor de Vendas e Fundador da Empire GA" className="author-img" />
          </div>
          <div className="author-bio">
            <p className="eyebrow">APRESENTAÇÃO</p>
            <h2>Sobre o autor</h2>
            <p>
              <strong>Guerreiro António</strong> é Consultor de vendas e fundador da{" "}
              <strong>Empire GA</strong>, uma empresa que prima ajudar outras empresas a
              estruturarem processos comerciais e a aumentarem efetivamente as suas vendas por meio
              de processos claros.
            </p>
            <p>
              Com vasta vivência de mercado e conhecimentos adquiridos na construção de planos de
              vendas, este manual foi elaborado para te ajudar a descobrir onde a tua empresa tem
              deixado dinheiro para trás e como transformar o teu processo comercial em resultados
              consistentes.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>Como comprar</h2>
        <ol>
          <li>Preenche o formulário abaixo.</li>
          <li>Recebe os dados de pagamento e paga.</li>
          <li>Envia o comprovativo na página de pagamento.</li>
          <li>Validamos o pagamento e enviamos o livro por e-mail em até 24 horas.</li>
        </ol>
        <div className="card">
          <h2>Encomenda</h2>
          <OrderForm />
          <p className="form-note">
            Ao enviar a encomenda, consulta a nossa <a href="/privacidade">Política de Privacidade</a>.
          </p>
        </div>
      </section>

      <section>
        <h2>Perguntas frequentes</h2>
        {faq.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <footer>
        <div className="footer-top">
          <span>© 2026 Empire GA. Todos os direitos reservados.</span>
          <span>
            {mail && <>Suporte: <a href={"mailto:" + mail}>{mail}</a> · </>}
            <a href="/privacidade">Privacidade</a>
          </span>
        </div>
        <div className="footer-credits">
          <span>Feito por_jedyvandunem16@gmail.com</span>
        </div>
      </footer>
    </main>
  );
}
