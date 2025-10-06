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

interface SocialNetwork {
  id: string;
  name: string;
  username: string;
  url: string;
}

interface AppSettings {
  welcomeMessage: string;
  telegramLink: string;
  whatsappLink: string;
  signalLink: string;
  orderHours: string;
  meetupStatus: string;
  deliveryZone: string;
  deliveryHours: string;
  socialNetworks: SocialNetwork[];
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

  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSocialNetworks = localStorage.getItem("socialNetworks");
    return {
      welcomeMessage: localStorage.getItem("welcomeMessage") || "Bienvenue sur l'app RSlive 👋",
      telegramLink: localStorage.getItem("telegramLink") || "https://t.me/votre_compte",
      whatsappLink: localStorage.getItem("whatsappLink") || "https://wa.me/33612345678",
      signalLink: localStorage.getItem("signalLink") || "https://signal.me/#p/+33612345678",
      orderHours: localStorage.getItem("orderHours") || "11h - 00h",
      meetupStatus: localStorage.getItem("meetupStatus") || "Disponible",
      deliveryZone: localStorage.getItem("deliveryZone") || "Gard Vaucluse Bouches-du-Rhône Ardèche Drôme Hérault",
      deliveryHours: localStorage.getItem("deliveryHours") || "11h - 00h",
      socialNetworks: savedSocialNetworks ? JSON.parse(savedSocialNetworks) : [
        { id: "1", name: "Telegram", username: "@RSliv", url: "https://t.me/RSliv" },
        { id: "2", name: "Snapchat", username: "rsliv", url: "https://snapchat.com/add/rsliv" }
      ]
    };
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, mediaUrl: reader.result as string });
      toast({ title: `${formData.mediaType === "image" ? "Image" : "Vidéo"} chargée avec succès` });
    };
    reader.readAsDataURL(file);
  };

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

  const handleAddSocialNetwork = () => {
    const newSocial: SocialNetwork = {
      id: Date.now().toString(),
      name: "",
      username: "",
      url: ""
    };
    setSettings({
      ...settings,
      socialNetworks: [...settings.socialNetworks, newSocial]
    });
  };

  const handleRemoveSocialNetwork = (id: string) => {
    setSettings({
      ...settings,
      socialNetworks: settings.socialNetworks.filter(s => s.id !== id)
    });
  };

  const handleSocialNetworkChange = (id: string, field: keyof SocialNetwork, value: string) => {
    setSettings({
      ...settings,
      socialNetworks: settings.socialNetworks.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      )
    });
  };

  const handleSaveSettings = () => {
    localStorage.setItem("welcomeMessage", settings.welcomeMessage);
    localStorage.setItem("telegramLink", settings.telegramLink);
    localStorage.setItem("whatsappLink", settings.whatsappLink);
    localStorage.setItem("signalLink", settings.signalLink);
    localStorage.setItem("orderHours", settings.orderHours);
    localStorage.setItem("meetupStatus", settings.meetupStatus);
    localStorage.setItem("deliveryZone", settings.deliveryZone);
    localStorage.setItem("deliveryHours", settings.deliveryHours);
    localStorage.setItem("socialNetworks", JSON.stringify(settings.socialNetworks));
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
          <div className="max-w-3xl space-y-6">
            <h2 className="text-2xl font-semibold mb-6">Paramètres de l'application</h2>
            
            {/* Message d'accueil */}
            <div className="card-shop p-6 space-y-4">
              <h3 className="text-lg font-semibold text-[#96e635]">Message d'accueil</h3>
              <div>
                <Label className="text-white mb-2 block">Message défilant</Label>
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
            </div>

            {/* Horaires et Disponibilité */}
            <div className="card-shop p-6 space-y-4">
              <h3 className="text-lg font-semibold text-[#96e635]">Horaires et Disponibilité</h3>
              
              <div>
                <Label className="text-white mb-2 block">Horaires de prise de commande</Label>
                <Input
                  value={settings.orderHours}
                  onChange={(e) => setSettings({ ...settings, orderHours: e.target.value })}
                  placeholder="11h - 00h"
                  className="input-shop"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Statut Meetup</Label>
                <Input
                  value={settings.meetupStatus}
                  onChange={(e) => setSettings({ ...settings, meetupStatus: e.target.value })}
                  placeholder="Disponible"
                  className="input-shop"
                />
                <p className="text-sm text-white/60 mt-1">
                  Ex: Disponible, Indisponible, Sur rendez-vous, etc.
                </p>
              </div>

              <div>
                <Label className="text-white mb-2 block">Zone de livraison</Label>
                <Textarea
                  value={settings.deliveryZone}
                  onChange={(e) => setSettings({ ...settings, deliveryZone: e.target.value })}
                  placeholder="Gard Vaucluse Bouches-du-Rhône Ardèche Drôme Hérault"
                  className="input-shop min-h-[80px]"
                />
                <p className="text-sm text-white/60 mt-1">
                  Listez les départements ou zones couverts
                </p>
              </div>

              <div>
                <Label className="text-white mb-2 block">Horaires de livraison</Label>
                <Input
                  value={settings.deliveryHours}
                  onChange={(e) => setSettings({ ...settings, deliveryHours: e.target.value })}
                  placeholder="11h - 00h"
                  className="input-shop"
                />
              </div>
            </div>

            {/* Liens de contact */}
            <div className="card-shop p-6 space-y-4">
              <h3 className="text-lg font-semibold text-[#96e635]">Liens de contact</h3>
              
              <div>
                <Label className="text-white mb-2 block">Lien Telegram</Label>
                <Input
                  value={settings.telegramLink}
                  onChange={(e) => setSettings({ ...settings, telegramLink: e.target.value })}
                  placeholder="https://t.me/votre_compte"
                  className="input-shop"
                />
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
                  Format: https://wa.me/numéro
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
                  Format: https://signal.me/#p/numéro
                </p>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="card-shop p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-[#96e635]">Réseaux sociaux</h3>
                <Button onClick={handleAddSocialNetwork} size="sm" className="btn-primary gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter
                </Button>
              </div>
              
              <p className="text-sm text-white/60 mb-4">
                Configurez les réseaux sociaux qui seront affichés dans la section Info
              </p>

              <div className="space-y-4">
                {settings.socialNetworks.map((social) => (
                  <div key={social.id} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Réseau social</Label>
                      <Button
                        onClick={() => handleRemoveSocialNetwork(social.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-white/80 text-xs mb-1 block">Nom du réseau</Label>
                        <Input
                          value={social.name}
                          onChange={(e) => handleSocialNetworkChange(social.id, "name", e.target.value)}
                          placeholder="Ex: Instagram, Twitter..."
                          className="input-shop"
                        />
                      </div>

                      <div>
                        <Label className="text-white/80 text-xs mb-1 block">Nom d'utilisateur</Label>
                        <Input
                          value={social.username}
                          onChange={(e) => handleSocialNetworkChange(social.id, "username", e.target.value)}
                          placeholder="@utilisateur"
                          className="input-shop"
                        />
                      </div>

                      <div>
                        <Label className="text-white/80 text-xs mb-1 block">Lien complet</Label>
                        <Input
                          value={social.url}
                          onChange={(e) => handleSocialNetworkChange(social.id, "url", e.target.value)}
                          placeholder="https://..."
                          className="input-shop"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {settings.socialNetworks.length === 0 && (
                  <p className="text-center text-white/40 py-8">
                    Aucun réseau social configuré. Cliquez sur "Ajouter" pour en créer un.
                  </p>
                )}
              </div>
            </div>

            <Button onClick={handleSaveSettings} className="btn-primary w-full">
              Sauvegarder tous les paramètres
            </Button>
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="bg-[#16291b] text-white border-[#96e635]/20 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {editingProduct ? "Modifier le produit" : "Gestion des produits"}
            </DialogTitle>
            <p className="text-white/60 text-sm">
              Gérez votre catalogue de produits
            </p>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Nom et Variété */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/80">Nom du produit *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="amnesia OG"
                  className="input-shop bg-[#1a3422] border-[#96e635]/30 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Variété *</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Original amnesia"
                  className="input-shop bg-[#1a3422] border-[#96e635]/30 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            {/* Ferme et Catégorie */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/80">Ferme *</Label>
                <Input
                  value={formData.farm}
                  onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                  placeholder="Holland"
                  className="input-shop bg-[#1a3422] border-[#96e635]/30 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Catégorie</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Weed"
                  className="input-shop bg-[#1a3422] border-[#96e635]/30 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            {/* Image et Vidéo Upload */}
            <div className="grid grid-cols-2 gap-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-white/80">Image du produit</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setFormData({ ...formData, mediaType: "image" });
                      handleFileUpload(e);
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[#96e635]/30 rounded-lg cursor-pointer hover:border-[#96e635]/50 transition-colors bg-[#1a3422]/30"
                  >
                    {formData.mediaUrl && formData.mediaType === "image" ? (
                      <img
                        src={formData.mediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <Image className="w-12 h-12 text-[#96e635]/60 mb-2" />
                        <p className="text-white/60 text-sm text-center px-4">
                          Cliquez pour uploader une image
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          Max 10 Mc • JPG, PNG, WebP
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Video Upload */}
              <div className="space-y-2">
                <Label className="text-white/80">Vidéo du produit</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      setFormData({ ...formData, mediaType: "video" });
                      handleFileUpload(e);
                    }}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[#96e635]/30 rounded-lg cursor-pointer hover:border-[#96e635]/50 transition-colors bg-[#1a3422]/30"
                  >
                    {formData.mediaUrl && formData.mediaType === "video" ? (
                      <video
                        src={formData.mediaUrl}
                        className="w-full h-full object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <>
                        <Video className="w-12 h-12 text-[#96e635]/60 mb-2" />
                        <p className="text-white/60 text-sm text-center px-4">
                          Cliquez pour uploader une vidéo
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          Max 10 Mc • MP4, WebM
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-white/80">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du produit..."
                className="input-shop bg-[#1a3422] border-[#96e635]/30 text-white placeholder:text-white/40 min-h-[120px] resize-none"
              />
            </div>

            {/* Options de prix */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white/80 text-lg">Options de prix</Label>
                <Button
                  type="button"
                  onClick={handleAddPrice}
                  variant="ghost"
                  size="sm"
                  className="text-[#96e635] hover:text-[#96e635] hover:bg-[#96e635]/10"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-3">
                {formData.prices.map((price, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm">Poids</Label>
                      <Input
                        value={price.weight}
                        onChange={(e) => handlePriceChange(index, "weight", e.target.value)}
                        placeholder="5g"
                        className="input-shop bg-[#1a3422] border-[#96e635]/30 text-white placeholder:text-white/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm">Prix (€)</Label>
                      <Input
                        type="number"
                        value={price.price}
                        onChange={(e) => handlePriceChange(index, "price", parseFloat(e.target.value) || 0)}
                        placeholder="30"
                        className="input-shop bg-[#1a3422] border-[#96e635]/30 text-white placeholder:text-white/40"
                      />
                    </div>
                    {formData.prices.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemovePrice(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={() => setShowProductDialog(false)}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/5"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveProduct}
                className="flex-1 bg-[#96e635] hover:bg-[#7bc42d] text-[#16291b] font-semibold"
              >
                {editingProduct ? "Modifier" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
