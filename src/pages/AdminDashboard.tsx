import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Settings, LogOut, Video, Image, ArrowLeft, Menu, Upload, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { productsApi, categoriesApi, settingsApi } from "@/lib/api";
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

interface Prize {
  id: number;
  name: string;
  probability: number;
  color: string;
  tier: 'jackpot' | 'rare' | 'commun' | 'standard';
}

interface RouletteCode {
  id: number;
  code: string;
  used: number;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

interface RouletteSpin {
  id: number;
  telegram_id: string;
  username: string;
  prize_name: string;
  code: string | null;
  spin_date: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"products" | "settings" | "roulette">("products");
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Roulette states
  const [rouletteActive, setRouletteActive] = useState(false);
  const [maxSpins, setMaxSpins] = useState(1);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [codes, setCodes] = useState<RouletteCode[]>([]);
  const [spins, setSpins] = useState<RouletteSpin[]>([]);
  const [codeCount, setCodeCount] = useState(10);
  const [isTogglingRoulette, setIsTogglingRoulette] = useState(false);
  const [isSavingPrizes, setIsSavingPrizes] = useState(false);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  
  // Individual prize states for each tier
  const [prizeNames, setPrizeNames] = useState({
    jackpot: '',
    rare: '',
    commun: '',
    standard: ''
  });
  

