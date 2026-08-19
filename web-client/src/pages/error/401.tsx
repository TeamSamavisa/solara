import { Button } from '@/components/ui/button';
import { Link } from 'react-router';

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-6xl font-bold text-[var(--solara-600)]">401</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-800">
        Não Autorizado
      </h2>
      <p className="mt-2 text-gray-600">
        Você não tem permissão para acessar esta página.
      </p>
      <div className="flex gap-4 mt-8">
        <Button asChild variant="outline">
          <Link to="/login">Ir para o Login</Link>
        </Button>
      </div>
    </div>
  );
}
