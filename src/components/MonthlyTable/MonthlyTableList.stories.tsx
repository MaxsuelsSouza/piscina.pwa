/**
 * MonthlyTableList Stories
 * Visualização em lista vertical (tabela) dos dias
 */

import type { Meta, StoryObj } from '@storybook/react';
import MonthlyTableList from './MonthlyTableList';
import type { Registro } from './types';

// Função para gerar dados mock
function generateMockData(): Registro[] {
  const registros: Registro[] = [];
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);

  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Adicionar algumas transações aleatórias
    if (Math.random() > 0.6) {
      // Entrada
      registros.push({
        id: `entrada-${i}`,
        date: date.toISOString().split('T')[0],
        valor: Math.floor(Math.random() * 5000) + 500,
        tipo: 'entrada',
        descricao: ['Salário', 'Freelance', 'Bonificação', 'Venda'][
          Math.floor(Math.random() * 4)
        ],
      });
    }

    if (Math.random() > 0.5) {
      // Saída
      registros.push({
        id: `saida-${i}`,
        date: date.toISOString().split('T')[0],
        valor: Math.floor(Math.random() * 2000) + 100,
        tipo: 'saida',
        descricao: [
          'Aluguel',
          'Supermercado',
          'Combustível',
          'Restaurante',
          'Internet',
          'Luz',
        ][Math.floor(Math.random() * 6)],
      });
    }
  }

  return registros;
}

const meta = {
  title: 'Components/MonthlyTableList',
  component: MonthlyTableList,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#171820',
        },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MonthlyTableList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    registros: generateMockData(),
  },
  render: (args) => (
    <div className="h-screen bg-[#171820]">
      <MonthlyTableList {...args} />
    </div>
  ),
};

export const Empty: Story = {
  args: {
    registros: [],
  },
  render: (args) => (
    <div className="h-screen bg-[#171820]">
      <MonthlyTableList {...args} />
    </div>
  ),
};

export const FewTransactions: Story = {
  args: {
    registros: [
      {
        id: '1',
        date: new Date().toISOString().split('T')[0],
        valor: 5000,
        tipo: 'entrada',
        descricao: 'Salário',
      },
      {
        id: '2',
        date: new Date().toISOString().split('T')[0],
        valor: 1500,
        tipo: 'saida',
        descricao: 'Aluguel',
      },
      {
        id: '3',
        date: new Date(new Date().setDate(new Date().getDate() - 1))
          .toISOString()
          .split('T')[0],
        valor: 300,
        tipo: 'saida',
        descricao: 'Supermercado',
      },
    ],
  },
  render: (args) => (
    <div className="h-screen bg-[#171820]">
      <MonthlyTableList {...args} />
    </div>
  ),
};

export const ManyTransactions: Story = {
  args: {
    registros: (() => {
      const registros: Registro[] = [];
      const today = new Date();

      // Gera muitas transações para o mês atual
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today.getFullYear(), today.getMonth(), i);
        const dateStr = date.toISOString().split('T')[0];

        // Múltiplas transações por dia
        registros.push({
          id: `entrada-1-${i}`,
          date: dateStr,
          valor: Math.floor(Math.random() * 3000) + 1000,
          tipo: 'entrada',
          descricao: 'Receita',
        });

        registros.push({
          id: `saida-1-${i}`,
          date: dateStr,
          valor: Math.floor(Math.random() * 1000) + 200,
          tipo: 'saida',
          descricao: 'Despesa 1',
        });

        registros.push({
          id: `saida-2-${i}`,
          date: dateStr,
          valor: Math.floor(Math.random() * 800) + 100,
          tipo: 'saida',
          descricao: 'Despesa 2',
        });
      }

      return registros;
    })(),
  },
  render: (args) => (
    <div className="h-screen bg-[#171820]">
      <MonthlyTableList {...args} />
    </div>
  ),
};
