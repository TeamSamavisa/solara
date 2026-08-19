import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-6xl font-bold text-[var(--solara-600)]">403</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-800">
        Acesso Negado
      </h2>
      <p className="mt-2 text-gray-600">
        Você não tem permissões suficientes para acessar este recurso.
      </p>
      <div className="flex gap-4 mt-8">
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    </div>
  );
}
