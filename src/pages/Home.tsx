import { useState } from "react";
import { Home as HomeIcon, Info, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import ProductModal from "@/components/ProductModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductPrice {
  weight: string;
  price: number;
}

interface Product {
  id: number;
  name: string;
  variety: string;
  farm: string;
  image: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  description: string;
  prices: ProductPrice[];
}

// Mock data
const products: Product[] = [
  {
    id: 1,
    name: "amnesia OG",
    variety: "Original amnesia",
    farm: "Holland",
    image: "https://images.unsplash.com/photo-1603909075557-eb4e4aa0cfb6?w=500&auto=format&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1603909075557-eb4e4aa0cfb6?w=500&auto=format&fit=crop",
    mediaType: "image",
    description: "Une variété classique d'Amsterdam avec des arômes terreux et des effets équilibrés",
    prices: [
      { weight: "1g", price: 12 },
      { weight: "5g", price: 55 },
      { weight: "10g", price: 100 }
    ]
  },
  {
    id: 2,
    name: "Cali spain",
    variety: "Strain Ranger",
    farm: "Espagne",
    image: "https://images.unsplash.com/photo-1508485622500-3c1c3c1d8d4b?w=500&auto=format&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1508485622500-3c1c3c1d8d4b?w=500&auto=format&fit=crop",
    mediaType: "image",
    description: "Variété premium d'Espagne avec des arômes fruités et sucrés",
    prices: [
      { weight: "1g", price: 15 },
      { weight: "5g", price: 70 },
      { weight: "10g", price: 130 }
    ]
  },
  {
    id: 3,
    name: "Purple Haze",
    variety: "Sativa Dominant",
    farm: "California",
    image: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=500&auto=format&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=500&auto=format&fit=crop",
    mediaType: "video",
    description: "Une sativa légendaire de Californie aux effets énergisants",
    prices: [
      { weight: "1g", price: 14 },
      { weight: "5g", price: 65 },
      { weight: "10g", price: 120 }
    ]
  },
];

const categories = ["Toutes les catégories", "Weed", "Hash", "Edibles"];
const farms = ["Toutes les farms", "Holland", "Espagne", "California", "France"];

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState("Toutes les catégories");
  const [selectedFarm, setSelectedFarm] = useState("Toutes les farms");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock Telegram username
  const telegramUsername = "Benichou";

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (product: Product, selectedPrice: ProductPrice, quantity: number) => {
    console.log("Ajout au panier:", { product, selectedPrice, quantity });
    // TODO: Implémenter la vraie logique d'ajout au panier
  };

  return (
    <div className="min-h-screen bg-background pb-24 logo-watermark">
      {/* Header with logo */}
      <div className="pt-3 pb-2 flex justify-center relative z-10 bg-card/50 backdrop-blur-sm border-b border-border/30">
        <img src={logo} alt="RSLIV Logo" className="w-36 h-36 object-contain drop-shadow-2xl" />
      </div>

      {/* Welcome message */}
      <div className="text-center mb-4 px-4 relative z-10 mt-3">
        <h1 className="text-lg font-bold text-foreground mb-0.5 animate-fade-in">
          Salut <span className="gradient-text">{telegramUsername}</span> 👋
        </h1>
        <p className="text-xs font-medium text-muted-foreground">Liste des produits</p>
      </div>

      {/* Filters */}
      <div className="px-4 mb-4 space-y-2 relative z-10">
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

      {/* Products grid - Prix masqués */}
      <div className="px-4 grid grid-cols-2 gap-4 relative z-10">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="card-shop cursor-pointer hover:scale-[1.03] transition-all duration-300"
            onClick={() => handleProductClick(product)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="relative overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-40 object-cover transition-transform duration-500 hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="p-4 relative">
              <h3 className="font-bold text-foreground mb-2 text-base">{product.name}</h3>
              <div className="flex flex-wrap gap-1.5">
                <span className="tag-yellow">{product.variety}</span>
                <span className="tag-green">{product.farm}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 py-3 px-4 z-50 shadow-2xl">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <Link
            to="/"
            className="flex flex-col items-center nav-item-active gap-1 transition-all duration-300"
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs font-semibold">Accueil</span>
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
            className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 gap-1 relative"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs font-medium">Panier</span>
            <span className="absolute -top-2 -right-2 bg-gradient-to-br from-destructive to-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg floating-badge">
              1
            </span>
          </Link>
        </div>
      </nav>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default Home;
