import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

interface Prize {
  id: number;
  name: string;
  probability: number;
  color: string;
}

// Couleurs fixes harmonisées avec le logo de l'app
const WHEEL_COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

export default function Roulette() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Prize | null>(null);
  const [settings, setSettings] = useState({ active: false, require_code: true });
  const [telegramId, setTelegramId] = useState("");

  useEffect(() => {
    // Get Telegram user ID
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      setTelegramId(tg.initDataUnsafe.user.id.toString());
    }

    // Load roulette settings and prizes
    fetch('/api/roulette/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error loading settings:', err));

    fetch('/api/roulette/prizes')
      .then(res => res.json())
      .then(data => {
        console.log('📦 Prizes loaded:', data);
        setPrizes(data);
      })
      .catch(err => console.error('Error loading prizes:', err));
  }, []);

  const handleSpin = async () => {
    if (!telegramId) {
      toast({
        title: "Erreur",
        description: "Utilisez l'app depuis Telegram",
        variant: "destructive"
      });
      return;
    }

    if (settings.require_code && !code.trim()) {
      toast({
        title: "Code requis",
        description: "Veuillez entrer un code",
        variant: "destructive"
      });
      return;
    }

    setIsSpinning(true);
    setResult(null);

    try {
      // Verify code first if required
      if (settings.require_code) {
        const verifyRes = await fetch('/api/roulette/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, telegram_id: telegramId })
        });

        if (!verifyRes.ok) {
          const error = await verifyRes.json();
          throw new Error(error.error);
        }
      }

      // Spin the wheel
      const spinRes = await fetch('/api/roulette/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          username: (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.username,
          code: settings.require_code ? code : null
        })
      });

      if (!spinRes.ok) {
        const error = await spinRes.json();
        throw new Error(error.error);
      }

      const data = await spinRes.json();
      
      // Calculate rotation to land on prize
      const prizeIndex = prizes.findIndex(p => p.id === data.prize.id);
      const segmentAngle = 360 / prizes.length;
      const targetAngle = prizeIndex * segmentAngle;
      const spins = 5; // Number of full rotations
      const finalRotation = 360 * spins + targetAngle;
      
      setRotation(finalRotation);
      
      // Show result after animation
      setTimeout(() => {
        setResult(data.prize);
        setIsSpinning(false);
        toast({
          title: "🎉 Félicitations!",
          description: `Vous avez gagné: ${data.prize.name}`,
        });
      }, 4000);

    } catch (error: any) {
      setIsSpinning(false);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de tourner la roulette",
        variant: "destructive"
      });
    }
  };

  if (!settings.active) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-card/30 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🎰 Roulette désactivée</h1>
          <p className="text-muted-foreground mb-6">La roulette n'est pas disponible pour le moment</p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/30 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button onClick={() => navigate("/")} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">🎰 Roulette</h1>
          <div className="w-20"></div>
        </div>

        {/* Roulette Wheel */}
        <div className="relative mb-8">
          {/* Arrow indicator at the top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg"></div>
          </div>
          
          {/* Wheel container */}
          <div className="relative w-full aspect-square">
            {prizes.length > 0 ? (
              <svg
                viewBox="0 0 400 400"
                className="w-full h-full drop-shadow-2xl"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                }}
              >
                {/* Background circle */}
                <circle cx="200" cy="200" r="190" fill="white" stroke="#1a1a1a" strokeWidth="8"/>
                
                {/* Prize segments */}
                {prizes.map((prize, index) => {
                const segmentAngle = 360 / prizes.length;
                const startAngle = index * segmentAngle - 90; // -90 to start at top
                const endAngle = startAngle + segmentAngle;
                
                // Convert angles to radians
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                
                // Calculate path points
                const x1 = 200 + 185 * Math.cos(startRad);
                const y1 = 200 + 185 * Math.sin(startRad);
                const x2 = 200 + 185 * Math.cos(endRad);
                const y2 = 200 + 185 * Math.sin(endRad);
                
                const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                
                // Path for the segment
                const pathData = `M 200 200 L ${x1} ${y1} A 185 185 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                
                // Text position (middle of segment, at 60% radius)
                const textAngle = startAngle + segmentAngle / 2;
                const textRad = (textAngle * Math.PI) / 180;
                const textX = 200 + 110 * Math.cos(textRad);
                const textY = 200 + 110 * Math.sin(textRad);
                
                return (
                  <g key={prize.id}>
                    {/* Segment */}
                    <path
                      d={pathData}
                      fill={WHEEL_COLORS[index % WHEEL_COLORS.length]}
                      stroke="white"
                      strokeWidth="3"
                    />
                    
                    {/* Prize name */}
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="16"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                    >
                      {prize.name}
                    </text>
                  </g>
                );
              })}
              
              {/* Center circle with logo */}
              <circle cx="200" cy="200" r="60" fill="white" stroke="#1a1a1a" strokeWidth="4"/>
              <image
                href={logo}
                x="145"
                y="145"
                width="110"
                height="110"
                preserveAspectRatio="xMidYMid slice"
              />
            </svg>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">Chargement de la roulette...</p>
            </div>
          )}
          </div>
        </div>

        {/* Code Input & Spin Button */}
        <div className="space-y-4">
          {settings.require_code && (
            <div>
              <Input
                type="text"
                placeholder="Entrez votre code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isSpinning}
                className="text-center text-lg font-mono"
                maxLength={8}
              />
            </div>
          )}

          <Button
            onClick={handleSpin}
            disabled={isSpinning || (settings.require_code && !code.trim())}
            className="w-full h-14 text-lg font-bold"
            size="lg"
          >
            {isSpinning ? "🎰 Tournage..." : "🎯 TOURNER LA ROUE"}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-8 p-6 rounded-2xl bg-card border-2 border-border text-center animate-scale-in">
            <h2 className="text-2xl font-bold mb-2">🎉 Félicitations!</h2>
            <p className="text-lg text-muted-foreground mb-4">Vous avez gagné:</p>
            <div
              className="text-3xl font-bold py-4 px-6 rounded-xl mx-auto inline-block"
              style={{ 
                backgroundColor: WHEEL_COLORS[prizes.findIndex(p => p.id === result.id) % WHEEL_COLORS.length], 
                color: 'white' 
              }}
            >
              {result.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
