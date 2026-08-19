import { EyeIcon, EyeOffIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { useState } from 'react';
import classroomImage from '@/assets/images/classroom.jpg';
import solara from '@/assets/images/solara.png';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Campos obrigatórios', {
        description: 'Por favor, preencha todos os campos.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email inválido', {
        description: 'Por favor, insira um email válido.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success('Bem-vindo!', {
        description: 'Login realizado com sucesso.',
      });
    } catch (error) {
      toast.error('Erro ao entrar', {
        description: 'Email ou senha inválidos. Tente novamente.',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="w-full lg:w-full flex flex-col md:flex-row shadow-2xl rounded-lg overflow-hidden">
        {/* Left side with image */}
        <div className="hidden md:block md:w-2/3 relative">
          <div
            className="absolute inset-0 bg-cover bg-center transform hover:scale-105 transition-transform duration-700"
            style={{
              backgroundImage: `url(${classroomImage})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800/90 to-blue-950/90" />
          <div className="absolute inset-0 flex lg:flex-row flex-col items-center justify-center gap-8">
            <img
              src={solara}
              alt="Solara Logo"
              className="w-48 h-48 object-cover rounded-full"
            />
            <h1 className="text-6xl font-bold text-white font-playwrite">
              Solara
            </h1>
          </div>
        </div>

        {/* Right side with form */}
        <div className="w-full lg:w-2/5 md:w-3/5 flex items-center justify-center p-8 bg-card">
          <div className="w-full max-w-md space-y-8">
            {/* Logo and title for mobile */}
            <div className="md:hidden text-center space-y-4 mb-8">
              <div className="flex flex-row items-center justify-center gap-4">
                <img
                  src={solara}
                  alt="Solara"
                  className="w-20 h-20 object-cover rounded-full"
                />
                <h1 className="text-3xl font-bold text-[var(--solara-900)] font-playwrite">
                  Solara
                </h1>
              </div>
            </div>

            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 pt-0 space-y-1">
                <CardTitle className="text-2xl font-bold font-playwrite">
                  Login
                </CardTitle>
              </CardHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <CardContent className="space-y-4 px-0">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="focus:border-[var(--solara-900)] focus:ring-[var(--solara-900)] transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="pr-10 focus:border-[var(--solara-900)] focus:ring-[var(--solara-900)] transition-all"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={togglePasswordVisibility}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <a
                      href="#"
                      className="text-[var(--solara-900)] hover:text-blue-700 transition-colors font-medium"
                    >
                      Esqueceu sua senha?
                    </a>
                  </div>
                </CardContent>

                <CardFooter className="px-0">
                  <Button
                    type="submit"
                    className="w-full bg-[var(--solara-900)] hover:bg-blue-800 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Footer with additional information */}
            <div className="text-center text-sm text-gray-500">
              <p>
                Problemas para acessar?{' '}
                <a
                  href="#"
                  className="text-[var(--solara-900)] hover:text-blue-700 font-medium transition-colors"
                >
                  Entre em contato
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
