import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { authApi } from "@/lib/api";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Le nom d\'utilisateur est requis').max(50),
  password: z.string().min(1, 'Le mot de passe est requis').max(100)
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate inputs
      const validated = loginSchema.parse({ 
        username: credentials.username, 
        password: credentials.password 
      });
      
      await authApi.login(validated.username.trim(), validated.password);
      toast.success("Connexion réussie");
      navigate("/admin/dashboard");
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error(err?.message || "Identifiants incorrects");
      }
    }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 logo-watermark">
      <div className="w-full max-w-md relative z-10">
        <div className="card-shop p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={logo} alt="RSLIV Logo" className="w-24 h-24 object-contain drop-shadow-2xl" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Administration</h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour gérer votre boutique
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Identifiant
              </label>
              <Input
                type="text"
                placeholder="admin"
                className="input-shop"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Mot de passe
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                className="input-shop"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
              />
            </div>

            <Button type="submit" className="w-full btn-primary py-6 text-lg mt-6">
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;