/**
 * Estado vazio da página de explorar
 */

export function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-gray-600 mb-1">Nenhum espaço disponível</p>
      <p className="text-sm text-gray-500">
        No momento não há espaços cadastrados
      </p>
    </div>
  );
}
