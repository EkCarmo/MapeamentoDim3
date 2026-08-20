# Mapa de Estoque

Web app para mapear armazéns (rua / baia / nível), cadastrar produtos com fotos
e observações, e registrar todas as movimentações de materiais entre localizações.

Stack: **Next.js 14 (App Router)** no **Vercel** + **Firebase** (Firestore, Storage, Authentication).

## Modelo de dados

- `warehouses` — armazéns (ex: G5)
- `locations` — rua + baia + nível dentro de um armazém (ex: G5-H-A-1.2)
- `products` — código, descrição, fotos, observações
- `allocations` — "produto X está na localização Y agora" (sem quantidade; um produto
  pode ter várias alocações ao mesmo tempo, se estiver dividido em mais de uma baia)
- `movements` — histórico imutável de tudo: `entrada` (inclusão), `transferencia`
  (movimentação/divisão), `saida` (zerado — não está mais naquela localização) e
  `contagem` (contagem física confirmada). Cada registro guarda o **usuário** que fez a ação.

## Funcionalidades

- **Visão por localização**: clique em qualquer baia (em Armazéns) para ver todos os
  produtos que estão nela, com foto, cliente e última contagem.
- **Cliente**: cada produto pode ter o cliente ao qual o material pertence.
- **Contagem**: botão "Confirmar contagem" na baia ou no produto registra data e usuário
  da última conferência física (e grava no histórico).
- **Busca ampla**: produtos podem ser buscados por código, descrição, cliente ou
  código de localização (ex: "G5-H-A").
- **Cadastro de localizações em lote**: separe baias e níveis por vírgula
  (baias `A,B,C` × níveis `1.1,1.2` cria 6 localizações de uma vez).
- **Validações**: código de produto único, localização única, sem alocação duplicada
  do mesmo produto na mesma baia, exclusões seguras (sem deixar dados órfãos).
- **Exportar Excel**: inventário atual (Produtos) e histórico (Movimentações).
- **Offline**: cache local do Firestore — funciona com sinal ruim no armazém e
  sincroniza quando a conexão volta.

Toda alteração de alocação (transferir, dividir, zerar, incluir) grava o registro
correspondente em `movements` **na mesma transação do Firestore**, então o histórico
nunca fica dessincronizado do estado atual.

## 1. Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto.
2. Em **Build > Firestore Database**, crie o banco (modo produção).
3. Em **Build > Storage**, ative o Storage.
4. Em **Build > Authentication > Sign-in method**, ative o provedor **E-mail/senha**.
5. Em **Authentication > Users**, clique em **Add user** e crie o(s) usuário(s) que vão
   acessar o sistema (não há tela de cadastro no app — é um sistema interno).
6. Em **Configurações do projeto > Geral > Seus apps**, crie um app da Web e copie as
   credenciais.

## 2. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha com as credenciais do passo anterior:

```bash
cp .env.local.example .env.local
```

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 e faça login com o usuário criado no passo 1.5.

## 4. Publicar as regras de segurança e índices

As regras em `firestore.rules` e `storage.rules` exigem usuário autenticado para
qualquer leitura/escrita — **não deixe o banco aberto**. Publique com o Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # selecione seu projeto
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Os índices em `firestore.indexes.json` são necessários para as consultas usadas no
app (ex: localizações por armazém, alocações por produto, movimentações por produto).
Se você preferir, o próprio Firestore mostra um link para criar o índice automaticamente
na primeira vez que a consulta falhar — mas o deploy acima já resolve tudo de uma vez.

## 5. Publicar no Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em [vercel.com](https://vercel.com), importe o repositório.
3. Em **Environment Variables**, adicione as mesmas variáveis do `.env.local`
   (todas com prefixo `NEXT_PUBLIC_`, pois são usadas no client).
4. Deploy.

## Fluxo de uso

1. **Armazéns** → cria o armazém (ex: G5) e depois as localizações dentro dele
   (rua H, baia A, nível 1.2 — cada combinação vira uma localização).
2. **Produtos** → cadastra o produto com código, descrição, fotos e observações.
3. Na página do produto:
   - **Incluir em localização** → primeira entrada do material em uma baia.
   - **Transferir** → move o material inteiro de uma baia para outra.
   - **Dividir** → parte do material passa a existir também em outra baia
     (mantém a localização de origem).
   - **Zerar** → registra que o material não está mais naquela baia
     (sem indicar destino — ex: expedido, consumido, avariado).
4. **Movimentações** → histórico completo, filtrável por tipo, de todos os produtos.

## Próximos passos sugeridos

- Cloud Function para redimensionar/comprimir fotos automaticamente no upload
  (reduz custo de Storage).
- Papéis de usuário (admin/operador) nas regras do Firestore, se a equipe crescer.
- Exportação do histórico de movimentações (CSV) para auditoria.
