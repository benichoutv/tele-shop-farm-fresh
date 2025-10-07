import { useState } from "react";
import { Home, Info, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { ordersApi } from "@/lib/api";
import logo from "@/assets/logo.png";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, total, itemCount, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    if (items.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }

    try {
      setIsSubmitting(true);
      
      await ordersApi.create({
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_address: formData.address,
        items: items.map(item => ({
          product_id: item.productId,
          product_name: item.name,
          weight: item.weight,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
      });
      
      toast.success("Commande envoyée ! Vous recevrez une confirmation sur Telegram.");
      clearCart();
      navigate("/");
    } catch (error) {
      console.error("Erreur commande:", error);
      toast.error("Erreur lors de l'envoi de la commande");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 logo-watermark">
      {/* Header with logo */}
      <div className="pt-6 pb-4 flex justify-center relative z-10">
        <img src={logo} alt="RSLIV Logo" className="w-32 h-32 object-contain drop-shadow-2xl" />
      </div>

      {/* Title */}
      <div className="text-center mb-8 px-4 relative z-10">
        <h1 className="text-3xl font-bold text-foreground">Mon Panier</h1>
      </div>

      {/* Cart items */}
      <div className="px-4 mb-6 relative z-10">
        {items.length === 0 ? (
          <div className="card-shop p-8 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Votre panier est vide</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={`${item.productId}-${item.weight}`} className="card-shop p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.variety}</p>
                    <p className="text-sm text-muted-foreground">{item.weight}</p>
                    <p className="text-accent font-bold">{item.price.toFixed(2)}€</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId, item.weight)}
                    className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Quantity controls */}
                <div className="flex items-center justify-end gap-3 mt-3">
                  <button
                    onClick={() => updateQuantity(item.productId, item.weight, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4 text-accent" />
                  </button>
                  <span className="text-foreground font-semibold w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.weight, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-accent" />
                  </button>
                  <span className="text-muted-foreground text-sm ml-2">
                    = {(item.price * item.quantity).toFixed(2)}€
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order form */}
      {items.length > 0 && (
        <form onSubmit={handleOrder} className="px-4 space-y-5 relative z-10">
          <div className="card-shop p-5">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Informations de livraison
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nom complet
                </label>
                <Input
                  type="text"
                  placeholder="Votre nom"
                  className="input-shop"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Téléphone
                </label>
                <Input
                  type="tel"
                  placeholder="06 12 34 56 78"
                  className="input-shop"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Adresse
                </label>
                <Input
                  type="text"
                  placeholder="Adresse de livraison"
                  className="input-shop"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Total and order button */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-2">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-[hsl(var(--accent))]">
                {total.toFixed(2)}€
              </span>
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-accent text-black hover:bg-accent/90 font-bold rounded-xl py-6 text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? "Envoi en cours..." : "Commander"}
            </Button>
          </div>
        </form>
      )}

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
            className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 gap-1"
          >
            <Info className="w-6 h-6" />
            <span className="text-xs font-medium">Info</span>
          </Link>
          <Link
            to="/cart"
            className="flex flex-col items-center nav-item-active gap-1 relative transition-all duration-300"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs font-semibold">Panier</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-br from-destructive to-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg floating-badge">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Cart;