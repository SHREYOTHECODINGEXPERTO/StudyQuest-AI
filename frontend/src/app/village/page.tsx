'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Sparkles, Trash2, ShoppingBag, Grid, Landmark } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VillagePage() {
  const router = useRouter();
  const { token, user, updateUser } = useStore();

  const [decorations, setDecorations] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [ownedInventory, setOwnedInventory] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [activeInventoryTab, setActiveInventoryTab] = useState<'decorations' | 'pets'>('decorations');
  const [selectedPlacementItem, setSelectedPlacementItem] = useState<any | null>(null);
  
  // Companion Dialogue States
  const [petSpeech, setPetSpeech] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'layout' | 'store'>('layout');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Auto redirect if token missing
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token]);

  // Load Village Data
  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/gamification/store'),
      api.get('/gamification/placements'),
      api.get('/auth/profile')
    ])
      .then(([storeRes, placementsRes, profileRes]) => {
        setDecorations(storeRes.decorations);
        setPets(storeRes.pets);
        setPlacements(placementsRes);
        setOwnedInventory(profileRes.inventory || []);
        updateUser(profileRes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const handlePurchase = async (type: 'DECORATION' | 'PET', itemId: string) => {
    try {
      const res = await api.post('/gamification/purchase', { type, itemId });
      confetti({ particleCount: 50, spread: 40 });
      setMessage(`Successfully purchased ${res.inventoryItem.decoration?.name || res.inventoryItem.pet?.name}!`);
      setTimeout(() => setMessage(''), 3000);
      loadData(); // reload shop and inventory
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // Grid placement coordinates handler
  const handleGridClick = async (x: number, y: number) => {
    // If cell already occupied, remove item
    const existingIndex = placements.findIndex(p => p.x === x && p.y === y);
    if (existingIndex !== -1) {
      const itemToRemove = placements[existingIndex];
      // If it's a pet, speak to user instead
      if (itemToRemove.inventoryItem.pet) {
        const dialogs = [
          `Bunbun says: "Your study streak fuels my energy! Keep it up!" 🥕`,
          `Bramble says: "I swept the forest path for you today. Let's study for 20 minutes!" 🍂`,
          `Dewy glows: "You're doing great! Don't let passive learning slow you down." 🔮`,
          `Bunbun wiggles ears: "Did we attempt a quiz today? You can win more coins!" 🪙`
        ];
        const randomSpeech = dialogs[Math.floor(Math.random() * dialogs.length)];
        setPetSpeech(randomSpeech);
        setTimeout(() => setPetSpeech(null), 5000);
        return;
      }

      // Remove placement
      const nextPlacements = placements.filter((_, i) => i !== existingIndex);
      await savePlacements(nextPlacements);
      return;
    }

    // Place selected inventory item
    if (!selectedPlacementItem) return;

    // Check if item already placed elsewhere
    const alreadyPlacedIndex = placements.findIndex(p => p.inventoryItemId === selectedPlacementItem.id);
    if (alreadyPlacedIndex !== -1) {
      // Move item to new spot
      const movedPlacements = [...placements];
      movedPlacements[alreadyPlacedIndex] = {
        ...movedPlacements[alreadyPlacedIndex],
        x,
        y,
      };
      await savePlacements(movedPlacements);
    } else {
      // Place new item instance from inventory
      const newPlacement = {
        inventoryItemId: selectedPlacementItem.id,
        x,
        y,
      };
      await savePlacements([...placements, newPlacement]);
    }
    
    setSelectedPlacementItem(null);
  };

  const savePlacements = async (updatedPlacementsList: any[]) => {
    try {
      const res = await api.post('/gamification/placements', {
        placements: updatedPlacementsList.map(p => ({
          inventoryItemId: p.inventoryItemId,
          x: p.x,
          y: p.y,
        }))
      });
      setPlacements(res.placements);
    } catch (err) {
      console.error(err);
    }
  };

  // Check if inventory item is placed
  const isPlaced = (inventoryItemId: string) => {
    return placements.some(p => p.inventoryItemId === inventoryItemId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cozy-lavender border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 mt-2">Loading village maps...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-[#F3EFE6]">Cozy Study Meadow 🌳</h2>
          <p className="text-xs text-gray-500 mt-1">
            Buy items using gold coins earned from study sessions, then place them on the grid below.
          </p>
        </div>

        {message && (
          <div className="bg-cozy-mint px-4 py-2 border border-cozy-mint-dark rounded-xl text-xs font-bold animate-pulse text-cozy-mint-deep">
            {message}
          </div>
        )}

        <div className="flex bg-white/40 dark:bg-black/20 p-1.5 rounded-xl border border-white/20">
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'layout' ? 'bg-cozy-lavender text-cozy-lavender-deep shadow' : 'text-gray-500'
            }`}
          >
            <Grid size={14} className="inline mr-1.5" /> Placements Grid
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'store' ? 'bg-cozy-lavender text-cozy-lavender-deep shadow' : 'text-gray-500'
            }`}
          >
            <ShoppingBag size={14} className="inline mr-1.5" /> Village Store
          </button>
        </div>
      </div>

      {activeTab === 'layout' ? (
        /* VILLAGE PLACEMENTS VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* THE GRID EDITOR */}
          <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between items-center text-center">
            <h3 className="font-bold text-sm text-gray-400 mb-4 uppercase tracking-wider">
              {selectedPlacementItem ? '📍 Select a Meadow tile to place item' : '🌿 Meadow Grid (Click placed items to remove or talk)'}
            </h3>

            {/* Pet Speech bubble overlay */}
            {petSpeech && (
              <div className="w-full max-w-sm mb-4 p-3 bg-cozy-cream-light border border-cozy-cream-dark rounded-2xl animate-bounce text-xs text-gray-600 font-bold shadow italic">
                💬 {petSpeech}
              </div>
            )}

            {/* 6x6 Iso grid canvas */}
            <div className="relative w-full max-w-md aspect-square bg-[#B5D6B2]/40 dark:bg-[#273B25]/20 border border-white/40 rounded-2xl shadow-inner grid grid-cols-6 grid-rows-6 p-2">
              {Array.from({ length: 36 }).map((_, i) => {
                const x = i % 6;
                const y = Math.floor(i / 6);
                const placement = placements.find(p => p.x === x && p.y === y);
                return (
                  <button
                    key={i}
                    onClick={() => handleGridClick(x, y)}
                    className="relative border border-dashed border-white/20 hover:bg-cozy-lavender/30 transition-all flex items-center justify-center cursor-pointer aspect-square rounded-lg group"
                  >
                    {/* Render placement */}
                    {placement && (
                      <div className="w-[85%] h-[85%] flex items-center justify-center animate-float">
                        {placement.inventoryItem.pet && (
                          <div
                            className="w-full h-full"
                            dangerouslySetInnerHTML={{ __html: placement.inventoryItem.pet.svgContent }}
                          />
                        )}
                        {placement.inventoryItem.decoration && (
                          <div
                            className="w-full h-full"
                            dangerouslySetInnerHTML={{ __html: placement.inventoryItem.decoration.svgContent }}
                          />
                        )}

                        {/* hover overlay removal label */}
                        <div className="absolute inset-0 bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          {placement.inventoryItem.pet ? '💬' : <Trash2 size={12} className="text-white" />}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-[10px] text-gray-400">
              💡 Select items from your Inventory on the right, then tap any tile above to place it.
            </div>
          </div>

          {/* USER INVENTORY */}
          <div className="glass-card p-6 flex flex-col">
            <h3 className="font-bold text-base text-gray-800 dark:text-[#F3EFE6] mb-4">My Inventory</h3>
            
            {/* Inventory tabs */}
            <div className="grid grid-cols-2 gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              <button
                onClick={() => setActiveInventoryTab('decorations')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  activeInventoryTab === 'decorations' ? 'bg-cozy-lavender/40 text-cozy-lavender-deep' : 'text-gray-400'
                }`}
              >
                Decorations
              </button>
              <button
                onClick={() => setActiveInventoryTab('pets')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  activeInventoryTab === 'pets' ? 'bg-cozy-lavender/40 text-cozy-lavender-deep' : 'text-gray-400'
                }`}
              >
                Companions
              </button>
            </div>

            {/* Inventory list */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px]">
              {ownedInventory
                .filter(item => (activeInventoryTab === 'decorations' ? item.decoration : item.pet))
                .map((item) => {
                  const details = item.decoration || item.pet;
                  const placed = isPlaced(item.id);
                  const selected = selectedPlacementItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => !placed && setSelectedPlacementItem(selected ? null : item)}
                      className={`p-3 rounded-2xl flex items-center justify-between border cursor-pointer transition-all ${
                        selected
                          ? 'bg-cozy-lavender/40 border-cozy-lavender-dark'
                          : placed
                          ? 'opacity-50 border-gray-100 dark:border-gray-800 cursor-not-allowed bg-gray-50 dark:bg-black/10'
                          : 'border-gray-200 hover:border-cozy-lavender'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 border border-gray-100 rounded-xl bg-white p-1"
                          dangerouslySetInnerHTML={{ __html: details.svgContent }}
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-700 dark:text-[#F3EFE6]">{details.name}</p>
                          <p className="text-[10px] text-gray-400">{details.type}</p>
                        </div>
                      </div>

                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        placed ? 'bg-gray-200 text-gray-500' : selected ? 'bg-cozy-lavender-dark text-cozy-lavender-deep' : 'bg-cozy-mint/30 text-cozy-mint-deep'
                      }`}>
                        {placed ? 'Placed' : selected ? 'Active' : 'Unplaced'}
                      </span>
                    </div>
                  );
                })}

              {ownedInventory.filter(item => (activeInventoryTab === 'decorations' ? item.decoration : item.pet)).length === 0 && (
                <p className="text-center text-xs text-gray-400 italic py-8">No unplaced items. Visit the store to unlock more!</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* THE VILLAGE STORE VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* PETS SECTION */}
          {pets.map((item) => (
            <div key={item.id} className="glass-card p-6 flex flex-col justify-between cozy-hover items-center text-center">
              <div
                className="w-24 h-24 bg-white border border-gray-100 rounded-cozy p-2 animate-float"
                dangerouslySetInnerHTML={{ __html: item.svgContent }}
              />
              <div className="my-4">
                <h4 className="font-bold text-base text-gray-800 dark:text-[#F3EFE6]">{item.name}</h4>
                <p className="text-[11px] text-gray-400">Cozy companion pet. Reacts to streaks!</p>
              </div>

              <div className="w-full flex items-center justify-between mt-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold text-amber-500">🪙 {item.cost} Coins</span>
                <button
                  onClick={() => handlePurchase('PET', item.id)}
                  className="px-4 py-1.5 bg-cozy-lavender text-cozy-lavender-deep hover:bg-cozy-lavender-dark transition-all rounded-xl font-bold text-xs cursor-pointer"
                >
                  Adopt
                </button>
              </div>
            </div>
          ))}

          {/* DECORATIONS SECTION */}
          {decorations.map((item) => (
            <div key={item.id} className="glass-card p-6 flex flex-col justify-between cozy-hover items-center text-center">
              <div
                className="w-20 h-20 bg-white border border-gray-100 rounded-cozy p-2"
                dangerouslySetInnerHTML={{ __html: item.svgContent }}
              />
              <div className="my-4">
                <h4 className="font-bold text-base text-gray-800 dark:text-[#F3EFE6]">{item.name}</h4>
                <p className="text-[11px] text-gray-400">Category: {item.type}</p>
              </div>

              <div className="w-full flex items-center justify-between mt-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold text-amber-500">🪙 {item.cost} Coins</span>
                <button
                  onClick={() => handlePurchase('DECORATION', item.id)}
                  className="px-4 py-1.5 bg-cozy-lavender text-cozy-lavender-deep hover:bg-cozy-lavender-dark transition-all rounded-xl font-bold text-xs cursor-pointer"
                >
                  Buy Item
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
