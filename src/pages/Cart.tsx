import { useState } from "react";
import { Home, Info, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Cart = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 2,
      name: "Cali spain",
      weight: "5g",
      quantity: 1,
      price: 50,
      image: "https://images.unsplash.com/photo-1508485622500-3c1c3c1d8d4b?w=500&auto=format&fit=crop",
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
    toast.success("Produit retiré du panier");
  };

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    // Here would be the Telegram API call
    toast.success("Commande envoyée ! Vous recevrez une confirmation sur Telegram.");
    console.log("Order:", { items: cartItems, customer: formData, total });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with logo */}
      <div className="pt-6 pb-4 flex justify-center">
        <img src={logo} alt="RSLIV Logo" className="w-24 h-24 object-contain" />
      </div>

      {/* Title */}
      <div className="text-center mb-6 px-4">
        <h1 className="text-2xl font-bold text-foreground">Mon Panier</h1>
      </div>

      {/* Cart items */}
      <div className="px-4 mb-6">
        {cartItems.length === 0 ? (
          <div className="card-shop p-8 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Votre panier est vide</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="card-shop p-4 flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.weight} × {item.quantity}
                  </p>
                  <p className="text-[hsl(var(--accent))] font-bold">{item.price.toFixed(2)}€</p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order form */}
      {cartItems.length > 0 && (
        <form onSubmit={handleOrder} className="px-4 space-y-4">
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
            <Button type="submit" className="w-full btn-primary py-6 text-lg">
              Commander
            </Button>
          </div>
        </form>
      )}

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
            className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors gap-1"
          >
            <Info className="w-6 h-6" />
            <span className="text-xs">Info</span>
          </Link>
          <Link
            to="/cart"
            className="flex flex-col items-center text-[hsl(var(--accent))] gap-1 relative"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs font-medium">Panier</span>
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Cart;