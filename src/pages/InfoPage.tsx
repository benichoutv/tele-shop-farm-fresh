import { useState } from "react";
import { Home, Info as InfoIcon, ShoppingCart, Clock, MessageCircle, Truck, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

interface SocialNetwork {
  id: string;
  name: string;
  username: string;
  url: string;
}

// Récupération des paramètres depuis localStorage
const getSettings = () => {
  const savedSocialNetworks = localStorage.getItem("socialNetworks");
  return {
    telegramLink: localStorage.getItem("telegramLink") || "https://t.me/RSliv",
    whatsappLink: localStorage.getItem("whatsappLink") || "https://wa.me/33612345678",
    signalLink: localStorage.getItem("signalLink") || "https://signal.me/#p/+33612345678",
    orderHours: localStorage.getItem("orderHours") || "11h - 00h",
    meetupStatus: localStorage.getItem("meetupStatus") || "Disponible",
    deliveryZone: localStorage.getItem("deliveryZone") || "Gard Vaucluse Bouches-du-Rhône Ardèche Drôme Hérault",
    deliveryHours: localStorage.getItem("deliveryHours") || "11h - 00h",
    socialNetworks: savedSocialNetworks ? JSON.parse(savedSocialNetworks) as SocialNetwork[] : [
      { id: "1", name: "Telegram", username: "@RSliv", url: "https://t.me/RSliv" },
      { id: "2", name: "Snapchat", username: "rsliv", url: "https://snapchat.com/add/rsliv" }
    ]
  };
};

const InfoPage = () => {
  const settings = getSettings();
  const navigate = useNavigate();
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [pressProgress, setPressProgress] = useState(0);

  const handleLogoTouchStart = () => {
    const timer = setTimeout(() => {
      navigate("/admin");
      setPressProgress(0);
    }, 5000); // 5 seconds long press
    setLongPressTimer(timer);

    // Progress animation
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 2;
      setPressProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, 100);
  };

  const handleLogoTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      setPressProgress(0);
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-24 logo-watermark">
      {/* Header with logo */}
      <div className="pt-6 pb-4 flex justify-center relative z-10">
        <div className="relative">
          <img 
            src={logo} 
            alt="RSLIV Logo" 
            className="w-32 h-32 object-contain drop-shadow-2xl cursor-pointer select-none transition-transform active:scale-95" 
            onTouchStart={handleLogoTouchStart}
            onTouchEnd={handleLogoTouchEnd}
            onMouseDown={handleLogoTouchStart}
            onMouseUp={handleLogoTouchEnd}
            onMouseLeave={handleLogoTouchEnd}
          />
          {pressProgress > 0 && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-border/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-100"
                style={{ width: `${pressProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8 px-4 relative z-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Informations</h1>
        <p className="text-sm text-muted-foreground">Horaires et moyens de nous contacter</p>
      </div>

      {/* Content */}
      <div className="px-4 space-y-5 relative z-10">
        {/* Horaires Section */}
        <div className="card-shop p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[hsl(var(--primary))]" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Horaires</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Prise de commande</span>
              </div>
              <span className="text-[hsl(var(--accent))] font-semibold">{settings.orderHours}</span>
            </div>

            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Meetup</span>
              </div>
              <span className="text-[hsl(var(--success))] font-semibold">{settings.meetupStatus}</span>
            </div>

            <div className="pt-2">
              <div className="flex items-start gap-2 mb-2">
                <Truck className="w-4 h-4 text-muted-foreground mt-1" />
                <span className="text-foreground font-medium">Livraison</span>
              </div>
              <p className="text-muted-foreground text-xs ml-6 mb-1">
                {settings.deliveryZone}
              </p>
              <p className="text-[hsl(var(--accent))] font-semibold ml-6">{settings.deliveryHours}</p>
            </div>
          </div>
        </div>

        {/* Commander via Section */}
        <div className="card-shop p-5">
          <h2 className="text-xl font-bold text-foreground mb-2">Commander via</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Vous pouvez passer commande ou obtenir plus d'infos directement via :
          </p>

          <div className="space-y-3">
            <a
              href={settings.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-[#0088cc]/20 to-[#0088cc]/10 border border-[#0088cc]/30 hover:border-[#0088cc] transition-all hover:scale-[1.02]"
            >
              <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Telegram</p>
                <p className="text-xs text-muted-foreground">Messagerie sécurisée</p>
              </div>
            </a>

            <a
              href={settings.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-[#25D366]/20 to-[#25D366]/10 border border-[#25D366]/30 hover:border-[#25D366] transition-all hover:scale-[1.02]"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Réponse rapide</p>
              </div>
            </a>

            <a
              href={settings.signalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-[#3a76f0]/20 to-[#3a76f0]/10 border border-[#3a76f0]/30 hover:border-[#3a76f0] transition-all hover:scale-[1.02]"
            >
              <div className="w-10 h-10 rounded-full bg-[#3a76f0] flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Signal</p>
                <p className="text-xs text-muted-foreground">Confidentialité maximale</p>
              </div>
            </a>
          </div>
        </div>

        {/* Social Networks Section */}
        {settings.socialNetworks.length > 0 && (
          <div className="card-shop p-5">
            <h2 className="text-xl font-bold text-foreground mb-4">Nos Réseaux</h2>

            <div className="space-y-3">
              {settings.socialNetworks.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[hsl(var(--accent))]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(var(--primary))]">{social.name}</p>
                    <p className="text-sm text-[hsl(var(--primary))]/80">{social.username}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 py-3 px-4 z-50 shadow-2xl">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <Link
            to="/"
            className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 gap-1"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Accueil</span>
          </Link>
          <Link
            to="/info"
            className="flex flex-col items-center nav-item-active gap-1 transition-all duration-300"
          >
            <InfoIcon className="w-6 h-6" />
            <span className="text-xs font-semibold">Info</span>
          </Link>
          <Link
            to="/cart"
            className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 gap-1"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs font-medium">Panier</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default InfoPage;
