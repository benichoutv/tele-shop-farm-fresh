import { useState } from "react";
import { Home as HomeIcon, Info, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data
const products = [
  {
    id: 1,
    name: "amnesia OG",
    variety: "Original amnesia",
    farm: "Holland",
    price: 30,
    image: "https://images.unsplash.com/photo-1603909075557-eb4e4aa0cfb6?w=500&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Cali spain",
    variety: "Strain Ranger",
    farm: "Espagne",
    price: 50,
    image: "https://images.unsplash.com/photo-1508485622500-3c1c3c1d8d4b?w=500&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Purple Haze",
    variety: "Sativa Dominant",
    farm: "California",
    price: 45,
    image: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=500&auto=format&fit=crop",
  },
];

const categories = ["Toutes les catégories", "Weed", "Hash", "Edibles"];
const farms = ["Toutes les farms", "Holland", "Espagne", "California", "France"];

const Home = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Toutes les catégories");
  const [selectedFarm, setSelectedFarm] = useState("Toutes les farms");
  
  // Mock Telegram username
  const telegramUsername = "Benichou";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with logo */}
      <div className="pt-6 pb-4 flex justify-center">
        <img src={logo} alt="RSLIV Logo" className="w-24 h-24 object-contain" />
      </div>

      {/* Welcome message */}
      <div className="text-center mb-6 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Salut {telegramUsername} 👋
        </h1>
        <p className="text-xl font-semibold text-foreground">Liste des produits</p>
      </div>

      {/* Filters */}
      <div className="px-4 mb-6 space-y-3">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="input-shop">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedFarm} onValueChange={setSelectedFarm}>
          <SelectTrigger className="input-shop">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {farms.map((farm) => (
              <SelectItem key={farm} value={farm}>
                {farm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products grid */}
      <div className="px-4 grid grid-cols-2 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="card-shop cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-3">
              <h3 className="font-semibold text-foreground mb-2">{product.name}</h3>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="tag-yellow">{product.variety}</span>
                <span className="tag-green">{product.farm}</span>
              </div>
              <p className="text-[hsl(var(--accent))] font-bold text-lg">{product.price}€</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-2 px-4">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <Link
            to="/"
            className="flex flex-col items-center text-[hsl(var(--accent))] gap-1"
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Accueil</span>
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
            className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors gap-1 relative"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs">Panier</span>
            <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              1
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Home;