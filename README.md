# Clínica Pró Saúde — MVP

Estrutura inicial local com ASP.NET Core Web API, React + TypeScript e PostgreSQL.

## Requisitos
- .NET 10 SDK
- Node.js LTS e npm
- Docker Desktop (ou PostgreSQL instalado localmente)

## 1. Subir o PostgreSQL
Na raiz do projeto:

```bash
docker compose up -d
```

Banco: `clinica_pro_saude`  
Usuário: `postgres`  
Senha local de desenvolvimento: `postgres123`  
Porta: `5432`

> Credenciais apenas para desenvolvimento local. Não use esses valores em produção.

## 2. Iniciar a API
Abra um terminal na pasta `backend/ClinicaProSaude.API`:

```bash
dotnet restore
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

A API estará disponível em `http://localhost:5080`. O Swagger estará em `http://localhost:5080/swagger`.

## 3. Iniciar o frontend
Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra a URL exibida pelo Vite (normalmente http://localhost:5173).

## Endpoints iniciais
- `GET/POST /api/profissionais`
- `GET/PUT/DELETE /api/profissionais/{id}`
- `GET/POST /api/procedimentos`
- `GET/PUT/DELETE /api/procedimentos/{id}`
- `GET/POST /api/agendamentos`
- `PATCH /api/agendamentos/{id}/cancelar`
- `GET/POST /api/mensagens`
- `PUT/DELETE /api/mensagens/{id}`
- `GET /api/agendamentos?data=2026-11-21`

O endpoint de criação de agendamento calcula o horário final usando a duração do procedimento e rejeita sobreposição para o mesmo profissional.

## Escopo inicial
Esta versão cobre cadastros básicos de profissionais e procedimentos, criação/listagem/cancelamento de agendamentos e cadastro/listagem de modelos de mensagem. Ainda não inclui autenticação, perfis de acesso, integração real com WhatsApp, integração com agendas externas, edição/exclusão de cadastros pela interface, auditoria ou regras completas de expediente/feriados. Esses itens devem ser definidos e implementados antes de uso operacional pela clínica.

## Próximos passos recomendados
1. Validar com a clínica os campos de cadastro e as regras de agenda.
2. Implementar autenticação e autorização.
3. Criar telas completas de cadastro e calendário.
4. Adicionar testes automatizados e validações de segurança.
5. Homologar com dados fictícios antes de qualquer uso com dados reais.
