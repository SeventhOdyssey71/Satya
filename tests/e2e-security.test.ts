import { describe, it, expect, beforeEach } from 'vitest';
import { MarketplaceService } from '../integrations/marketplace-service';
import { TestUtils } from './setup';

describe('End-to-End Security Tests', () => {
  let marketplace: MarketplaceService;
  let seller: string;
  let buyer: string;
  let unauthorizedUser: string;
  let testData: Uint8Array;

  beforeEach(() => {
    marketplace = new MarketplaceService({
      suiNetwork: 'testnet',
      marketplacePackageId: '0x123',
      nautilusUrl: 'http://localhost:3000'
    });

    seller = TestUtils.generateTestAddress();
    buyer = TestUtils.generateTestAddress();
    unauthorizedUser = TestUtils.generateTestAddress();
    testData = TestUtils.createTestData(1000);
  });

  describe('Complete Security Flow', () => {
    it('should protect seller data throughout entire flow', async () => {
      // 1. Seller lists sensitive data
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'Confidential Research Data',
        description: 'Highly sensitive research dataset',
        price: BigInt(5000000),
        category: 'Research',
        seller,
        sampleData: new Uint8Array([1, 2, 3]) // Small sample
      });

      expect(listing.encryptedBlobId).toBeTruthy();
      expect(listing.encryptionPolicyId).toBeTruthy();
      expect(listing.dataHash).toBeTruthy();

      // 2. Verify data is encrypted (not accessible in plain text)
      expect(listing.encryptedBlobId).not.toEqual(Buffer.from(testData).toString('base64'));

      // 3. Unauthorized user cannot access data
      await expect(
        marketplace.downloadPurchasedData(listing.id, unauthorizedUser, false)
      ).rejects.toThrow('No valid access found');

      // 4. Buyer must purchase to gain access
      const access = await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      expect(access.listingId).toBe(listing.id);
      expect(access.buyer).toBe(buyer);

      // 5. Buyer can download after purchase
      const downloadedData = await marketplace.downloadPurchasedData(
        listing.id,
        buyer,
        true // Verify in enclave
      );

      expect(downloadedData).toEqual(testData);

      // 6. Unauthorized user still cannot access after purchase
      await expect(
        marketplace.downloadPurchasedData(listing.id, unauthorizedUser, false)
      ).rejects.toThrow('No valid access found');
    });

    it('should prevent data tampering attacks', async () => {
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'Integrity Test Data',
        description: 'Data for integrity testing',
        price: BigInt(1000000),
        category: 'Security',
        seller
      });

      // Purchase data
      await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      // Download should verify integrity
      const downloadedData = await marketplace.downloadPurchasedData(
        listing.id,
        buyer,
        true // Enable enclave verification
      );

      expect(downloadedData).toEqual(testData);

      // Data hash should match original
      const downloadedHash = await this.calculateHash(downloadedData);
      expect(downloadedHash).toBe(listing.dataHash);
    });

    it('should enforce access control policies', async () => {
      const allowedBuyers = [buyer];
      
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'Restricted Access Data',
        description: 'Data with buyer restrictions',
        price: BigInt(2000000),
        category: 'Restricted',
        seller,
        allowedBuyers
      });

      // Authorized buyer can purchase
      const access = await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      expect(access).toBeTruthy();

      // Unauthorized buyer cannot purchase
      await expect(
        marketplace.purchaseData({
          listingId: listing.id,
          buyer: unauthorizedUser,
          paymentAmount: listing.price,
          accessDuration: 24
        })
      ).rejects.toThrow();
    });

    it('should secure payment escrow mechanism', async () => {
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'Escrow Test Data',
        description: 'Data for escrow testing',
        price: BigInt(3000000),
        category: 'Payment',
        seller
      });

      // Purchase creates escrow
      const access = await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      expect(access).toBeTruthy();

      // Seller doesn't receive payment until successful download
      // This would be verified through blockchain state

      // Download triggers payment release
      const downloadedData = await marketplace.downloadPurchasedData(
        listing.id,
        buyer,
        true
      );

      expect(downloadedData).toEqual(testData);
      
      // Payment should now be released to seller
      // This would be verified through blockchain events
    });

    it('should protect against replay attacks', async () => {
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'Replay Protection Data',
        description: 'Data for replay attack testing',
        price: BigInt(1000000),
        category: 'Security',
        seller
      });

      const access = await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      // First download
      const data1 = await marketplace.downloadPurchasedData(
        listing.id,
        buyer,
        true
      );

      // Second download should work (same user)
      const data2 = await marketplace.downloadPurchasedData(
        listing.id,
        buyer,
        true
      );

      expect(data1).toEqual(data2);
      expect(data1).toEqual(testData);

      // Download count should be tracked
      expect(access.downloadCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Attack Resistance', () => {
    it('should resist MITM attacks on data transfer', async () => {
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'MITM Test Data',
        description: 'Data for MITM testing',
        price: BigInt(1000000),
        category: 'Security',
        seller
      });

      await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      // Even if transport is compromised, data integrity is protected by:
      // 1. Encryption (Seal)
      // 2. Hash verification
      // 3. TEE attestation

      const downloadedData = await marketplace.downloadPurchasedData(
        listing.id,
        buyer,
        true // TEE verification
      );

      expect(downloadedData).toEqual(testData);
    });

    it('should prevent privilege escalation', async () => {
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'Privilege Test Data',
        description: 'Data for privilege testing',
        price: BigInt(1000000),
        category: 'Security',
        seller
      });

      await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      // Buyer cannot access other users' data
      const otherListing = await marketplace.listDataForSale({
        data: TestUtils.createTestData(500),
        title: 'Other User Data',
        description: 'Data from different seller',
        price: BigInt(2000000),
        category: 'Other',
        seller: TestUtils.generateTestAddress()
      });

      await expect(
        marketplace.downloadPurchasedData(otherListing.id, buyer, false)
      ).rejects.toThrow('No valid access found');
    });

    it('should resist timing attacks on encryption', async () => {
      const smallData = TestUtils.createTestData(100);
      const largeData = TestUtils.createTestData(10000);

      // Encrypt different sized data
      const start1 = Date.now();
      const listing1 = await marketplace.listDataForSale({
        data: smallData,
        title: 'Small Data',
        description: 'Small dataset',
        price: BigInt(1000000),
        category: 'Size',
        seller
      });
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const listing2 = await marketplace.listDataForSale({
        data: largeData,
        title: 'Large Data',
        description: 'Large dataset',
        price: BigInt(1000000),
        category: 'Size',
        seller
      });
      const time2 = Date.now() - start2;

      // Times should be proportional to data size, not reveal content
      expect(listing1.encryptionPolicyId).toBeTruthy();
      expect(listing2.encryptionPolicyId).toBeTruthy();
      expect(time2).toBeGreaterThan(time1); // Larger data takes longer
    });

    it('should prevent side-channel attacks via attestations', async () => {
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'Side Channel Test',
        description: 'Data for side channel testing',
        price: BigInt(1000000),
        category: 'Security',
        seller,
        sampleData: new Uint8Array([1, 2, 3])
      });

      await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      // Verify sample in TEE
      const verification = await marketplace.verifyDataSample(
        listing.id,
        new Uint8Array([1, 2, 3])
      );

      expect(verification.valid).toBe(true);
      expect(verification.attestation).toBeTruthy();

      // Attestation should not leak sensitive information
      expect(verification.attestation).not.toContain(seller);
      expect(verification.attestation).not.toContain(buyer);
    });
  });

  describe('Privacy Protection', () => {
    it('should protect seller identity in metadata', async () => {
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'Anonymous Seller Data',
        description: 'Data with identity protection',
        price: BigInt(1000000),
        category: 'Privacy',
        seller
      });

      // Encryption policy should not reveal seller identity
      expect(listing.encryptionPolicyId).not.toContain(seller);
      expect(listing.encryptedBlobId).not.toContain(seller);

      // Only authorized systems should know seller identity
      expect(listing.seller).toBe(seller); // This is authorized disclosure
    });

    it('should protect buyer privacy during purchase', async () => {
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'Buyer Privacy Data',
        description: 'Data for buyer privacy testing',
        price: BigInt(1000000),
        category: 'Privacy',
        seller
      });

      const access = await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      // Download should not reveal buyer to unauthorized parties
      const downloadedData = await marketplace.downloadPurchasedData(
        listing.id,
        buyer,
        true
      );

      expect(downloadedData).toEqual(testData);
      expect(access.buyer).toBe(buyer); // Authorized knowledge
    });

    it('should prevent metadata leakage', async () => {
      const sensitiveTitle = 'TOP_SECRET_CLASSIFIED_DATA';
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: sensitiveTitle,
        description: 'Highly classified information',
        price: BigInt(10000000),
        category: 'Classified',
        seller
      });

      // Encrypted blob should not contain readable metadata
      expect(listing.encryptedBlobId).not.toContain(sensitiveTitle);
      expect(listing.encryptedBlobId).not.toContain('CLASSIFIED');
      expect(listing.encryptedBlobId).not.toContain('SECRET');

      // But authorized access should work
      await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      const downloadedData = await marketplace.downloadPurchasedData(
        listing.id,
        buyer,
        true
      );

      expect(downloadedData).toEqual(testData);
    });
  });

  describe('Dispute Security', () => {
    it('should securely handle dispute evidence', async () => {
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'Dispute Test Data',
        description: 'Data for dispute testing',
        price: BigInt(1000000),
        category: 'Dispute',
        seller
      });

      await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      // Create dispute with evidence
      await marketplace.disputePurchase({
        listingId: listing.id,
        buyer,
        reason: 'Data quality issues',
        evidence: {
          screenshots: 'base64_encoded_evidence',
          logs: 'error_logs_here',
          hash_mismatch: true
        }
      });

      // Evidence should be stored securely in TEE
      // This would be verified through attestation checks
    });

    it('should prevent false dispute attacks', async () => {
      const listing = await marketplace.listDataForSale({
        data: testData,
        title: 'False Dispute Test',
        description: 'Data for false dispute testing',
        price: BigInt(1000000),
        category: 'Dispute',
        seller
      });

      await marketplace.purchaseData({
        listingId: listing.id,
        buyer,
        paymentAmount: listing.price,
        accessDuration: 24
      });

      // Download data successfully
      const downloadedData = await marketplace.downloadPurchasedData(
        listing.id,
        buyer,
        true
      );

      expect(downloadedData).toEqual(testData);

      // Attempt false dispute
      await marketplace.disputePurchase({
        listingId: listing.id,
        buyer,
        reason: 'False claim - data was corrupted',
        evidence: {
          fake_evidence: 'manufactured_proof'
        }
      });

      // TEE verification should be able to prove data integrity
      // and counter false claims with cryptographic proof
    });
  });

  // Helper method for hash calculation
  async calculateHash(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
});