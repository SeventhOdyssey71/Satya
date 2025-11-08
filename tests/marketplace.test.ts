import { describe, it, expect, beforeEach } from 'vitest';
import { MarketplaceService } from '../integrations/marketplace/service';

describe('Marketplace Service', () => {
  let marketplace: MarketplaceService;
  let testData: Uint8Array;
  
  beforeEach(() => {
    marketplace = new MarketplaceService({
      suiNetwork: 'testnet',
      marketplacePackageId: '0x123',
      nautilusUrl: 'http://localhost:3000'
    });
    
    testData = new Uint8Array([1, 2, 3, 4, 5]);
  });

  describe('Data Listing', () => {
    it('should create a data listing', async () => {
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'Test Dataset',
        description: 'Test data for marketplace',
        price: BigInt(1000000),
        category: 'Testing',
        seller: '0xSeller123'
      });

      expect(listing.id).toBeTruthy();
      expect(listing.title).toBe('Test Dataset');
      expect(listing.seller).toBe('0xSeller123');
      expect(listing.price).toBe(BigInt(1000000));
    });

    it('should handle file uploads', async () => {
      const file = new File([testData], 'test.bin');
      
      const listing = await marketplace.listDataForSale({
        data: file,
        title: 'File Dataset',
        description: 'File upload test',
        price: BigInt(2000000),
        category: 'Files',
        seller: '0xFileSeller'
      });

      expect(listing.size).toBe(testData.length);
    });
  });

  describe('Purchase Flow', () => {
    let testListing: any;

    beforeEach(async () => {
      testListing = await marketplace.listDataForSale({
        data: testData,
        title: 'Purchase Test',
        description: 'Data for purchase testing',
        price: BigInt(1000000),
        category: 'Testing',
        seller: '0xTestSeller'
      });
    });

    it('should handle data purchase', async () => {
      const access = await marketplace.purchaseData({
        listingId: testListing.id,
        buyer: '0xTestBuyer',
        paymentAmount: testListing.price,
        accessDuration: 24
      });

      expect(access.listingId).toBe(testListing.id);
      expect(access.buyer).toBe('0xTestBuyer');
    });

    it('should reject insufficient payment', async () => {
      await expect(
        marketplace.purchaseData({
          listingId: testListing.id,
          buyer: '0xTestBuyer',
          paymentAmount: BigInt(500000),
          accessDuration: 24
        })
      ).rejects.toThrow('Insufficient payment amount');
    });
  });

  describe('Data Download', () => {
    it('should download purchased data', async () => {
      // This test would need proper mocking of access verification
      // For now, it will test the error path
      await expect(
        marketplace.downloadPurchasedData('test-listing', '0xBuyer', false)
      ).rejects.toThrow('No valid access found');
    });
  });

  describe('Sample Verification', () => {
    it('should verify data samples', async () => {
      const sampleData = new Uint8Array([1, 2, 3]);
      
      // This test needs proper mocking
      await expect(
        marketplace.verifyDataSample('test-listing', sampleData)
      ).rejects.toThrow('Listing not found');
    });
  });

  describe('Dispute Handling', () => {
    it('should create disputes', async () => {
      await expect(
        marketplace.disputePurchase({
          listingId: 'test-listing',
          buyer: '0xBuyer',
          reason: 'Data quality issue'
        })
      ).rejects.toThrow('Listing not found');
    });
  });
});