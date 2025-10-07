import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Settings, LogOut, Video, Image, ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { productsApi, categoriesApi, settingsApi, authApi } from "@/lib/api";
import logo from "@/assets/logo.png";

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

interface Category {
  id: number;
  name: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"products" | "settings">("products");
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState({
    welcomeMessage: "",
    telegramContact: "",
    telegramBotToken: ""
  });

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    farm: "",
    variety: "",
    description: "",
    mediaFile: null as File | null,
    mediaType: "image" as "image" | "video",
    prices: [{ weight: "1g", price: 0 }]
  });

  // Verify authentication
  useEffect(() => {
    verifyAuth();
  }, []);

  // Load data
  useEffect(() => {
    if (activeTab === "products") {
      loadProducts();
      loadCategories();
    } else {
      loadSettings();
    }
  }, [activeTab]);

  const verifyAuth = async () => {
    try {
      await authApi.verify();
    } catch (error) {
      toast({ title: "Session expirée", variant: "destructive" });
      navigate("/admin");
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productsApi.getAll();
      const transformedProducts = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category_name || "",
        farm: p.farm || "",
        description: p.description || "",
        mediaUrl: (p.video_url || p.image_url) ? `/uploads${p.video_url || p.image_url}` : "/placeholder.svg",
        mediaType: p.video_url ? "video" : "image",
        prices: p.prices || []
      }));
      setProducts(transformedProducts);
    } catch (error: any) {
      toast({ title: "Erreur lors du chargement des produits", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      toast({ title: "Erreur lors du chargement des catégories", variant: "destructive" });
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await settingsApi.getAll();
      const settingsObj: any = {};
      data.forEach((s: any) => {
        settingsObj[s.key] = s.value;
      });
      setSettings({
        welcomeMessage: settingsObj.welcome_message || "",
        telegramContact: settingsObj.telegram_contact || "",
        telegramBotToken: settingsObj.telegram_bot_token || ""
      });
    } catch (error) {
      toast({ title: "Erreur lors du chargement des paramètres", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (50 MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Le fichier est trop volumineux (max 50 Mo)", variant: "destructive" });
      return;
    }

    setFormData({ ...formData, mediaFile: file });
    toast({ title: `${formData.mediaType === "image" ? "Image" : "Vidéo"} chargée avec succès` });
  };

  const handleLogout = () => {
    authApi.logout();
    navigate("/admin");
    toast({ title: "Déconnexion réussie" });
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "",
      farm: "",
      variety: "",
      description: "",
      mediaFile: null,
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
      variety: "",
      description: product.description,
      mediaFile: null,
      mediaType: product.mediaType,
      prices: product.prices
    });
    setShowProductDialog(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      await productsApi.delete(id);
      toast({ title: "Produit supprimé avec succès" });
      loadProducts();
    } catch (error: any) {
      toast({ title: error.message || "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.category || !formData.farm) {
      toast({ title: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("farm", formData.farm);
      formDataToSend.append("variety", formData.variety);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("prices", JSON.stringify(formData.prices));
      
      if (formData.mediaFile) {
        if (formData.mediaType === "image") {
          formDataToSend.append("image", formData.mediaFile);
        } else {
          formDataToSend.append("video", formData.mediaFile);
        }
      }

      if (editingProduct) {
        await productsApi.update(editingProduct.id, formDataToSend);
        toast({ title: "Produit modifié avec succès" });
      } else {
        await productsApi.create(formDataToSend);
        toast({ title: "Produit ajouté avec succès" });
      }
      
      setShowProductDialog(false);
      loadProducts();
    } catch (error: any) {
      toast({ title: error.message || "Erreur lors de l'enregistrement", variant: "destructive" });
    }
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

  const handleSaveSettings = async () => {
    try {
      await settingsApi.update({
        welcome_message: settings.welcomeMessage,
        telegram_contact: settings.telegramContact,
        telegram_bot_token: settings.telegramBotToken
      });
      toast({ title: "Paramètres sauvegardés avec succès" });
    } catch (error: any) {
      toast({ title: error.message || "Erreur lors de l'enregistrement", variant: "destructive" });
    }
  };

  const handleExitAdmin = () => {
    toast({ title: "Retour à l'application" });
    navigate("/");
  };

  const handleAddCategory = async () => {
    const name = prompt("Nom de la nouvelle catégorie:");
    if (!name) return;

    try {
      await categoriesApi.create(name);
      toast({ title: "Catégorie ajoutée avec succès" });
      loadCategories();
    } catch (error: any) {
      toast({ title: error.message || "Erreur lors de l'ajout", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return;

    try {
      await categoriesApi.delete(id);
      toast({ title: "Catégorie supprimée avec succès" });
      loadCategories();
    } catch (error: any) {
      toast({ title: error.message || "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background relative logo-watermark">
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Header - Mobile Optimized */}
        <div className="glass-effect rounded-2xl p-4 mb-6">
          {/* Mobile Header */}
          <div className="flex items-center justify-between md:hidden">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain drop-shadow-lg" />
              <h1 className="text-xl font-bold text-foreground">Admin</h1>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border-border/50">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card border-border/50">
                <div className="flex flex-col gap-4 mt-8">
                  <Button 
                    onClick={handleExitAdmin} 
                    variant="outline" 
                    className="w-full justify-start gap-2 border-border/50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour à l&apos;app
                  </Button>
                  <Button 
                    onClick={handleLogout} 
                    variant="destructive" 
                    className="w-full justify-start gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
              <h1 className="text-3xl font-bold text-foreground">Administration</h1>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleExitAdmin} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour à l&apos;app
              </Button>
              <Button onClick={handleLogout} variant="destructive" className="gap-2">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 mb-6 border-b border-border/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 px-3 md:px-4 font-medium transition-colors relative whitespace-nowrap text-sm md:text-base ${
              activeTab === "products" 
                ? "text-accent" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Produits
            {activeTab === "products" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-3 md:px-4 font-medium transition-colors relative whitespace-nowrap text-sm md:text-base ${
              activeTab === "settings" 
                ? "text-accent" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Paramètres
            {activeTab === "settings" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
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

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement des produits...
              </div>
            ) : (
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
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5">
                        {product.mediaType === "image" ? (
                          <Image className="w-5 h-5 text-accent" />
                        ) : (
                          <Video className="w-5 h-5 text-accent" />
                        )}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2 text-foreground">{product.name}</h3>
                    <div className="flex gap-2 mb-2">
                      <span className="tag-yellow">{product.category}</span>
                      <span className="tag-green">{product.farm}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                    
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
            )}

            {/* Categories Management */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Catégories</h3>
                <Button onClick={handleAddCategory} variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter une catégorie
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <div key={cat.id} className="tag-yellow flex items-center gap-2">
                    {cat.name}
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-3xl space-y-6">
            <h2 className="text-2xl font-semibold mb-6">Paramètres de l&apos;application</h2>
            
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement des paramètres...
              </div>
            ) : (
              <>
                <div className="card-shop p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-accent">Message d&apos;accueil</h3>
                  <div>
                    <Label className="text-foreground mb-2 block">Message défilant</Label>
                    <Input
                      value={settings.welcomeMessage}
                      onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                      placeholder="Bienvenue sur l'app RSLiv"
                      className="input-shop"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Ce message s&apos;affichera sur la page d&apos;accueil
                    </p>
                  </div>
                </div>

                <div className="card-shop p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-accent">Notifications Telegram</h3>
                  
                  <div>
                    <Label className="text-foreground mb-2 block">Token du Bot Telegram</Label>
                    <Input
                      type="password"
                      value={settings.telegramBotToken}
                      onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      className="input-shop"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Créez un bot via @BotFather sur Telegram
                    </p>
                  </div>

                  <div>
                    <Label className="text-foreground mb-2 block">Contact Admin Telegram</Label>
                    <Input
                      value={settings.telegramContact}
                      onChange={(e) => setSettings({ ...settings, telegramContact: e.target.value })}
                      placeholder="@votre_username ou ID numérique"
                      className="input-shop"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Username ou ID du chat pour recevoir les notifications
                    </p>
                  </div>
                </div>

                <Button onClick={handleSaveSettings} className="btn-primary w-full">
                  Sauvegarder les paramètres
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="bg-card border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-foreground mb-2 block">Nom du produit</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du produit"
                className="input-shop"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground mb-2 block">Catégorie</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-shop w-full"
                >
                  <option value="">Sélectionner...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Ferme/Origine</Label>
                <Input
                  value={formData.farm}
                  onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                  placeholder="Origine"
                  className="input-shop"
                />
              </div>
            </div>

            <div>
              <Label className="text-foreground mb-2 block">Variété</Label>
              <Input
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                placeholder="Variété (optionnel)"
                className="input-shop"
              />
            </div>

            <div>
              <Label className="text-foreground mb-2 block">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du produit"
                className="input-shop min-h-[100px]"
              />
            </div>

            <div>
              <Label className="text-foreground mb-2 block">Type de média</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="image"
                    checked={formData.mediaType === "image"}
                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as "image" | "video" })}
                  />
                  <span className="text-foreground">Image</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="video"
                    checked={formData.mediaType === "video"}
                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as "image" | "video" })}
                  />
                  <span className="text-foreground">Vidéo</span>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-foreground mb-2 block">
                {formData.mediaType === "image" ? "Image" : "Vidéo"} (jpg, png, webp, mp4, webm - max 50 Mo)
              </Label>
              <Input
                type="file"
                accept={formData.mediaType === "image" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/webm"}
                onChange={handleFileUpload}
                className="input-shop"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-foreground">Options de prix</Label>
                <Button type="button" onClick={handleAddPrice} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {formData.prices.map((price, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Poids (ex: 1g)"
                      value={price.weight}
                      onChange={(e) => handlePriceChange(index, "weight", e.target.value)}
                      className="input-shop flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Prix"
                      value={price.price || ""}
                      onChange={(e) => handlePriceChange(index, "price", parseFloat(e.target.value) || 0)}
                      className="input-shop flex-1"
                    />
                    {formData.prices.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemovePrice(index)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowProductDialog(false)} variant="outline" className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleSaveProduct} className="btn-primary flex-1">
                {editingProduct ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}