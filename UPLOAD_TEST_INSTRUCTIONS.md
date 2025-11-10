# Upload Test Instructions - WAL Token Verification

## 🎯 **Objective**
Test the complete upload flow: File → SEAL Encryption → Walrus Storage → Smart Contract → Marketplace Listing

## 📋 **Prerequisites Verified**
✅ Application running at: http://localhost:3003  
✅ Upload page accessible: http://localhost:3003/upload  
✅ Marketplace page accessible: http://localhost:3003/marketplace  
✅ Walrus endpoints configured correctly  
✅ Error handling improved for better debugging  

## 🧪 **Test Procedure**

### **Step 1: Prepare Test Environment**
1. Open browser and navigate to: **http://localhost:3003/upload**
2. Open browser Developer Tools (F12) → Console tab
3. Ensure your wallet is connected and has WAL tokens available

### **Step 2: Upload Test File**
1. **Select File**: Use the test file: `/Users/eromonseleodigie/Satya/frontend/test-model.json`
   - This is a 1KB JSON file perfect for testing
   - Contains sample AI model metadata

2. **Fill Out Form**:
   ```
   Title: "Test AI Model Upload"
   Description: "Testing Walrus upload with WAL tokens and SEAL encryption"
   Category: "Machine Learning" (select from dropdown)
   Price: "0.001" SUI (small amount for testing)
   ```

3. **Click "Upload Model"**

### **Step 3: Monitor Upload Process**
Watch the browser console for detailed logs. You should see:

✅ **Expected Success Flow**:
```
Starting model upload and listing...
Step 1: SEAL encryption and Walrus upload...
Encrypting model file...
Uploading encrypted file to Walrus...
Starting file upload...
Starting Walrus upload... 
[Success] Walrus upload successful
[Success] Blob ID generated: <blob_id>
Step 2: Creating marketplace listing...
[Success] Transaction submitted
[Success] Upload complete!
```

❌ **Possible Error Scenarios**:
```
# Scenario 1: Still need WAL tokens
"could not find WAL coins with sufficient balance"
→ Solution: Fund wallet with more WAL tokens

# Scenario 2: Network/CORS issues  
"CORS error" or "Network request failed"
→ Solution: Already fixed, but check if issue persists

# Scenario 3: SEAL encryption issues
"Encryption failed"
→ Solution: Check SEAL service configuration

# Scenario 4: Smart contract issues
"Transaction failed"
→ Solution: Check wallet connection and gas
```

### **Step 4: Verify Marketplace Listing**
1. Navigate to: **http://localhost:3003/marketplace**
2. Look for your newly uploaded model in the grid
3. Verify it shows correct title, price, and creator

### **Step 5: Verify Blockchain Events**
1. In marketplace page, the model should appear in the grid
2. Check browser console for event querying logs
3. Verify the event contains correct listing information

## 🔍 **Debugging Information**

### **Console Logs to Watch For**

**Upload Start**:
```
Starting Walrus upload
dataSize: 1234, epochs: 30, url: https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=30
```

**Upload Success**:
```
Walrus upload successful  
blobId: <walrus_blob_id>
```

**Upload Failure (with improved error messages)**:
```
Walrus upload failed
error: "could not find WAL coins with sufficient balance"
```

**Smart Contract Success**:
```
Transaction submitted successfully
transaction: <sui_transaction_hash>
```

## ⚡ **Quick Test Checklist**

- [ ] Upload page loads without errors
- [ ] File selection works
- [ ] Form validation works
- [ ] Wallet connection prompt appears
- [ ] Upload progress is visible
- [ ] Detailed error messages appear (if any)
- [ ] Success confirmation shows blob ID
- [ ] Marketplace shows new listing
- [ ] Event querying picks up the new model

## 🎯 **Success Criteria**

### **Minimum Success (Phase 1)**:
- Upload starts without immediate errors
- Detailed error messages show if WAL tokens needed
- No CORS or network connectivity issues

### **Full Success (Phase 2)**:
- Complete upload flow works end-to-end
- Blob ID generated successfully  
- Smart contract transaction confirmed
- Model appears in marketplace grid
- Download functionality available

## 🔧 **Troubleshooting**

### **If WAL Tokens Still Needed**:
The test confirmed wallet funding is required. Error should now show clearly:
```
"could not find WAL coins with sufficient balance"
```

### **If Upload Succeeds**:
🎉 **Congratulations!** The full stack is working:
- Walrus storage integration ✅
- SEAL encryption ✅  
- Smart contract integration ✅
- Marketplace event querying ✅
- UI components ✅

### **If Other Errors Occur**:
The improved error handling will show exactly what went wrong, making debugging much easier.

---

## 🚀 **Ready to Test!**

Navigate to: **http://localhost:3003/upload** and follow the steps above.

The upload should now either:
1. **Work completely** (if WAL tokens are sufficient)
2. **Show clear error messages** (if more tokens needed or other issues)

Either way, we'll have definitive information about the system status!