  const [settings, setSettings] = useState<AppSettings>({
    welcomeMessage: "Bienvenue sur l'app RSlive 👋",
    telegramLink: "https://t.me/votre_compte",
    whatsappLink: "https://wa.me/33612345678",
    signalLink: "https://signal.me/#p/+33612345678",
    orderHours: "11h - 00h",
    meetupStatus: "Disponible",
    deliveryZone: "Gard Vaucluse Bouches-du-Rhône Ardèche Drôme Hérault",
    deliveryHours: "11h - 00h",
    socialNetworks: [
      { id: "1", name: "Telegram", username: "@RSliv", url: "https://t.me/RSliv" },
      { id: "2", name: "Snapchat", username: "rsliv", url: "https://snapchat.com/add/rsliv" }
    ]
  });

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load products
        const productsData = await productsApi.getAll();
        const mappedProducts = productsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category_name || "",
          farm: p.farm || "",
          description: p.description || "",
          mediaUrl: p.video_url || p.image_url || "",
          mediaType: (p.video_url ? "video" : "image") as "image" | "video",
          prices: p.prices || []
        }));
        setProducts(mappedProducts);

        // Load categories
        const categoriesData = await categoriesApi.getAll();
        setCategories(categoriesData.map((c: any) => c.name));

        // Load settings
        const settingsData = await settingsApi.getAll();
        setSettings(prev => ({
          ...prev,
          welcomeMessage: settingsData.welcome_message || prev.welcomeMessage,
          telegramLink: settingsData.telegram_contact || prev.telegramLink,
          whatsappLink: settingsData.whatsapp_link || prev.whatsappLink,
          signalLink: settingsData.signal_link || prev.signalLink,
          orderHours: settingsData.order_hours || prev.orderHours,
          meetupStatus: settingsData.meetup_status || prev.meetupStatus,
          deliveryZone: settingsData.delivery_zone || prev.deliveryZone,
          deliveryHours: settingsData.delivery_hours || prev.deliveryHours,
          socialNetworks: settingsData.social_networks ? JSON.parse(settingsData.social_networks) : prev.socialNetworks
        }));
        
        // Load roulette settings
        try {
          const token = localStorage.getItem('auth_token');
          const rouletteSettingsRes = await fetch('/api/roulette/settings');
          const rouletteSettings = await rouletteSettingsRes.json();
          setRouletteActive(rouletteSettings.active || false);
          setMaxSpins(rouletteSettings.max_spins_per_user || 1);
          
          if (token) {
            const [prizesRes, codesRes, spinsRes] = await Promise.all([
              fetch('/api/roulette/admin/prizes', { headers: { Authorization: `Bearer ${token}` } }),
              fetch('/api/roulette/admin/codes', { headers: { Authorization: `Bearer ${token}` } }),
              fetch('/api/roulette/admin/spins', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            if (prizesRes.ok) {
              const prizesData = await prizesRes.json();
              setPrizes(prizesData);
              
              // Populate prize names from loaded data
              const newNames: any = {};
              prizesData.forEach((prize: Prize) => {
                newNames[prize.tier] = prize.name;
              });
              setPrizeNames(newNames);
            }
            if (codesRes.ok) setCodes(await codesRes.json());
            if (spinsRes.ok) setSpins(await spinsRes.json());
          }
        } catch (err) {
          console.error('Error loading roulette data:', err);
        }

      } catch (error) {
        console.error("Erreur chargement données:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    variety: "",
    category: "",
    farm: "",
    description: "",
    imageFile: null as File | null,
    videoFile: null as File | null,
    prices: [{ weight: "1g", price: "" as any }]
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFormData({ ...formData, imageFile: file });
    toast({ title: "Photo sélectionnée pour la page d'accueil" });
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFormData({ ...formData, videoFile: file });
    toast({ title: "Vidéo sélectionnée (sera convertie en 480p)" });
  };

  const handleLogout = () => {
    navigate("/admin");
    toast({ title: "Déconnexion réussie" });
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      variety: "",
      category: "",
      farm: "",
      description: "",
      imageFile: null,
      videoFile: null,
      prices: [{ weight: "1g", price: "" as any }]
    });
    setShowProductDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      variety: product.category, // La catégorie actuelle devient la variété
      category: product.category,
      farm: product.farm,
      description: product.description,
      imageFile: null,
      videoFile: null,
      prices: product.prices
    });
    setShowProductDialog(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await productsApi.delete(id);
        setProducts(products.filter(p => p.id !== id));
        toast({ title: "Produit supprimé avec succès" });
      } catch (error) {
        console.error("Erreur suppression:", error);
        toast({ 
          title: "Erreur", 
          description: "Impossible de supprimer le produit",
          variant: "destructive" 
        });
      }
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.category || !formData.farm) {
      toast({ title: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    if (isSavingProduct) return; // Prevent double-click
    setIsSavingProduct(true);

    try {
      // Find or create category
      const categoriesData = await categoriesApi.getAll();
      let categoryId = categoriesData.find((c: any) => c.name === formData.category)?.id;
      
      if (!categoryId) {
        const newCategory = await categoriesApi.create(formData.category);
        categoryId = newCategory.id;
      }

      // Create FormData for product
      const productFormData = new FormData();
      productFormData.append('name', formData.name);
      productFormData.append('variety', formData.variety);
      productFormData.append('category_id', String(categoryId));
      productFormData.append('farm', formData.farm);
      productFormData.append('description', formData.description);
      productFormData.append('prices', JSON.stringify(formData.prices));

      // Add media files if selected
      if (formData.imageFile) {
        productFormData.append('image', formData.imageFile);
      }
      if (formData.videoFile) {
        productFormData.append('video', formData.videoFile);
      }
      
      if (editingProduct) {
        await productsApi.update(editingProduct.id, productFormData);
        // Reload products to get fresh data
        const updatedProducts = await productsApi.getAll();
        const mappedProducts = updatedProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category_name || "",
          farm: p.farm || "",
          description: p.description || "",
          mediaUrl: p.video_url || p.image_url || "",
          mediaType: (p.video_url ? "video" : "image") as "image" | "video",
          prices: p.prices || []
        }));
        setProducts(mappedProducts);
        toast({ title: "Produit modifié avec succès" });
      } else {
        await productsApi.create(productFormData);
        // Reload products to get fresh data
        const updatedProducts = await productsApi.getAll();
        const mappedProducts = updatedProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category_name || "",
          farm: p.farm || "",
          description: p.description || "",
          mediaUrl: p.video_url || p.image_url || "",
          mediaType: (p.video_url ? "video" : "image") as "image" | "video",
          prices: p.prices || []
        }));
        setProducts(mappedProducts);
        toast({ title: "Produit ajouté avec succès" });
      }
      
      setShowProductDialog(false);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de sauvegarder le produit",
        variant: "destructive" 
      });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleAddPrice = () => {
    setFormData({
      ...formData,
      prices: [...formData.prices, { weight: "", price: "" as any }]
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

  const handleSaveSettings = async () => {
    if (isSavingSettings) return; // Prevent double-click
    setIsSavingSettings(true);

    try {
      console.log("💾 Sauvegarde des paramètres...");
      
      const settingsToSave = {
        welcome_message: settings.welcomeMessage,
        telegram_contact: settings.telegramLink,
        whatsapp_link: settings.whatsappLink,
        signal_link: settings.signalLink,
        order_hours: settings.orderHours,
        meetup_status: settings.meetupStatus,
        delivery_zone: settings.deliveryZone,
        delivery_hours: settings.deliveryHours,
        social_networks: JSON.stringify(settings.socialNetworks)
      };
      
      console.log("📤 Données envoyées:", settingsToSave);
      
      const response = await settingsApi.update(settingsToSave);
      console.log("✅ Réponse API:", response);
      
      // Save to localStorage as fallback
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      toast({ 
        title: "✅ Paramètres sauvegardés", 
        description: "Vos modifications ont été enregistrées"
      });
    } catch (error: any) {
      console.error("❌ Erreur sauvegarde complète:", error);
      console.error("Message:", error?.message);
      console.error("Response:", error?.response);
      
      toast({ 
        title: "Erreur de sauvegarde", 
        description: error?.message || "Impossible de sauvegarder les paramètres",
        variant: "destructive" 
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExitAdmin = () => {
    toast({ title: "Retour à l'application" });
    navigate("/info");
  };
  
  // Roulette handlers
  const handleToggleRoulette = async (active: boolean) => {
    console.log('🎰 handleToggleRoulette appelé avec:', active);
    if (isTogglingRoulette) return;
    
    try {
      setIsTogglingRoulette(true);
      const token = localStorage.getItem('auth_token');
      console.log('📤 Envoi de la requête avec token:', !!token);
      
      const res = await fetch('/api/roulette/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active, max_spins_per_user: maxSpins, require_code: true })
      });
      
      console.log('📥 Réponse reçue, status:', res.status);
      
      if (res.ok) {
        setRouletteActive(active);
        toast({ 
          title: active ? "✅ Roulette activée" : "❌ Roulette désactivée",
          description: active ? "L'icône est maintenant visible" : "L'icône est masquée"
        });
      } else {
        const error = await res.json();
        console.error('❌ Erreur API:', error);
        toast({ title: "Erreur", description: error.error || "Erreur inconnue", variant: "destructive" });
      }
    } catch (error) {
      console.error('❌ Erreur handleToggleRoulette:', error);
      toast({ title: "Erreur", description: "Impossible de modifier la roulette", variant: "destructive" });
    } finally {
      setIsTogglingRoulette(false);
    }
  };
  
  const handleUpdateRouletteSettings = async () => {
    console.log('⚙️ handleUpdateRouletteSettings appelé, maxSpins:', maxSpins);
    if (isUpdatingSettings) return;
    
    try {
      setIsUpdatingSettings(true);
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/roulette/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          active: rouletteActive, 
          max_spins_per_user: maxSpins, 
          require_code: true 
        })
      });
      
      console.log('📥 Réponse settings, status:', res.status);
      
      if (res.ok) {
        toast({ title: "✅ Paramètres sauvegardés" });
      } else {
        const error = await res.json();
        toast({ title: "Erreur", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    } finally {
      setIsUpdatingSettings(false);
    }
  };
  
  const handleSaveAllPrizes = async () => {
    console.log('🎁 handleSaveAllPrizes appelé');
    console.log('Noms:', prizeNames);
    
    // Vérifier que tous les noms sont remplis
    const tiers: ('jackpot' | 'rare' | 'commun' | 'standard')[] = ['jackpot', 'rare', 'commun', 'standard'];
    const emptyTiers = tiers.filter(tier => !prizeNames[tier]?.trim());
    
    if (emptyTiers.length > 0) {
      toast({ 
        title: "Veuillez remplir tous les lots", 
        description: `Lots manquants: ${emptyTiers.join(', ')}`,
        variant: "destructive" 
      });
      return;
    }
    
    if (isSavingPrizes) return;
    
    try {
      setIsSavingPrizes(true);
      const token = localStorage.getItem('auth_token');
      console.log('📤 Envoi des 4 lots en parallèle...');
      
      // Sauvegarder les 4 lots en parallèle (uniquement les noms)
      const savePromises = tiers.map(tier => {
        const name = prizeNames[tier];
        const prize = prizes.find(p => p.tier === tier);
        
        if (prize) {
          return fetch(`/api/roulette/admin/prizes/${prize.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name })
          });
        }
        return Promise.resolve(null);
      });
      
      const results = await Promise.all(savePromises);
      console.log('📥 Résultats:', results.map(r => r?.status));
      
      const allOk = results.every(r => r === null || r.ok);
      
      if (allOk) {
        // Reload prizes
        const prizesRes = await fetch('/api/roulette/admin/prizes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (prizesRes.ok) {
          const prizesData = await prizesRes.json();
          setPrizes(prizesData);
        }
        toast({ 
          title: "✅ Tous les lots sauvegardés", 
          description: "Les 4 niveaux ont été mis à jour"
        });
      } else {
        toast({ title: "Erreur partielle", description: "Certains lots n'ont pas été sauvegardés", variant: "destructive" });
      }
    } catch (error) {
      console.error('❌ Error saving prizes:', error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder les lots", variant: "destructive" });
    } finally {
      setIsSavingPrizes(false);
    }
  };
  
  const handleGenerateCodes = async () => {
    console.log('🎟️ handleGenerateCodes appelé, count:', codeCount);
    if (isGeneratingCodes) return;
    
    try {
      setIsGeneratingCodes(true);
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/roulette/admin/codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ count: codeCount })
      });
      
      console.log('📥 Réponse génération codes, status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Codes générés:', data.codes.length);
        
        // Reload codes
        const codesRes = await fetch('/api/roulette/admin/codes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (codesRes.ok) setCodes(await codesRes.json());
        
        toast({ 
          title: "✅ Codes générés avec succès", 
          description: `${data.codes.length} codes créés et prêts à l'emploi` 
        });
      } else {
        const error = await res.json();
        toast({ title: "Erreur", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      console.error('❌ Error generating codes:', error);
      toast({ title: "Erreur", description: "Impossible de générer les codes", variant: "destructive" });
    } finally {
      setIsGeneratingCodes(false);
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
                    Retour à l'app
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
                Retour à l'app
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
            onClick={() => setActiveTab("roulette")}
            className={`pb-3 px-3 md:px-4 font-medium transition-colors relative whitespace-nowrap text-sm md:text-base ${
              activeTab === "roulette" 
                ? "text-accent" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gamepad2 className="w-4 h-4 inline mr-2" />
            Roulette
            {activeTab === "roulette" && (
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
          </div>
        )}

        {/* Roulette Tab */}
        {activeTab === "roulette" && (
          <div className="max-w-4xl space-y-6">
            <h2 className="text-2xl font-semibold mb-6">🎰 Gestion de la Roulette</h2>
            
            {/* Settings Section */}
            <div className="glass-effect rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Activer la roulette</h3>
                  <p className="text-sm text-muted-foreground">Afficher l'icône dans l'app</p>
                </div>
                <Switch 
                  checked={rouletteActive} 
                  onCheckedChange={(checked) => handleToggleRoulette(checked)}
                  disabled={isTogglingRoulette}
                />
              </div>
              <div className="space-y-3 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <Label>Tours max/utilisateur</Label>
                  <Input 
                    type="number" 
                    value={maxSpins} 
                    onChange={(e) => setMaxSpins(parseInt(e.target.value) || 1)} 
                    className="w-20" 
                    min={1} 
                  />
                </div>
                <Button 
                  onClick={handleUpdateRouletteSettings} 
                  className="w-full"
                  disabled={isUpdatingSettings}
                >
                  {isUpdatingSettings ? "Sauvegarde..." : "Sauvegarder les paramètres"}
                </Button>
              </div>
            </div>
            
            {/* Prizes Section - 4 Fixed Tiers */}
            <div className="glass-effect rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Configuration des lots</h3>
                <p className="text-sm text-muted-foreground">
                  4 niveaux fixes avec probabilités prédéfinies (total: 100%)
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Jackpot - 5% */}
                <div className="card-shop p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <h4 className="font-bold">Jackpot</h4>
                      <p className="text-sm text-muted-foreground">5% de chance</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nom du lot</Label>
                    <Input 
                      placeholder="Ex: iPhone 15 Pro" 
                      value={prizeNames.jackpot}
                      onChange={(e) => setPrizeNames({...prizeNames, jackpot: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Rare - 10% */}
                <div className="card-shop p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <h4 className="font-bold">Rare</h4>
                      <p className="text-sm text-muted-foreground">10% de chance</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nom du lot</Label>
                    <Input 
                      placeholder="Ex: AirPods Pro" 
                      value={prizeNames.rare}
                      onChange={(e) => setPrizeNames({...prizeNames, rare: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Commun - 35% */}
                <div className="card-shop p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <h4 className="font-bold">Commun</h4>
                      <p className="text-sm text-muted-foreground">35% de chance</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nom du lot</Label>
                    <Input 
                      placeholder="Ex: 10g gratuit" 
                      value={prizeNames.commun}
                      onChange={(e) => setPrizeNames({...prizeNames, commun: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Standard - 50% */}
                <div className="card-shop p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h4 className="font-bold">Standard</h4>
                      <p className="text-sm text-muted-foreground">50% de chance</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nom du lot</Label>
                    <Input 
                      placeholder="Ex: 5€ de réduction" 
                      value={prizeNames.standard}
                      onChange={(e) => setPrizeNames({...prizeNames, standard: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSaveAllPrizes} 
                className="w-full btn-primary"
                disabled={isSavingPrizes}
              >
                {isSavingPrizes ? "Sauvegarde en cours..." : "💾 Sauvegarder tous les lots"}
              </Button>
            </div>
            
            {/* Codes Section */}
            <div className="glass-effect rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-lg">Générer des codes</h3>
              <div className="flex gap-3">
                <Input 
                  type="number" 
                  value={codeCount} 
                  onChange={(e) => setCodeCount(parseInt(e.target.value) || 10)} 
                  className="flex-1" 
                  min={1} 
                  max={100} 
                />
                <Button onClick={handleGenerateCodes}>Générer</Button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {codes.slice(0, 20).map(code => (
                  <div 
                    key={code.id} 
                    className="flex items-center justify-between p-2 bg-card rounded border border-border/30 text-sm"
                  >
                    <span className="font-mono font-bold">{code.code}</span>
                    <span className={code.used ? "text-destructive" : "text-green-500"}>
                      {code.used ? `✓ ${code.used_by}` : "• Dispo"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* History Section */}
            <div className="glass-effect rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-lg">Historique des tours</h3>
              <div className="space-y-2">
                {spins.slice(0, 10).map(spin => (
                  <div 
                    key={spin.id} 
                    className="flex justify-between p-3 bg-card rounded border border-border/30 text-sm"
                  >
                    <div>
                      <p className="font-medium">{spin.username}</p>
                      <p className="text-muted-foreground">{spin.prize_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(spin.spin_date).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-3xl space-y-6">
            <h2 className="text-2xl font-semibold mb-6">Paramètres de l'application</h2>
            
            {/* Message d'accueil */}
            <div className="card-shop p-6 space-y-4">
              <h3 className="text-lg font-semibold text-accent">Message d'accueil</h3>
              <div>
                <Label className="text-foreground mb-2 block">Message défilant</Label>
                <Input
                  value={settings.welcomeMessage}
                  onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                  placeholder="Bienvenue sur l'app RSlive 👋"
                  className="input-shop"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Ce message s&apos;affichera en défilement sur la page d&apos;accueil
                </p>
              </div>
            </div>

            {/* Horaires et Disponibilité */}
            <div className="card-shop p-6 space-y-4">
              <h3 className="text-lg font-semibold text-accent">Horaires et Disponibilité</h3>
              
              <div>
                <Label className="text-foreground mb-2 block">Horaires de prise de commande</Label>
                <Input
                  value={settings.orderHours}
                  onChange={(e) => setSettings({ ...settings, orderHours: e.target.value })}
                  placeholder="11h - 00h"
                  className="input-shop"
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Statut Meetup</Label>
                <Input
                  value={settings.meetupStatus}
                  onChange={(e) => setSettings({ ...settings, meetupStatus: e.target.value })}
                  placeholder="Disponible"
                  className="input-shop"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Ex: Disponible, Indisponible, Sur rendez-vous, etc.
                </p>
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Zone de livraison</Label>
                <Textarea
                  value={settings.deliveryZone}
                  onChange={(e) => setSettings({ ...settings, deliveryZone: e.target.value })}
                  placeholder="Gard Vaucluse Bouches-du-Rhône Ardèche Drôme Hérault"
                  className="input-shop min-h-[80px]"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Listez les départements ou zones couverts
                </p>
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Horaires de livraison</Label>
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
              <h3 className="text-lg font-semibold text-accent">Liens de contact</h3>
              
              <div>
                <Label className="text-foreground mb-2 block">Lien Telegram</Label>
                <Input
                  value={settings.telegramLink}
                  onChange={(e) => setSettings({ ...settings, telegramLink: e.target.value })}
                  placeholder="https://t.me/votre_compte"
                  className="input-shop"
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Lien WhatsApp</Label>
                <Input
                  value={settings.whatsappLink}
                  onChange={(e) => setSettings({ ...settings, whatsappLink: e.target.value })}
                  placeholder="https://wa.me/33612345678"
                  className="input-shop"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Format: https://wa.me/numéro
                </p>
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Lien Signal</Label>
                <Input
                  value={settings.signalLink}
                  onChange={(e) => setSettings({ ...settings, signalLink: e.target.value })}
                  placeholder="https://signal.me/#p/+33612345678"
                  className="input-shop"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Format: https://signal.me/#p/numéro
                </p>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="card-shop p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-accent">Réseaux sociaux</h3>
                <Button onClick={handleAddSocialNetwork} size="sm" className="btn-primary gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Configurez les réseaux sociaux qui seront affichés dans la section Info
              </p>

              <div className="space-y-4">
                {settings.socialNetworks.map((social) => (
                  <div key={social.id} className="p-4 rounded-lg bg-card border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Réseau social</Label>
                      <Button
                        onClick={() => handleRemoveSocialNetwork(social.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-muted-foreground text-xs mb-1 block">Nom du réseau</Label>
                        <Input
                          value={social.name}
                          onChange={(e) => handleSocialNetworkChange(social.id, "name", e.target.value)}
                          placeholder="Ex: Instagram, Twitter..."
                          className="input-shop"
                        />
                      </div>

                      <div>
                        <Label className="text-muted-foreground text-xs mb-1 block">Nom d'utilisateur</Label>
                        <Input
                          value={social.username}
                          onChange={(e) => handleSocialNetworkChange(social.id, "username", e.target.value)}
                          placeholder="@utilisateur"
                          className="input-shop"
                        />
                      </div>

                      <div>
                        <Label className="text-muted-foreground text-xs mb-1 block">Lien complet</Label>
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
                  <p className="text-center text-muted-foreground py-8">
                    Aucun réseau social configuré. Cliquez sur "Ajouter" pour en créer un.
                  </p>
                )}
              </div>
            </div>

            <Button 
              onClick={handleSaveSettings} 
              className="btn-primary w-full" 
              disabled={isSavingSettings}
            >
              {isSavingSettings ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                "Sauvegarder tous les paramètres"
              )}
            </Button>
          </div>
        )}

      </div>


      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="glass-effect border-accent/20 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              {editingProduct ? "Modifier le produit" : "Gestion des produits"}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Gérez votre catalogue de produits
            </p>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Nom et Variété */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nom du produit *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="amnesia OG"
                  className="input-shop"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Variété *</Label>
                <Input
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  placeholder="Original amnesia"
                  className="input-shop"
                />
              </div>
            </div>

            {/* Ferme et Catégorie */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Ferme *</Label>
                <Input
                  value={formData.farm}
                  onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                  placeholder="Holland"
                  className="input-shop"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Catégorie</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Weed"
                  className="input-shop"
                />
              </div>
            </div>

            {/* Image et Vidéo Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-foreground">Photo (page d'accueil) *</Label>
                <p className="text-xs text-muted-foreground mb-1">
                  Cette image sera affichée sur la page d'accueil
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-accent/30 rounded-lg cursor-pointer hover:border-accent/50 transition-colors bg-input/30"
                  >
                    {formData.imageFile ? (
                      <img
                        src={URL.createObjectURL(formData.imageFile)}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (editingProduct && editingProduct.mediaType === "image") ? (
                      <img
                        src={editingProduct.mediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <Image className="w-12 h-12 text-accent/60 mb-2" />
                        <p className="text-muted-foreground text-sm text-center px-4">
                          Cliquez pour uploader une photo
                        </p>
                        <p className="text-muted-foreground/60 text-xs mt-1">
                          Max 50 Mo • JPG, PNG, WebP
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Video Upload */}
              <div className="space-y-2">
                <Label className="text-foreground">Vidéo (modale uniquement)</Label>
                <p className="text-xs text-muted-foreground mb-1">
                  Affichée dans la modale détail. Convertie auto en 480p (max 10-20 Mo)
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  
                  {/* Preview vidéo existante ou nouvelle */}
                  {(formData.videoFile || (editingProduct && editingProduct.mediaType === "video")) ? (
                    <div className="relative">
                      <video
                        src={formData.videoFile ? URL.createObjectURL(formData.videoFile) : editingProduct?.mediaUrl}
                        className="w-full h-48 object-cover rounded-lg border-2 border-accent/30"
                        controls
                      />
                      {/* Boutons de contrôle */}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <label
                          htmlFor="video-upload"
                          className="btn-primary px-3 py-2 rounded-md cursor-pointer flex items-center gap-2 text-sm shadow-lg"
                        >
                          <Upload className="w-4 h-4" />
                          Remplacer
                        </label>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setFormData({ ...formData, videoFile: null });
                            toast({ title: "Vidéo retirée" });
                          }}
                          className="shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Zone d'upload initiale */
                    <label
                      htmlFor="video-upload"
                      className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-accent/30 rounded-lg cursor-pointer hover:border-accent/50 transition-colors bg-input/30"
                    >
                      <Video className="w-12 h-12 text-accent/60 mb-2" />
                      <p className="text-muted-foreground text-sm text-center px-4">
                        Cliquez pour uploader une vidéo
                      </p>
                      <p className="text-muted-foreground/60 text-xs mt-1">
                        Max 50 Mo • MP4, WebM
                      </p>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-foreground">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du produit..."
                className="input-shop min-h-[120px] resize-none"
              />
            </div>

            {/* Options de prix */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-lg">Options de prix</Label>
                <Button
                  type="button"
                  onClick={handleAddPrice}
                  variant="ghost"
                  size="sm"
                  className="text-accent hover:text-accent hover:bg-accent/10"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-3">
                {formData.prices.map((price, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-sm">Poids</Label>
                      <Input
                        value={price.weight}
                        onChange={(e) => handlePriceChange(index, "weight", e.target.value)}
                        placeholder="5g"
                        className="input-shop"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-sm">Prix (€)</Label>
                      <Input
                        type="number"
                        value={price.price}
                        onChange={(e) => handlePriceChange(index, "price", e.target.value === "" ? "" : parseFloat(e.target.value))}
                        placeholder="30"
                        className="input-shop"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {formData.prices.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemovePrice(index)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
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
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveProduct}
                className="flex-1 btn-primary"
                disabled={isSavingProduct}
              >
                {isSavingProduct ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    En cours...
                  </>
                ) : (
                  editingProduct ? "Modifier" : "Créer"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
