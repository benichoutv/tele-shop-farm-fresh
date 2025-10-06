import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Settings, LogOut, Video, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface ProductPrice {
  weight: string;
  price: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  farm: string;
  description: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  prices: ProductPrice[];
}

interface AppSettings {
  welcomeMessage: string;
  telegramLink: string;
  whatsappLink: string;
  signalLink: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"products" | "settings">("products");
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Mock data - remplacer par vraies données du backend
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Amnesia Haze",
      category: "Sativa",
      farm: "Green Valley Farm",
      description: "Une variété sativa classique avec des arômes citronnés",
      mediaUrl: "/placeholder.svg",
      mediaType: "image",
      prices: [
        { weight: "1g", price: 12 },
        { weight: "5g", price: 55 },
        { weight: "10g", price: 100 }
      ]
    }
  ]);

  const [settings, setSettings] = useState<AppSettings>({
    welcomeMessage: localStorage.getItem("welcomeMessage") || "Bienvenue sur l'app RSlive 👋",
    telegramLink: "https://t.me/votre_compte",
    whatsappLink: "https://wa.me/33612345678",
    signalLink: "https://signal.me/#p/+33612345678"
  });

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    farm: "",
    description: "",
    mediaUrl: "",
    mediaType: "image" as "image" | "video",
    prices: [{ weight: "1g", price: 0 }]
  });

  const handleLogout = () => {
    navigate("/admin");
    toast({ title: "Déconnexion réussie" });
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "",
      farm: "",
      description: "",
      mediaUrl: "",
      mediaType: "image",
      prices: [{ weight: "1g", price: 0 }]
    });
    setShowProductDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      farm: product.farm,
      description: product.description,
      mediaUrl: product.mediaUrl,
      mediaType: product.mediaType,
      prices: product.prices
    });
    setShowProductDialog(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      setProducts(products.filter(p => p.id !== id));
      toast({ title: "Produit supprimé avec succès" });
    }
  };

  const handleSaveProduct = () => {
    if (!formData.name || !formData.category || !formData.farm) {
      toast({ title: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...editingProduct, ...formData }
          : p
      ));
      toast({ title: "Produit modifié avec succès" });
    } else {
      const newProduct: Product = {
        id: Math.max(...products.map(p => p.id), 0) + 1,
        ...formData
      };
      setProducts([...products, newProduct]);
      toast({ title: "Produit ajouté avec succès" });
    }
    
    setShowProductDialog(false);
  };

  const handleAddPrice = () => {
    setFormData({
      ...formData,
      prices: [...formData.prices, { weight: "", price: 0 }]
    });
  };

  const handleRemovePrice = (index: number) => {
    setFormData({
      ...formData,
      prices: formData.prices.filter((_, i) => i !== index)
    });
  };

  const handlePriceChange = (index: number, field: "weight" | "price", value: string | number) => {
    const newPrices = [...formData.prices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setFormData({ ...formData, prices: newPrices });
  };

  const handleSaveSettings = () => {
    localStorage.setItem("welcomeMessage", settings.welcomeMessage);
    toast({ title: "Paramètres sauvegardés avec succès" });
  };

  return (
    <div className="min-h-screen bg-[#16291b] text-white relative">
      <div className="logo-watermark" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src="/src/assets/logo.png" alt="Logo" className="w-16 h-16 rounded-full" />
            <h1 className="text-3xl font-bold">Administration</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[#96e635]/20">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === "products" 
                ? "text-[#96e635]" 
                : "text-white/60 hover:text-white"
            }`}
          >
            Produits
            {activeTab === "products" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#96e635]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === "settings" 
                ? "text-[#96e635]" 
                : "text-white/60 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Paramètres
            {activeTab === "settings" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#96e635]" />
            )}
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Gestion des produits</h2>
              <Button onClick={handleAddProduct} className="btn-primary gap-2">
                <Plus className="w-4 h-4" />
                Ajouter un produit
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="card-shop p-4">
                  <div className="relative mb-3 rounded-lg overflow-hidden h-48">
                    {product.mediaType === "image" ? (
                      <img 
                        src={product.mediaUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video 
                        src={product.mediaUrl}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 right-2">
                      {product.mediaType === "image" ? (
                        <Image className="w-5 h-5 text-white" />
                      ) : (
                        <Video className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  <div className="flex gap-2 mb-2">
                    <span className="tag-yellow">{product.category}</span>
                    <span className="tag-green">{product.farm}</span>
                  </div>
                  <p className="text-sm text-white/70 mb-3 line-clamp-2">{product.description}</p>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleEditProduct(product)}
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      onClick={() => handleDeleteProduct(product.id)}
                      variant="destructive" 
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold mb-6">Paramètres de l'application</h2>
            
            <div className="card-shop p-6 space-y-6">
              <div>
                <Label className="text-white mb-2 block">Message d&apos;accueil</Label>
                <Input
                  value={settings.welcomeMessage}
                  onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                  placeholder="Bienvenue sur l'app RSlive 👋"
                  className="input-shop"
                />
                <p className="text-sm text-white/60 mt-1">
                  Ce message s&apos;affichera en défilement sur la page d&apos;accueil
                </p>
              </div>

              <div>
                <Label className="text-white mb-2 block">Lien Telegram</Label>
                <Input
                  value={settings.telegramLink}
                  onChange={(e) => setSettings({ ...settings, telegramLink: e.target.value })}
                  placeholder="https://t.me/votre_compte"
                  className="input-shop"
                />
                <p className="text-sm text-white/60 mt-1">
                  Lien pour contacter via Telegram
                </p>
              </div>

              <div>
                <Label className="text-white mb-2 block">Lien WhatsApp</Label>
                <Input
                  value={settings.whatsappLink}
                  onChange={(e) => setSettings({ ...settings, whatsappLink: e.target.value })}
                  placeholder="https://wa.me/33612345678"
                  className="input-shop"
                />
                <p className="text-sm text-white/60 mt-1">
                  Lien WhatsApp (format: https://wa.me/numéro)
                </p>
              </div>

              <div>
                <Label className="text-white mb-2 block">Lien Signal</Label>
                <Input
                  value={settings.signalLink}
                  onChange={(e) => setSettings({ ...settings, signalLink: e.target.value })}
                  placeholder="https://signal.me/#p/+33612345678"
                  className="input-shop"
                />
                <p className="text-sm text-white/60 mt-1">
                  Lien Signal (format: https://signal.me/#p/numéro)
                </p>
              </div>

              <Button onClick={handleSaveSettings} className="btn-primary w-full">
                Sauvegarder les paramètres
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="bg-[#16291b] text-white border-[#96e635]/20 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-white mb-2 block">Nom du produit *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Amnesia Haze"
                className="input-shop"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Catégorie *</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Sativa"
                  className="input-shop"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Ferme *</Label>
                <Input
                  value={formData.farm}
                  onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                  placeholder="Ex: Green Valley"
                  className="input-shop"
                />
              </div>
            </div>

            <div>
              <Label className="text-white mb-2 block">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du produit..."
                className="input-shop min-h-[100px]"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Type de média</Label>
              <div className="flex gap-4 mb-2">
                <button
                  onClick={() => setFormData({ ...formData, mediaType: "image" })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    formData.mediaType === "image" 
                      ? "bg-[#96e635] text-[#16291b]" 
                      : "bg-white/10 text-white"
                  }`}
                >
                  <Image className="w-4 h-4" />
                  Image
                </button>
                <button
                  onClick={() => setFormData({ ...formData, mediaType: "video" })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    formData.mediaType === "video" 
                      ? "bg-[#96e635] text-[#16291b]" 
                      : "bg-white/10 text-white"
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Vidéo
                </button>
              </div>
              <Input
                value={formData.mediaUrl}
                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                placeholder="URL de l'image ou vidéo"
                className="input-shop"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-white">Prix par poids</Label>
                <Button 
                  onClick={handleAddPrice}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter un prix
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.prices.map((price, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={price.weight}
                      onChange={(e) => handlePriceChange(index, "weight", e.target.value)}
                      placeholder="Ex: 1g"
                      className="input-shop flex-1"
                    />
                    <Input
                      type="number"
                      value={price.price}
                      onChange={(e) => handlePriceChange(index, "price", parseFloat(e.target.value))}
                      placeholder="Prix"
                      className="input-shop flex-1"
                    />
                    {formData.prices.length > 1 && (
                      <Button
                        onClick={() => handleRemovePrice(index)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => setShowProductDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSaveProduct}
                className="btn-primary flex-1"
              >
                {editingProduct ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
