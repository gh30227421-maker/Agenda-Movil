"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useToast } from '@/context/ToastContext';

export type Asset = Database['public']['Tables']['assets']['Row'];

interface AssetsContextType {
  assets: Asset[];
  isLoading: boolean;
  fetchAssets: () => Promise<void>;
  addAsset: (asset: Omit<Database['public']['Tables']['assets']['Insert'], 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateAsset: (id: string, updates: Database['public']['Tables']['assets']['Update']) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;
}

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

export function AssetsProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
      showToast('Error al cargar inventario de activos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const addAsset = async (asset: Omit<Database['public']['Tables']['assets']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('assets')
        .insert(asset);

      if (error) throw error;
      await fetchAssets();
      showToast('Activo registrado exitosamente', 'success');
      return true;
    } catch (err: any) {
      console.error('Error adding asset:', err);
      showToast(err.message || 'Error al registrar el activo', 'error');
      return false;
    }
  };

  const updateAsset = async (id: string, updates: Database['public']['Tables']['assets']['Update']) => {
    try {
      const { error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchAssets();
      showToast('Activo actualizado exitosamente', 'success');
      return true;
    } catch (err: any) {
      console.error('Error updating asset:', err);
      showToast(err.message || 'Error al actualizar el activo', 'error');
      return false;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAssets();
      showToast('Activo eliminado exitosamente', 'success');
      return true;
    } catch (err: any) {
      console.error('Error deleting asset:', err);
      showToast(err.message || 'Error al eliminar el activo', 'error');
      return false;
    }
  };

  return (
    <AssetsContext.Provider value={{ assets, isLoading, fetchAssets, addAsset, updateAsset, deleteAsset }}>
      {children}
    </AssetsContext.Provider>
  );
}

export function useAssets() {
  const context = useContext(AssetsContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetsProvider');
  }
  return context;
}
