import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { useRecentActions } from '@/hooks/useRecentActions';
import { MainLayout } from '@/components/layouts/MainLayout';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { recentActions } = useRecentActions();

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  };

  return (
    <MainLayout requireAdmin>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-100 font-playwrite">
            {getGreeting()}, {user?.full_name}!
          </h1>
          <p className="text-gray-50 text-lg">
            {isAdmin ? 'Painel do Administrador' : 'Painel do Professor'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          {recentActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Acessos Recentes
                </CardTitle>
                <CardDescription>
                  Suas últimas páginas visitadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.path}
                        variant="outline"
                        className={cn(
                          'justify-start h-auto py-4 px-4 transition-all hover:scale-[1.02]',
                          index === 0 &&
                            'border-[var(--solara-200)] bg-[var(--solara-50)]',
                        )}
                        onClick={() => navigate(action.path)}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="size-5 text-[var(--solara-600)] shrink-0" />
                          <div className="space-y-1 text-left">
                            <p className="font-medium leading-none">
                              {action.label}
                            </p>
                            <p className="text-xs text-gray-500">
                              {index === 0
                                ? 'Último acesso'
                                : `${index + 1}º acesso`}
                            </p>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
