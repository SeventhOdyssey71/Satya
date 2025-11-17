#!/bin/bash

echo "🔄 Triggering failed task reset..."
echo "🌐 Opening reset page in browser..."

# Open the reset page in default browser
open http://localhost:3005/admin/reset

echo "✅ Reset page opened!"
echo "💡 The reset page will automatically:"
echo "   1. Clear failed tasks from localStorage"
echo "   2. Trigger context reset with new IDs"
echo "   3. Redirect to dashboard"
echo ""
echo "🔗 Production app is running at: http://localhost:3005"
echo "🔗 Dashboard: http://localhost:3005/dashboard"