# Dash Financeiro - PWA

Progressive Web App para gestão financeira construído com Next.js 15, TypeScript e Tailwind CSS.

## Stack Tecnológica

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **PWA:** @ducanh2912/next-pwa
- **Componentes UI:** shadcn/ui
- **Validação:** Zod
- **Formulários:** React Hook Form
- **Autenticação:** NextAuth.js v5
- **Documentação de Componentes:** Storybook 8
- **Visual Testing:** Chromatic

## Estrutura do Projeto

```
src/
├── app/                          # App Router (Next.js 15)
│   ├── (auth)/                  # Route group - Páginas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/             # Route group - Páginas protegidas
│   │   └── dashboard/
│   ├── api/                     # API Routes
│   │   └── auth/
│   ├── layout.tsx
│   └── page.tsx
│
├── features/                     # Feature-First Architecture
│   ├── auth/                    # Feature de autenticação
│   │   ├── components/          # Componentes específicos
│   │   ├── hooks/               # Hooks customizados
│   │   ├── lib/                 # API clients e utilitários
│   │   ├── schemas/             # Zod schemas
│   │   ├── types/               # TypeScript types
│   │   └── index.ts             # Barrel export
│   │
│   └── dashboard/               # Feature de dashboard
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── schemas/
│       ├── types/
│       └── index.ts
│
├── components/                   # Componentes globais
│   └── ui/                      # shadcn/ui components
│
├── lib/                         # Utilitários globais
│   ├── utils.ts                 # Tailwind merge helper
│   └── api-client.ts            # HTTP client
│
├── hooks/                       # Hooks globais reutilizáveis
│   └── use-media-query.ts
│
├── types/                       # TypeScript types globais
│   └── index.ts
│
└── config/                      # Configurações
    └── site.ts                  # Metadata, URLs, constantes
```

## Configuração Inicial

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações.

### 3. Adicionar Componentes shadcn/ui

```bash
# Exemplo: adicionar componente Button
npx shadcn@latest add button

# Adicionar componente Form
npx shadcn@latest add form

# Adicionar componente Input
npx shadcn@latest add input
```

### 4. Gerar Ícones PWA

Use uma ferramenta como [RealFaviconGenerator](https://realfavicongenerator.net/) para gerar ícones PWA nos seguintes tamanhos:

- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

Adicione os ícones na pasta `public/icons/`.

## Comandos Disponíveis

### Next.js
```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Iniciar servidor de produção
pnpm start

# Linting
pnpm lint

# Type checking
pnpm type-check
```

### Storybook
```bash
# Iniciar Storybook em desenvolvimento
pnpm storybook

# Build do Storybook para produção
pnpm build-storybook

# Publicar no Chromatic (requer CHROMATIC_PROJECT_TOKEN)
pnpm chromatic
```

## Path Aliases Configurados

- `@/*` - Raiz do src
- `@/components/*` - Componentes
- `@/features/*` - Features
- `@/lib/*` - Bibliotecas/utilitários
- `@/hooks/*` - Hooks
- `@/types/*` - Types
- `@/config/*` - Configurações

## Arquitetura Feature-First

Cada feature é auto-contida com sua própria estrutura:

- **components/**: Componentes React específicos da feature
- **hooks/**: Hooks customizados para lógica da feature
- **lib/**: API clients e utilitários
- **schemas/**: Schemas Zod para validação
- **types/**: TypeScript types
- **index.ts**: Barrel export de tudo que é público

### Exemplo de Uso

```typescript
// Importar da feature auth
import { useAuth, loginSchema, type LoginCredentials } from '@/features/auth';

// Importar da feature dashboard
import { useDashboard, type DashboardData } from '@/features/dashboard';
```

## PWA

O projeto está configurado como PWA com:

- Service Worker automático
- Cache de navegação
- Suporte offline
- Instalável em dispositivos

O PWA é desabilitado em desenvolvimento e habilitado em produção.

## Storybook & Chromatic

### Configuração do Storybook

O projeto está configurado com Storybook 8 para documentação e desenvolvimento de componentes de forma isolada.

**Estrutura de Stories:**
- Stories devem ser criadas com a extensão `.stories.tsx` ou `.stories.ts`
- Localização: ao lado do componente (`ComponentName.stories.tsx`)
- Exemplo: `src/components/Button/Button.stories.tsx`

**Exemplo de Story:**
```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Click me",
  },
};
```

### Configuração do Chromatic

1. **Criar conta no Chromatic:**
   - Acesse https://www.chromatic.com/
   - Conecte com seu repositório GitHub

2. **Obter Project Token:**
   - No dashboard do Chromatic, copie o `CHROMATIC_PROJECT_TOKEN`
   - Adicione ao `.env`:
     ```
     CHROMATIC_PROJECT_TOKEN=your-token-here
     ```

3. **Atualizar chromatic.config.json:**
   - Substitua `PROJECT_ID_AQUI` pelo ID do seu projeto

4. **Publicar no Chromatic:**
   ```bash
   pnpm chromatic
   ```

### CI/CD com GitHub Actions

Exemplo de workflow para rodar Chromatic no CI:

```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on: push

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm chromatic
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

## Próximos Passos

1. **Instalar dependências**: `pnpm install`
2. **Adicionar componentes shadcn/ui**: `pnpm dlx shadcn@latest add button form input card`
3. **Gerar ícones PWA** usando https://realfavicongenerator.net/
4. **Configurar `.env`** copiando `.env.example`
5. **Iniciar desenvolvimento**: `pnpm dev`
6. Implementar componentes de formulário em `src/features/auth/components`
7. Implementar componentes do dashboard em `src/features/dashboard/components`
8. Configurar NextAuth.js em `src/app/api/auth/[...nextauth]/route.ts`
9. Implementar API routes para backend
10. Configurar banco de dados (Prisma, Drizzle, etc.)

## Licença

MIT
