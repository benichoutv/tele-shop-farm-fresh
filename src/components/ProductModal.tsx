import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductPrice {
  weight: string;
  price: number;
}

interface Product {
  id: number;
  name: string;
  variety: string;
  farm: string;
  description: string;
  image: string;
  mediaUrl: string;
  videoUrl?: string;
  mediaType: "image" | "video";
  prices: ProductPrice[];
}

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedPrice: ProductPrice, quantity: number) => void;
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | null>(null);
  const [quantity, setQuantity] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

  // Auto-play video once on mobile when modal opens
  useEffect(() => {
    if (isOpen && isMobile && videoRef.current && product?.videoUrl) {
      videoRef.current.play().catch(err => {
        console.log("Autoplay prevented:", err);
      });
    }
  }, [isOpen, isMobile, product?.videoUrl]);

  if (!product) return null;

  const handleAddToCart = () => {
    if (!selectedPrice) {
      toast({ 
        title: "Veuillez sélectionner un poids",
        variant: "destructive" 
      });
      return;
    }

    onAddToCart(product, selectedPrice, quantity);
    toast({ 
      title: "Produit ajouté au panier",
      description: `${quantity}x ${product.name} (${selectedPrice.weight})`
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#16291b] text-white border-[#96e635]/20 max-w-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-0 overflow-y-auto">
          {/* Media Section - priorité à la vidéo si disponible */}
          <div className="relative bg-black/30 flex-shrink-0 w-full aspect-video overflow-hidden max-h-[50vh] md:max-h-none">
            {product.videoUrl ? (
              <video
                ref={videoRef}
                src={product.videoUrl}
                controls
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <img
                src={product.image}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>

          {/* Info Section */}
          <div className="p-6 flex flex-col">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-3 animate-fadeIn">{product.name}</h2>
              
              <div className="flex gap-2 mb-4">
                <span className="tag-yellow">{product.variety}</span>
                <span className="tag-green">{product.farm}</span>
              </div>

              <p className="text-white/80 mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Price Selection */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-[#96e635]">Choisissez votre quantité</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.prices.map((price, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPrice(price)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedPrice?.weight === price.weight
                          ? "border-[#96e635] bg-[#96e635]/10 scale-105"
                          : "border-white/20 hover:border-[#96e635]/50 hover:scale-102"
                      }`}
                    >
                      <div className="font-bold text-lg">{price.weight}</div>
                      <div className="text-[#96e635] font-semibold">{price.price}€</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              {selectedPrice && (
                <div className="mb-6 animate-fadeIn">
                  <h3 className="font-semibold mb-3 text-[#96e635]">Quantité</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-bold"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Total Price */}
              {selectedPrice && (
                <div className="mb-6 p-4 rounded-lg bg-white/5 border border-[#96e635]/20">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Total</span>
                    <span className="text-2xl font-bold text-[#96e635]">
                      {(selectedPrice.price * quantity).toFixed(2)}€
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full bg-accent text-black hover:bg-accent/90 font-bold rounded-xl py-6 text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Ajouter au panier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
