import "./globals.css";

export const metadata = {
  title: "Manual de Gestão de Vendas | Empire GA - Guerreiro António",
  description: "O manual que vai direcionar a tua empresa aos números de vendas desejado. Por Guerreiro António (Empire GA).",
};

export default function L({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
