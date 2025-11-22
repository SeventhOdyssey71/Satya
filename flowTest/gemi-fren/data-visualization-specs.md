# Data Visualization Specifications & Guidelines

## Visual Component Standards

### Pending Models Display
```
LAYOUT: Card-based list with overflow handling
COMPONENTS:
┌─────────────────────────────────────────┐
│ Your Pending Models (5)                 │
├─────────────────────────────────────────┤
│ ┌─ Model A47B8... ─────── 2 days ago ──┐ │
│ │ Status: Pending Verification         │ │
│ │ [████████░░] 80% Complete            │ │
│ └─────────────────────────────────────┘ │
│ ┌─ Model C92F1... ─────── 5 hours ago ─┐ │
│ │ Status: TEE Processing               │ │
│ │ [███░░░░░░░] 30% Complete            │ │
│ └─────────────────────────────────────┘ │
│ + 3 more models                         │
└─────────────────────────────────────────┘

STYLING:
- Background: bg-white
- Border: border-gray-200 rounded-lg
- Padding: p-4
- Item spacing: space-y-2
- Progress bars: blue gradient with percentages
- Hover states: subtle shadow elevation
```

### Marketplace Models Grid
```
LAYOUT: Responsive grid with detailed cards
COMPONENTS:
┌─────────────── ┬─────────────── ┬───────────────┐
│ Model Title    │ Model Title    │ Model Title   │
│ Price: 0.5 SUI │ Price: 1.2 SUI │ Price: 0.8 SUI│
│ Quality: 87/100│ Quality: 92/100│ Quality: 78/100│
│ CV Category    │ NLP Category   │ CV Category   │
│ [View Details] │ [View Details] │ [View Details]│
└─────────────── ┴─────────────── ┴───────────────┘

STYLING:
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Cards: bg-gray-50 rounded p-3
- Headers: font-medium text-sm
- Prices: text-lg font-bold text-green-600
- Quality: progress bar with color coding
- Categories: small badges with category colors
```

### Platform Statistics Dashboard
```
LAYOUT: Three-column metrics with visual emphasis
COMPONENTS:
┌─────────────────────────────────────────┐
│           Platform Statistics           │
├─────────┬─────────────┬─────────────────┤
│    8    │     47      │       55        │
│ Pending │ Live Models │ Total Models    │
│ Models  │             │                 │
├─────────┼─────────────┼─────────────────┤
│  Blue   │   Green     │    Purple       │
│ Accent  │   Accent    │    Accent       │
└─────────┴─────────────┴─────────────────┘

STYLING:
- Container: grid-cols-3 gap-4
- Cards: text-center p-3 rounded
- Numbers: text-2xl font-bold
- Labels: text-xs uppercase
- Color scheme:
  * Pending: bg-blue-50 text-blue-600
  * Live: bg-green-50 text-green-600
  * Total: bg-purple-50 text-purple-600
```

## Interactive Elements

### Loading States
```
SKELETON LOADING:
┌─────────────────────────────────────────┐
│ ████████████████ Loading...             │
├─────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓ ░░░░░░░░░░                │
│ ▓▓▓▓▓▓░░░░░░ ▓▓▓▓▓▓▓▓▓▓░░░░░░          │
│ ▓▓▓▓▓▓▓▓▓▓▓▓ ░░░░░░░░░░                │
└─────────────────────────────────────────┘

SPINNER ANIMATIONS:
- Three-dot bounce animation for text responses
- Circular spinner for data fetching operations
- Progress bars for file operations
- Color: text-gray-400 with 0.1s stagger delays
```

### Hover Effects & Interactions
```
CARD HOVER STATES:
- Elevation: hover:shadow-lg transition-shadow
- Scale: hover:scale-[1.02] transform duration-200
- Border highlight: hover:border-blue-300

BUTTON INTERACTIONS:
- Primary: hover:bg-blue-600 from bg-blue-500
- Secondary: hover:bg-gray-100 from bg-white
- Disabled: opacity-50 cursor-not-allowed

LINK BEHAVIORS:
- Underline: hover:underline
- Color shift: hover:text-blue-600 from text-gray-700
```

### Responsive Breakpoints
```
MOBILE (sm): 
- Single column layouts
- Condensed card information
- Touch-friendly button sizes (min 44px)
- Simplified navigation

TABLET (md):
- Two-column grids
- Expanded card details
- Side-by-side comparisons
- Tabbed interfaces

DESKTOP (lg+):
- Three+ column layouts
- Full detail displays
- Multi-panel views
- Advanced filtering controls
```

