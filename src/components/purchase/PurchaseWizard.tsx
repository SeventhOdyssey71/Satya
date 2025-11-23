'use client'

import React, { useState } from 'react';
import { ShoppingCart, CreditCard, Key, CheckCircle, AlertCircle, Shield, Lock, Download, Wallet } from 'lucide-react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';

interface ModelData {
 id: string;
 name: string;
 description: string;
 category: string;
 price: string;
 size: string;
 seller: string;
 verificationStatus: 'verified' | 'pending' | 'unverified';
 integrityHash: string;
}

interface PurchaseWizardProps {
 model: ModelData;
 onPurchaseComplete?: (accessKey: string, licenseNFT: string) => void;
 onCancel?: () => void;
}

interface AccessKey {
 keyId: string;
 encryptedKey: string;
 policyId: string;
 expirationDate: string;
 usageRights: string[];
}

const PurchaseWizard: React.FC<PurchaseWizardProps> = ({
 model,
 onPurchaseComplete,
 onCancel
}) => {
 const [currentStep, setCurrentStep] = useState(0);
 const [isProcessing, setIsProcessing] = useState(false);
 const [purchaseResult, setPurchaseResult] = useState<{
  success: boolean;
  accessKey?: AccessKey;
  licenseNFT?: string;
  transactionHash?: string;
  error?: string;
 } | null>(null);

 const currentAccount = useCurrentAccount();
 const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

 const steps = [
  { title: 'Review Purchase', description: 'Confirm model details', icon: ShoppingCart },
  { title: 'Payment', description: 'Complete transaction', icon: CreditCard },
  { title: 'Access Keys', description: 'Receive decryption keys', icon: Key },
  { title: 'License', description: 'NFT license issued', icon: CheckCircle }
 ];

 const licenseTypes = [
  {
   type: 'personal',
   name: 'Personal License',
   description: 'For personal research and non-commercial use',
   multiplier: 1,
   features: ['Personal use only', 'No redistribution', 'Research purposes']
  },
  {
   type: 'commercial',
   name: 'Commercial License',
   description: 'For commercial applications and products',
   multiplier: 3,
   features: ['Commercial use', 'No redistribution', 'Production deployment']
  },
  {
   type: 'enterprise',
   name: 'Enterprise License',
   description: 'For large-scale enterprise deployments',
   multiplier: 10,
   features: ['Unlimited commercial use', 'Team sharing', 'Priority support']
  }
 ];

 const [selectedLicense, setSelectedLicense] = useState(licenseTypes[0]);

 const calculatePrice = () => {
  const basePrice = parseFloat(model.price.replace(' SUI', ''));
  return (basePrice * selectedLicense.multiplier).toFixed(2);
 };

 const handlePurchase = async () => {
  if (!currentAccount?.address) {
   alert('Please connect your wallet first');
   return;
  }

  setIsProcessing(true);
  setCurrentStep(1); // Move to payment step

  try {
   console.log('🛒 Starting purchase process...');
   
   // Step 1: Create purchase transaction
   await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
   console.log('Creating purchase transaction...');

   const transactionHash = `0x${Math.random().toString(16).substr(2, 40)}`;
   
   // Step 2: Generate SEAL access keys
   setCurrentStep(2);
   await new Promise(resolve => setTimeout(resolve, 2000));
   console.log('Generating SEAL access keys...');

   const accessKey: AccessKey = {
    keyId: `ak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    encryptedKey: `seal_key_${Buffer.from(JSON.stringify({
     modelId: model.id,
     buyerAddress: currentAccount.address,
     licenseType: selectedLicense.type,
     timestamp: Date.now()
    })).toString('base64')}`,
    policyId: `policy_${model.id}_${selectedLicense.type}`,
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    usageRights: selectedLicense.features
   };

   // Step 3: Issue license NFT
   setCurrentStep(3);
   await new Promise(resolve => setTimeout(resolve, 1500));
   console.log('📜 Issuing license NFT...');

   const licenseNFT = `license_nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

   // Complete purchase
   setPurchaseResult({
    success: true,
    accessKey,
    licenseNFT,
    transactionHash
   });

   console.log('Purchase completed successfully!');
   onPurchaseComplete?.(accessKey.encryptedKey, licenseNFT);

  } catch (error) {
   console.error('Purchase failed:', error);
   setPurchaseResult({
    success: false,
    error: error instanceof Error ? error.message : 'Purchase failed'
   });
  } finally {
   setIsProcessing(false);
  }
 };

 return (
  <div className="max-w-4xl mx-auto p-6">
   {/* Header */}
   <div className="mb-8">
    <h1 className="text-3xl font-bold text-black mb-2">Purchase Model</h1>
    <p className="text-gray-600">Secure purchase with SEAL access control and NFT licensing</p>
   </div>

   {/* Progress Indicator */}
   <div className="mb-8">
    <div className="flex items-center justify-between">
     {steps.map((step, index) => (
      <div key={index} className="flex items-center">
       <div className={`
        flex items-center justify-center w-12 h-12 rounded-full border-2 
        ${currentStep > index ? 'bg-green-500 border-green-500 text-white' : 
         currentStep === index ? 'bg-blue-500 border-blue-500 text-white' : 
         'bg-gray-200 border-gray-300 text-gray-500'}
       `}>
        {currentStep > index ? (
         <CheckCircle className="w-6 h-6" />
        ) : (
         <step.icon className="w-6 h-6" />
        )}
       </div>
       {index < steps.length - 1 && (
        <div className={`
         w-24 h-1 mx-4
         ${currentStep > index ? 'bg-green-500' : 'bg-gray-300'}
        `} />
       )}
      </div>
     ))}
    </div>
    <div className="flex justify-between mt-4">
     {steps.map((step, index) => (
      <div key={index} className="text-center" style={{ width: '150px' }}>
       <p className="font-medium text-sm">{step.title}</p>
       <p className="text-xs text-gray-500">{step.description}</p>
      </div>
     ))}
    </div>
   </div>

   {/* Step Content */}
   <div className="bg-white rounded-lg border p-6">
    {/* Step 0: Review Purchase */}
    {currentStep === 0 && (
     <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Your Purchase</h3>
      
      {/* Model Details */}
      <div className="bg-gray-50 rounded-lg p-6">
       <h4 className="font-medium text-gray-900 mb-4">Model Information</h4>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
         <span className="font-medium text-gray-700">Name:</span>
         <p className="text-gray-900">{model.name}</p>
        </div>
        <div>
         <span className="font-medium text-gray-700">Category:</span>
         <p className="text-gray-900">{model.category}</p>
        </div>
        <div>
         <span className="font-medium text-gray-700">Size:</span>
         <p className="text-gray-900">{model.size}</p>
        </div>
        <div>
         <span className="font-medium text-gray-700">Seller:</span>
         <p className="font-mono text-xs text-gray-900">{model.seller}</p>
        </div>
        <div className="md:col-span-2">
         <span className="font-medium text-gray-700">Description:</span>
         <p className="text-gray-900 mt-1">{model.description}</p>
        </div>
       </div>
      </div>

      {/* License Selection */}
      <div>
       <h4 className="font-medium text-gray-900 mb-4">Choose License Type</h4>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {licenseTypes.map((license) => (
         <div
          key={license.type}
          className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
           selectedLicense.type === license.type
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => setSelectedLicense(license)}
         >
          <div className="flex items-center justify-between mb-2">
           <h5 className="font-medium text-gray-900">{license.name}</h5>
           {selectedLicense.type === license.type && (
            <CheckCircle className="w-5 h-5 text-blue-500" />
           )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{license.description}</p>
          <div className="text-lg font-semibold text-gray-900 mb-3">
           {(parseFloat(model.price.replace(' SUI', '')) * license.multiplier).toFixed(2)} SUI
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
           {license.features.map((feature, index) => (
            <li key={index} className="flex items-center">
             <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
             {feature}
            </li>
           ))}
          </ul>
         </div>
        ))}
       </div>
      </div>

      {/* Price Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
       <div className="flex justify-between items-center">
        <div>
         <p className="font-medium text-gray-900">Total Price</p>
         <p className="text-sm text-gray-600">{selectedLicense.name}</p>
        </div>
        <div className="text-2xl font-bold text-blue-600">
         {calculatePrice()} SUI
        </div>
       </div>
      </div>

      {/* Wallet Connection Check */}
      {!currentAccount?.address ? (
       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
         <Wallet className="w-5 h-5 text-yellow-600" />
         <span className="font-medium text-yellow-800">Wallet Connection Required</span>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
         Please connect your wallet to continue with the purchase.
        </p>
       </div>
      ) : (
       <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
         <CheckCircle className="w-5 h-5 text-green-600" />
         <span className="font-medium text-green-800">Wallet Connected</span>
        </div>
        <p className="text-green-700 text-sm mt-1">
         Ready to purchase from {currentAccount.address.slice(0, 8)}...
        </p>
       </div>
      )}
     </div>
    )}

    {/* Step 1: Payment */}
    {currentStep === 1 && (
     <div className="space-y-6 text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Processing Payment</h3>
      
      {isProcessing ? (
       <div className="space-y-6">
        <div className="flex justify-center">
         <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
        
        <div>
         <p className="text-lg font-medium text-gray-900 mb-2">
          Creating blockchain transaction...
         </p>
         <p className="text-sm text-gray-600">
          Transferring {calculatePrice()} SUI to escrow contract
         </p>
        </div>
       </div>
      ) : (
       <div className="space-y-6">
        <CreditCard className="mx-auto h-16 w-16 text-blue-500" />
        <div>
         <p className="text-lg font-medium text-gray-900 mb-2">
          Confirm Payment
         </p>
         <p className="text-sm text-gray-600">
          You will be charged {calculatePrice()} SUI for the {selectedLicense.name}
         </p>
        </div>
       </div>
      )}
     </div>
    )}

    {/* Step 2: Access Keys */}
    {currentStep === 2 && (
     <div className="space-y-6 text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Generating Access Keys</h3>
      
      {isProcessing ? (
       <div className="space-y-6">
        <div className="flex justify-center">
         <Key className="h-16 w-16 text-blue-500 animate-pulse" />
        </div>
        
        <div>
         <p className="text-lg font-medium text-gray-900 mb-2">
          Creating SEAL access keys...
         </p>
         <p className="text-sm text-gray-600">
          Generating encrypted keys with your wallet signature
         </p>
        </div>
       </div>
      ) : (
       <div className="space-y-4">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <p className="text-lg font-medium text-green-700">
         Access keys generated successfully!
        </p>
       </div>
      )}
     </div>
    )}

    {/* Step 3: License NFT */}
    {currentStep === 3 && purchaseResult?.success && (
     <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Purchase Complete</h3>
      
      <div className="text-center">
       <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-4" />
       <p className="text-lg font-medium text-gray-900 mb-2">
        Model purchased successfully!
       </p>
       <p className="text-sm text-gray-600">
        Your license NFT has been issued and access keys are ready
       </p>
      </div>

      {/* Access Key Information */}
      <div className="bg-green-50 rounded-lg p-6">
       <h4 className="font-medium text-gray-900 mb-4 flex items-center">
        <Key className="w-5 h-5 mr-2 text-green-600" />
        Your Access Key
       </h4>
       
       <div className="space-y-4 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
          <span className="font-medium text-gray-700">Key ID:</span>
          <p className="font-mono text-xs text-gray-900 mt-1">{purchaseResult.accessKey?.keyId}</p>
         </div>
         <div>
          <span className="font-medium text-gray-700">Policy ID:</span>
          <p className="font-mono text-xs text-gray-900 mt-1">{purchaseResult.accessKey?.policyId}</p>
         </div>
         <div>
          <span className="font-medium text-gray-700">License Type:</span>
          <p className="text-gray-900 mt-1">{selectedLicense.name}</p>
         </div>
         <div>
          <span className="font-medium text-gray-700">Expires:</span>
          <p className="text-gray-900 mt-1">
           {new Date(purchaseResult.accessKey?.expirationDate || '').toLocaleDateString()}
          </p>
         </div>
        </div>
        
        <div>
         <span className="font-medium text-gray-700">Usage Rights:</span>
         <ul className="mt-2 space-y-1">
          {purchaseResult.accessKey?.usageRights.map((right, index) => (
           <li key={index} className="flex items-center text-gray-900">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            {right}
           </li>
          ))}
         </ul>
        </div>
       </div>
      </div>

      {/* License NFT */}
      <div className="bg-blue-50 rounded-lg p-6">
       <h4 className="font-medium text-gray-900 mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2 text-blue-600" />
        License NFT
       </h4>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
         <span className="font-medium text-gray-700">NFT ID:</span>
         <p className="font-mono text-xs text-gray-900 mt-1">{purchaseResult.licenseNFT}</p>
        </div>
        <div>
         <span className="font-medium text-gray-700">Transaction:</span>
         <p className="font-mono text-xs text-gray-900 mt-1">{purchaseResult.transactionHash}</p>
        </div>
       </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-4">
       <button className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <Download className="w-5 h-5 mr-2" />
        Download Model
       </button>
       <button className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
        <Key className="w-5 h-5 mr-2" />
        Export Keys
       </button>
      </div>
     </div>
    )}

    {/* Error State */}
    {purchaseResult?.success === false && (
     <div className="space-y-6 text-center">
      <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
      <div>
       <p className="text-lg font-medium text-red-700 mb-2">
        Purchase Failed
       </p>
       <p className="text-sm text-gray-600">
        {purchaseResult.error}
       </p>
      </div>
      <button
       onClick={() => {
        setPurchaseResult(null);
        setCurrentStep(0);
       }}
       className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
       Try Again
      </button>
     </div>
    )}
   </div>

   {/* Navigation */}
   <div className="flex justify-between mt-8">
    <button
     onClick={onCancel}
     disabled={isProcessing}
     className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
    >
     Cancel
    </button>

    {currentStep === 0 && !purchaseResult && (
     <button
      onClick={handlePurchase}
      disabled={!currentAccount?.address}
      className={`px-6 py-2 rounded-lg transition-colors ${
       currentAccount?.address
        ? 'bg-blue-600 text-white hover:bg-blue-700'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
     >
      Purchase Model
     </button>
    )}

    {purchaseResult?.success && (
     <button
      onClick={onCancel}
      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
     >
      Done
     </button>
    )}
   </div>
  </div>
 );
};

export default PurchaseWizard;