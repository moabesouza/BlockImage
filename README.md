# BlockImage

Aplicacao Node.js com Express, MySQL, Leaflet e integracao Web3 para cadastro,
venda e compra de imagens georreferenciadas.

## Rodando com Docker

Suba a aplicacao e o banco:

```bash
docker compose up --build
```

Acesse:

```text
http://localhost:3030
```

Para parar:

```bash
docker compose down
```

Para apagar tambem os dados do MySQL e recriar as tabelas pelo script inicial:

```bash
docker compose down -v
docker compose up --build
```

## Rodando sem Docker

Configure um MySQL local com o banco `BlockChain`, instale as dependencias e
inicie o servidor:

```bash
npm install
npm start
```

As variaveis aceitas pelo servidor estao em `.env.example`.
