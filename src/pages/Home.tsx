import { useState, useEffect } from "react";
import { Home as HomeIcon, Info, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import ProductModal from "@/components/ProductModal";
import { productsApi, categoriesApi, settingsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductPrice {
  id?: number;
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
  category_name?: string;
}

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState("Toutes les catégories");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["Toutes les catégories"]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addToCart, itemCount } = useCart();
  
  const telegramUsername = "Benichou";

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load settings
        const settings = await settingsApi.getAll();
        setWelcomeMessage(settings.welcome_message || "Bienvenue sur l'app RSlive 👋");

        // Load categories
        const categoriesData = await categoriesApi.getAll();
        setCategories(["Toutes les catégories", ...categoriesData.map((c: any) => c.name)]);

        // Load products
        const productsData = await productsApi.getAll();
        
        // Map API data to frontend format
        const mappedProducts = productsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          variety: p.variety || "",
          farm: p.farm || "",
          image: p.image_url || "",
          mediaUrl: p.video_url || p.image_url || "",
          mediaType: (p.video_url ? "video" : "image") as "image" | "video",
          description: p.description || "",
          prices: p.prices || [],
          category_name: p.category_name
        }));

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Erreur chargement données:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les produits",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (product: Product, selectedPrice: ProductPrice, quantity: number) => {
    addToCart({
      productId: product.id,
      name: product.name,
      variety: product.variety,
      image: product.image,
      weight: selectedPrice.weight,
      price: selectedPrice.price,
      quantity,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card/30 pb-24 logo-watermark">
      {/* Header with logo */}
      <div className="pt-1 pb-1 flex justify-center relative z-10 bg-card/50 backdrop-blur-sm border-b border-border/30">
        <img 
          src={logo} 
          alt="RSLIV Logo" 
          className="w-28 h-28 object-contain drop-shadow-2xl" 
        />
      </div>

      {/* Welcome message */}
      <div className="text-center mb-4 px-4 relative z-10 mt-3 overflow-hidden">
        <div className="scrolling-text">
          <span className="text-lg font-bold text-foreground animate-fade-in">
            {welcomeMessage} {telegramUsername}
          </span>
        </div>
        <p className="text-xs font-medium text-muted-foreground mt-1">Liste des produits</p>
      </div>

      {/* Filter by category */}
      <div className="px-4 mb-4 relative z-10">
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
      </div>

      {/* Products grid */}
      <div className="px-4 grid grid-cols-2 gap-4 relative z-10">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            Aucun produit disponible
          </div>
        ) : (
          products
            .filter(p => selectedCategory === "Toutes les catégories" || p.category_name === selectedCategory)
            .map((product, index) => (
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
          ))
        )}
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
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-br from-destructive to-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg floating-badge">
                {itemCount}
              </span>
            )}
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
