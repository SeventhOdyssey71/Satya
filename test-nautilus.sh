#!/bin/bash
# Quick Nautilus TEE Endpoint Tester

echo "🧪 Nautilus TEE Endpoint Testing Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "1️⃣  Checking if server is running..."
if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running${NC}"
    echo ""
    echo "To start the server, run:"
    echo -e "${YELLOW}cd nautilus-server && python3 ml_attestation_server.py${NC}"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "2️⃣  Running health check..."
curl -s http://localhost:3333/health | python3 -m json.tool
echo ""

echo "3️⃣  Listing available test models..."
curl -s http://localhost:3333/test_models | python3 -m json.tool
echo ""

echo "4️⃣  Testing HIGH QUALITY model (expected: 90-93% score)..."
echo "Request: GET /test_evaluate/high_quality_model.pkl/high_quality_test.csv"
response=$(curl -s http://localhost:3333/test_evaluate/high_quality_model.pkl/high_quality_test.csv)
echo "$response" | python3 -m json.tool
quality_score=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['evaluation']['quality_score'])" 2>/dev/null)
if [ -n "$quality_score" ]; then
    echo -e "${GREEN}✓ Quality Score: ${quality_score}${NC}"
fi
echo ""

echo "5️⃣  Testing MEDIUM QUALITY model (expected: 80-86% score)..."
response=$(curl -s http://localhost:3333/test_evaluate/medium_quality_model.pkl/medium_quality_test.csv)
quality_score=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['evaluation']['quality_score'])" 2>/dev/null)
if [ -n "$quality_score" ]; then
    echo -e "${GREEN}✓ Quality Score: ${quality_score}${NC}"
fi
echo ""

echo "6️⃣  Testing LOW QUALITY model (expected: 70-75% score)..."
response=$(curl -s http://localhost:3333/test_evaluate/low_quality_model.pkl/low_quality_test.csv)
quality_score=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['evaluation']['quality_score'])" 2>/dev/null)
if [ -n "$quality_score" ]; then
    echo -e "${GREEN}✓ Quality Score: ${quality_score}${NC}"
fi
echo ""

echo "7️⃣  Testing NEURAL NETWORK model (expected: 85-88% score)..."
response=$(curl -s http://localhost:3333/test_evaluate/neural_network_model.pkl/neural_network_test.csv)
quality_score=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['evaluation']['quality_score'])" 2>/dev/null)
if [ -n "$quality_score" ]; then
    echo -e "${GREEN}✓ Quality Score: ${quality_score}${NC}"
fi
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "📚 For more details, see: TESTING_NAUTILUS.md"
