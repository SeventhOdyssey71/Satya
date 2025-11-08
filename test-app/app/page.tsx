'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TestUpload from '@/components/test-upload';
import { SellerDashboard } from '@/components/seller-dashboard';
import { BuyerMarketplace } from '@/components/buyer-marketplace';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Satya Data Marketplace</h1>
          <p className="text-xl text-gray-700">
            Secure data trading with SEAL encryption, Walrus storage, and Nautilus TEE verification
          </p>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="seller">Sell Data</TabsTrigger>
            <TabsTrigger value="upload">File Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace">
            <BuyerMarketplace />
          </TabsContent>

          <TabsContent value="seller">
            <SellerDashboard />
          </TabsContent>

          <TabsContent value="upload">
            <div className="max-w-4xl mx-auto">
              <TestUpload />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}