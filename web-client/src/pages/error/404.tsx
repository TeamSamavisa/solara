import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-6xl font-bold text-[var(--solara-600)]">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-800">
        Página não encontrada
      </h2>
      <p className="mt-2 text-gray-600">
        A página que você está procurando não existe.
      </p>
      <div className="flex gap-4 mt-8">
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    </div>
  );
}
