# Landing page – Manual de Gestão de Vendas

## Publicar na Vercel

1. Importa o repositório na Vercel e define `livro` como **Root Directory**.
2. Cria uma base de dados PostgreSQL através do Marketplace da Vercel (por exemplo, Neon ou Prisma Postgres) e confirma que `DATABASE_URL` foi adicionada às variáveis do projeto.
3. Em **Storage**, cria um Blob store com acesso **Private** e liga-o ao projeto. A Vercel disponibiliza `BLOB_READ_WRITE_TOKEN` para o projeto.
4. Configura as variáveis de ambiente indicadas em `.env.example`: `AUTH_SECRET` (aleatório, pelo menos 32 caracteres), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `APP_URL`, `BOOK_PRICE_KZ`, dados de pagamento, e-mail de suporte e SMTP.
   O preço padrão está definido em 3.775 Kz, com os dados bancários fornecidos já preenchidos; podes substituí-los pelas variáveis correspondentes quando necessário.
5. Liga o projeto à CLI da Vercel e disponibiliza o PDF privado:

   ```sh
   npx vercel link
   npx vercel env pull .env
   npx vercel blob put ./storage/livro.pdf --pathname books/livro.pdf --access private
   ```

   Define `BOOK_BLOB_PATH=books/livro.pdf` nas variáveis de ambiente da Vercel. O `BOOK_BLOB_PATH` é o pathname, não uma URL pública.
6. Aplica o schema Prisma à base de dados de produção usando o `DATABASE_URL` de produção (`npx prisma db push`). Isto cria também a tabela usada pela limitação de tentativas. Depois faz deploy. O build do projeto já executa `prisma generate`.

Os comprovativos são enviados diretamente pela rota da aplicação para o Blob privado. O limite foi definido em 4 MB para caber no limite padrão de payload das Functions da Vercel, incluindo os campos do formulário. O login admin, as encomendas e o envio de comprovativos têm limites por endereço IP guardados no PostgreSQL. A área admin lê os comprovativos privados através de uma função autenticada. Para o livro, a aplicação valida o token da encomenda e redireciona para uma URL assinada de curta duração, evitando passar o PDF pela Function. Os blobs não ficam públicos.

## Desenvolvimento local

Usa PostgreSQL em `DATABASE_URL`, configura um `BLOB_READ_WRITE_TOKEN` de um Blob store privado para testar uploads, e define `BOOK_BLOB_PATH`. O PDF local antigo (`BOOK_PDF_PATH`) continua como fallback apenas fora da Vercel.

Hash da palavra-passe do admin:

```sh
node -e "console.log(require('bcryptjs').hashSync('A_TUA_PASSWORD',10))"
```

O hash vai em `ADMIN_PASSWORD_HASH`. Mantém variáveis secretas fora do repositório.

## Execução local

```sh
npm install
npx prisma db push
npm run dev
```
