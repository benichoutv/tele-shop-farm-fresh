import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Info, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Prize {
  id: number;
  name: string;
  type: string;
  value: string;
  probability: number;
}

export default function Roulette() {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const [code, setCode] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);

  // Récupérer le username Telegram au chargement
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.username) {
      setTelegramUsername(tg.initDataUnsafe.user.username);
    }

    // Charger les lots disponibles
    fetch(`${API_BASE_URL}/api/roulette/prizes`)
      .then(res => res.json())
      .then(data => setPrizes(data))
      .catch(err => console.error('Error loading prizes:', err));
  }, []);

  // Créer les 8 sections de la roue
  const wheelSections: Prize[] = [];
  const sortedPrizes = [...prizes].sort((a, b) => b.probability - a.probability);
  
  sortedPrizes.forEach(prize => {
    const slots = Math.round((prize.probability / 100) * 8);
    for (let i = 0; i < slots; i++) {
      wheelSections.push(prize);
    }
  });

  // S'assurer qu'on a exactement 8 sections
  while (wheelSections.length < 8) {
    wheelSections.push(wheelSections[0] || { id: 0, name: 'Lot', type: 'default', value: '', probability: 0 });
  }
  while (wheelSections.length > 8) {
    wheelSections.pop();
  }

  const handleSpin = async () => {
    if (!code.trim()) {
      toast({ title: "Veuillez entrer un code", variant: "destructive" });
      return;
    }

    if (!telegramUsername) {
      toast({ title: "Username Telegram non détecté", variant: "destructive" });
      return;
    }

    setIsSpinning(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/roulette/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, telegram_username: telegramUsername })
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ title: data.error, variant: "destructive" });
        setIsSpinning(false);
        return;
      }

      // Calculer l'angle final
      const sectionAngle = 360 / 8; // 45 degrés par section
      const targetAngle = (data.sectionIndex * sectionAngle) + (Math.random() * sectionAngle);
      const fullRotations = 1800; // 5 tours complets
      const finalRotation = fullRotations + targetAngle;

      setRotation(finalRotation);

      // Afficher le résultat après l'animation
      setTimeout(() => {
        setWonPrize(data.prize);
        setShowResult(true);
        setIsSpinning(false);
      }, 4000);

    } catch (error) {
      console.error('Error spinning:', error);
      toast({ title: "Erreur lors du tirage", variant: "destructive" });
      setIsSpinning(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setCode("");
    setRotation(0);
    setWonPrize(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">🎰 Roulette</h1>

        {/* Roue */}
        <div className="relative w-80 h-80 mx-auto mb-8">
          {/* Flèche indicatrice fixe */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-red-500" />
          </div>

          {/* Roue rotative */}
          <div 
            className="relative w-full h-full transition-transform duration-[4000ms] ease-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* SVG de la roue avec 8 sections */}
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {wheelSections.map((prize, index) => {
                const angle = (360 / 8) * index;
                const nextAngle = (360 / 8) * (index + 1);
                const color = index % 2 === 0 ? '#FFF59D' : '#E8F5E9';
                
                // Calcul des coordonnées pour le path
                const startX = 100 + 95 * Math.cos((angle - 90) * Math.PI / 180);
                const startY = 100 + 95 * Math.sin((angle - 90) * Math.PI / 180);
                const endX = 100 + 95 * Math.cos((nextAngle - 90) * Math.PI / 180);
                const endY = 100 + 95 * Math.sin((nextAngle - 90) * Math.PI / 180);

                return (
                  <g key={index}>
                    <path
                      d={`M 100 100 L ${startX} ${startY} A 95 95 0 0 1 ${endX} ${endY} Z`}
                      fill={color}
                      stroke="#333"
                      strokeWidth="1"
                    />
                    <text
                      x={100 + 60 * Math.cos((angle + 22.5 - 90) * Math.PI / 180)}
                      y={100 + 60 * Math.sin((angle + 22.5 - 90) * Math.PI / 180)}
                      fontSize="10"
                      fill="#333"
                      textAnchor="middle"
                      transform={`rotate(${angle + 22.5}, ${100 + 60 * Math.cos((angle + 22.5 - 90) * Math.PI / 180)}, ${100 + 60 * Math.sin((angle + 22.5 - 90) * Math.PI / 180)})`}
                    >
                      {prize.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Logo au centre */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-gray-800 shadow-lg">
              <img src={logo} alt="RSLiv" className="w-16 h-16 object-contain" />
            </div>
          </div>
        </div>

        {/* Input code */}
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Entre ton code (ex: RSLIV-32589)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isSpinning}
            className="text-center text-lg"
          />
          <Button 
            onClick={handleSpin} 
            disabled={isSpinning}
            className="w-full btn-primary text-lg py-6"
          >
            {isSpinning ? "La roue tourne..." : "🎲 Tourner la roue"}
          </Button>
        </div>
      </div>

      {/* Dialog résultat */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              🎉 FÉLICITATIONS ! 🎉
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <p className="text-lg">Tu as gagné :</p>
            <p className="text-2xl font-bold text-accent">{wonPrize?.name}</p>
            <p className="text-muted-foreground">
              📱 Contacte-nous sur Telegram pour récupérer ton lot !
            </p>
          </div>
          <Button onClick={handleCloseResult} className="w-full">
            Fermer
          </Button>
        </DialogContent>
      </Dialog>

      {/* Menu fixe en bas */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/50 z-50">
        <div className="flex justify-around items-center py-3 px-4">
          <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-accent transition-colors">
            <Home className="w-6 h-6" />
            <span className="text-xs">Accueil</span>
          </button>
          <button onClick={() => navigate("/info")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-accent transition-colors">
            <Info className="w-6 h-6" />
            <span className="text-xs">Info</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-accent">
            <span className="text-2xl">🎰</span>
            <span className="text-xs font-medium">Roulette</span>
          </button>
          <button onClick={() => navigate("/cart")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-accent transition-colors relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs">Panier</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-br from-destructive to-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
