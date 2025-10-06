import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const products = [
  {
    id: 1,
    name: "amnesia OG",
    variety: "Original amnesia",
    farm: "Holland",
    description: "Variété premium cultivée aux Pays-Bas. Arômes puissants et effet énergisant.",
    image: "https://images.unsplash.com/photo-1603909075557-eb4e4aa0cfb6?w=500&auto=format&fit=crop",
    prices: [
      { weight: "1g", price: 10 },
      { weight: "5g", price: 30 },
      { weight: "10g", price: 55 },
    ],
  },
  {
    id: 2,
    name: "Cali spain",
    variety: "Strain Ranger",
    farm: "Espagne",
    description: "Cultivé en Espagne avec des standards californiens. Qualité exceptionnelle.",
    image: "https://images.unsplash.com/photo-1508485622500-3c1c3c1d8d4b?w=500&auto=format&fit=crop",
    prices: [
      { weight: "1g", price: 15 },
      { weight: "5g", price: 50 },
      { weight: "10g", price: 90 },
    ],
  },
  {
    id: 3,
    name: "Purple Haze",
    variety: "Sativa Dominant",
    farm: "California",
    description: "Classique californien aux reflets violets. Effet créatif et euphorique.",
    image: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=500&auto=format&fit=crop",
    prices: [
      { weight: "1g", price: 12 },
      { weight: "5g", price: 45 },
      { weight: "10g", price: 80 },
    ],
  },
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === Number(id));
  const [selectedPrice, setSelectedPrice] = useState(0);

  if (!product) {
    return <div>Product not found</div>;
  }

  const addToCart = () => {
    const selected = product.prices[selectedPrice];
    toast.success(`${product.name} (${selected.weight}) ajouté au panier`);
    console.log("Add to cart:", { product, weight: selected.weight, price: selected.price });
  };

  return (
    <div className="min-h-screen bg-background pb-24 logo-watermark">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 border-b border-border/50 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-card rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <img src={logo} alt="RSLIV Logo" className="w-12 h-12 object-contain" />
          <div className="w-10" />
        </div>
      </div>

      {/* Product image */}
      <div className="relative h-80">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product info */}
      <div className="px-4 py-6 space-y-6 relative z-10">
        {/* Name and tags */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-3">{product.name}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="tag-yellow">{product.variety}</span>
            <span className="tag-green">{product.farm}</span>
          </div>
        </div>

        {/* Description */}
        <div className="card-shop p-4">
          <h2 className="font-semibold text-foreground mb-2">Description</h2>
          <p className="text-sm text-muted-foreground">{product.description}</p>
        </div>

        {/* Price options */}
        <div className="card-shop p-4">
          <h2 className="font-semibold text-foreground mb-3">Options de prix</h2>
          <div className="space-y-2">
            {product.prices.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedPrice(index)}
                className={`w-full flex justify-between items-center p-3 rounded-lg border-2 transition-all ${
                  selectedPrice === index
                    ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10"
                    : "border-border hover:border-[hsl(var(--accent))]/50"
                }`}
              >
                <span className="font-medium text-foreground">{option.weight}</span>
                <span className="text-[hsl(var(--accent))] font-bold">{option.price}€</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add to cart button */}
        <Button
          onClick={addToCart}
          className="w-full btn-primary py-6 text-lg flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          Ajouter au panier - {product.prices[selectedPrice].price}€
        </Button>
      </div>
    </div>
  );
};

export default ProductDetail;