## Data Formatting Standards

### Numerical Displays
```
CURRENCY (SUI):
- Format: "0.5000 SUI" (4 decimal places)
- Small amounts: "0.0001 SUI"
- Large amounts: "1,250.0000 SUI"
- Zero state: "Free" instead of "0.0000 SUI"

PERCENTAGES:
- Quality scores: "87%" (no decimals)
- Progress: "80% Complete"
- Success rates: "99.5%" (one decimal)

TIMESTAMPS:
- Relative: "2 hours ago", "3 days ago"
- Absolute: "Nov 22, 2025 at 2:30 PM"
- Precise: "2025-11-22T14:30:00Z" (for tooltips)

FILE SIZES:
- Bytes: "1.2 MB", "156 KB", "2.1 GB"
- Range indicators: "Large (>100MB)", "Small (<10MB)"
```

### Status Indicators
```
VERIFICATION STATES:
┌─ Pending ────┬─ Processing ──┬─ Complete ────┐
│ ⏳ Orange     │ ⚙️  Blue       │ ✅ Green      │
│ Queued       │ In Progress   │ Verified      │
└──────────────┴───────────────┴───────────────┘

QUALITY SCORES:
- 90-100: 🏆 Excellent (green)
- 80-89:  ⭐ Great (blue)
- 70-79:  👍 Good (yellow)
- 60-69:  ⚠️  Fair (orange)
- <60:    ❌ Poor (red)

MARKETPLACE STATUS:
- 🔵 Available: Ready for purchase
- 🟡 Limited: Few copies remaining
- 🔴 Sold Out: No longer available
- ⚪ Draft: Not yet published
```

### Error State Visualizations
```
EMPTY STATES:
┌─────────────────────────────────────────┐
│              📭                         │
│        No models found                  │
│                                         │
│ You haven't uploaded any models yet.    │
│ [Upload Your First Model]               │
└─────────────────────────────────────────┘

ERROR STATES:
┌─────────────────────────────────────────┐
│              ⚠️                         │
│        Something went wrong             │
│                                         │
│ We're having trouble loading your data. │
│ [Try Again] [Contact Support]           │
└─────────────────────────────────────────┘

NETWORK ERRORS:
┌─────────────────────────────────────────┐
│              🌐                         │
│       Connection timeout                │
│                                         │
│ Please check your connection and retry. │
│ [Retry] [Work Offline]                  │
└─────────────────────────────────────────┘
```

## Animation & Transitions

### Loading Animations
```css
/* Skeleton shimmer effect */
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

/* Bounce animation for loading dots */
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Fade-in for new content */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Micro-interactions
```
DATA UPDATES:
- Pulse green briefly when new data arrives
- Smooth number counting animations for statistics
- Slide-in animations for new list items

USER FEEDBACK:
- Button press: scale(0.95) for 100ms
- Success actions: checkmark animation
- Copy operations: brief "Copied!" tooltip

STATE CHANGES:
- Color transitions: 200ms ease-in-out
- Layout changes: 300ms ease-in-out
- Opacity fades: 150ms linear
```

## Accessibility Standards

### Color & Contrast
```
WCAG AA COMPLIANCE:
- Text contrast: minimum 4.5:1 ratio
- Large text: minimum 3:1 ratio
- Interactive elements: clear focus indicators
- Color-blind friendly: patterns + colors

SEMANTIC COLORS:
- Success: #10B981 (green)
- Warning: #F59E0B (amber)
- Error: #EF4444 (red)
- Info: #3B82F6 (blue)
- Neutral: #6B7280 (gray)
```

### Keyboard Navigation
```
FOCUS MANAGEMENT:
- Visible focus rings on all interactive elements
- Logical tab order through complex layouts
- Skip links for repetitive navigation
- Escape key to close modals/dropdowns

SCREEN READER SUPPORT:
- Semantic HTML structure (headings, lists, tables)
- Alt text for all meaningful images
- ARIA labels for complex interactions
- Live regions for dynamic content updates
```

### Motion & Preferences
```
REDUCED MOTION:
- Respect prefers-reduced-motion setting
- Disable animations when requested
- Provide instant transitions as fallback
- Maintain functionality without animation
```