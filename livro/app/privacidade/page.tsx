import Link from "next/link";

export const metadata = {
  title: "Privacidade | Empire GA - Manual de Gestão de Vendas",
  description: "Como os dados enviados para encomendar o Manual de Gestão de Vendas são utilizados e protegidos.",
};

export default function Privacy() {
  const email = process.env.SUPPORT_EMAIL;
  return (
    <main className="privacy">
      <p><Link href="/">← Voltar à página inicial</Link></p>
      <p className="eyebrow">EMPIRE GA · MANUAL DE GESTÃO DE VENDAS</p>
      <h1>Privacidade</h1>
      <p>Esta página explica que dados são recolhidos quando fazes uma encomenda e como são usados para processar a compra e entregar o livro.</p>
      <h2>Dados que recolhemos</h2>
      <p>Para registar uma encomenda, pedimos nome, e-mail, telefone e, opcionalmente, província e observações. Se enviares um comprovativo, recolhemos também o nome do titular do pagamento, método, valor, data e o ficheiro do comprovativo.</p>
      <h2>Como os usamos</h2>
      <p>Usamos estes dados para registar e acompanhar a encomenda, verificar manualmente o pagamento, enviar mensagens sobre a compra, entregar o livro e prestar suporte. Não recolhemos dados de cartões bancários nesta página.</p>
      <h2>Armazenamento e prestadores</h2>
      <p>Os dados da encomenda são guardados na base de dados configurada para o serviço. Os comprovativos e o PDF do livro são mantidos em armazenamento privado. O fornecedor de e-mail configurado recebe os dados necessários para enviar mensagens sobre a encomenda. Estes prestadores processam dados apenas no âmbito da prestação dos respetivos serviços.</p>
      <h2>Acesso e conservação</h2>
      <p>O acesso aos dados da encomenda e aos comprovativos é restrito à administração do serviço. Conservamos os registos enquanto forem necessários para concluir a venda, prestar suporte e cumprir obrigações aplicáveis.</p>
      <h2>Pedidos e contacto</h2>
      <p>Para pedir acesso, correção ou eliminação de dados, ou para colocar uma questão sobre privacidade, contacta-nos{email ? <> em <a href={`mailto:${email}`}>{email}</a></> : " através do contacto de suporte indicado no site"}.</p>
    </main>
  );
}
