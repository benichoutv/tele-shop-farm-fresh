import { Home, Info as InfoIcon, ShoppingCart, Clock, MessageCircle, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const InfoPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with logo */}
      <div className="pt-6 pb-4 flex justify-center">
        <img src={logo} alt="RSLIV Logo" className="w-24 h-24 object-contain" />
      </div>

      {/* Title */}
      <div className="text-center mb-6 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Informations</h1>
        <p className="text-sm text-muted-foreground">Horaires et moyens de nous contacter</p>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
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
              <span className="text-[hsl(var(--accent))] font-semibold">11h - 00h</span>
            </div>

            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Meetup</span>
              </div>
              <span className="text-[hsl(var(--success))] font-semibold">Disponible</span>
            </div>

            <div className="pt-2">
              <div className="flex items-start gap-2 mb-2">
                <Truck className="w-4 h-4 text-muted-foreground mt-1" />
                <span className="text-foreground font-medium">Livraison</span>
              </div>
              <p className="text-muted-foreground text-xs ml-6 mb-1">
                Gard Vaucluse Bouches-du-Rhône Ardèche Drôme Hérault
              </p>
              <p className="text-[hsl(var(--accent))] font-semibold ml-6">11h - 00h</p>
            </div>
          </div>
        </div>

        {/* Social Networks Section */}
        <div className="card-shop p-5">
          <h2 className="text-xl font-bold text-foreground mb-4">Nos Réseaux</h2>

          <div className="space-y-3">
            <a
              href="https://t.me/RSliv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[hsl(var(--accent))]" />
              </div>
              <div>
                <p className="font-semibold text-[hsl(var(--primary))]">Telegram</p>
                <p className="text-sm text-[hsl(var(--primary))]/80">@RSliv</p>
              </div>
            </a>

            <a
              href="https://snapchat.com/add/rsliv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--tag-yellow))] hover:bg-[hsl(var(--tag-yellow))]/90 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[hsl(var(--tag-yellow))]" />
              </div>
              <div>
                <p className="font-semibold text-[hsl(var(--primary))]">Snapchat</p>
                <p className="text-sm text-[hsl(var(--primary))]/80">rsliv</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-2 px-4">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <Link
            to="/"
            className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors gap-1"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Accueil</span>
          </Link>
          <Link
            to="/info"
            className="flex flex-col items-center text-[hsl(var(--accent))] gap-1"
          >
            <InfoIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Info</span>
          </Link>
          <Link
            to="/cart"
            className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors gap-1"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs">Panier</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default InfoPage;