#!/bin/bash

echo "Cleaning all emojis from the codebase..."

# List of common emojis to remove from code
EMOJIS=(
  "🤖" "🧠" "👁️" "💬" "🔊" "⚡" "🎯" "🖼️" "🎥" "🎵" "📄" "📦" "📕"
  "🔒" "⛓️" "🌍" "✨" "🛠️" "🚨" "🔍" "📋" "🔄" "⚠️" "❌" "✅" "🎉"
  "📦" "📥" "🔓" "🔐" "🎊" "💰" "🏆" "📊" "💡" "🚀" "💎" "🔥"
  "👀" "💻" "📱" "🌐" "🔗" "📈" "📉" "💼" "🎨" "🎭" "🎪" "🎨"
  "🎪" "🎭" "🎨" "🎯" "🎮" "🕐" "🕑" "🕒" "🕓" "🕔" "🕕" "🕖"
)

# Function to clean emojis from a file
clean_file() {
    local file="$1"
    echo "Cleaning: $file"
    
    # Create a backup
    cp "$file" "$file.backup"
    
    # Remove each emoji
    for emoji in "${EMOJIS[@]}"; do
        # Remove emoji and any following space
        sed -i '' "s/$emoji //g" "$file"
        # Remove standalone emoji
        sed -i '' "s/$emoji//g" "$file"
    done
    
    # Clean up any double spaces
    sed -i '' 's/  / /g' "$file"
    
    # Clean up empty string returns
    sed -i '' "s/return ''/return/g" "$file"
    sed -i '' "s/return \"\"//g" "$file"
}

# Find and clean TypeScript/JavaScript files
echo "Finding TypeScript and JavaScript files..."
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
    clean_file "$file"
done

echo "Emoji cleanup complete!"
echo "Backup files created with .backup extension"