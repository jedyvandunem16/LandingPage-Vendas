export default function Login({ searchParams }: { searchParams: { e?: string; locked?: string } }) {
  return <main className="box"><h1>Administração</h1>
    <form method="post" action="/api/admin/login"><input name="email" type="email" placeholder="E-mail" required /><input name="password" type="password" placeholder="Palavra-passe" required />
      {searchParams.locked ? <p className="err">Demasiadas tentativas. Aguarda 15 minutos antes de tentares novamente.</p> : searchParams.e && <p className="err">Dados incorretos.</p>}<button>Entrar</button></form></main>;
}
