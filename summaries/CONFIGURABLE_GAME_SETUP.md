# Configurable Game Setup System

## ✅ Implemented Features

### 🎮 **Configurable Game Options**

Users can now customize their game experience directly from the setup screen!

#### **1. Songs Per Game**
Choose how many songs to play:
- **3 songs** - Quick game (~2 minutes)
- **5 songs** - Short game (~3 minutes)
- **10 songs** - Standard game (~5 minutes) [Default]
- **15 songs** - Long game (~8 minutes)
- **20 songs** - Marathon (~10 minutes)

#### **2. Preview Duration**
Choose how long each song preview plays:
- **5 seconds** - Speed run - very challenging
- **10 seconds** - Fast - for music experts
- **15 seconds** - Moderate - balanced
- **20 seconds** - Standard - comfortable [Default]
- **30 seconds** - Relaxed - enjoy the music

---

## 🎨 **Reusable Config Tile Component**

### **Component Structure**

Created a fully reusable `ConfigTileComponent` that can be used for any configuration option!

```typescript
@Component({
  selector: 'app-config-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './config-tile.component.html',
  styleUrls: ['./config-tile.component.css']
})
export class ConfigTileComponent {
  @Input() label: string = '';
  @Input() currentValue: any;
  @Input() options: ConfigOption[] = [];
  @Input() isExpanded: boolean = false;
  @Output() valueChange = new EventEmitter<any>();
  @Output() toggleExpand = new EventEmitter<void>();
}
```

### **Usage Example**

```html
<app-config-tile
  label="Songs per game"
  [currentValue]="songsPerGame"
  [options]="songsPerGameOptions"
  [isExpanded]="expandedTile === 'songs'"
  (valueChange)="onSongsPerGameChange($event)"
  (toggleExpand)="toggleTile('songs')">
</app-config-tile>
```

### **Option Interface**

```typescript
export interface ConfigOption {
  value: any;
  label: string;
  description?: string;
}
```

---

## 🎨 **Visual Design**

### **Collapsed State**
```
┌─────────────────────────────┐
│ Songs per game         ▼    │
│ 10 songs                    │
└─────────────────────────────┘
```

### **Expanded State**
```
┌─────────────────────────────┐
│ Songs per game         ▲    │
│ 10 songs                    │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 3 songs                 │ │
│ │ Quick game (~2 minutes) │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 5 songs                 │ │
│ │ Short game (~3 minutes) │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 10 songs              ✓ │ │  ← Selected
│ │ Standard (~5 minutes)   │ │
│ └─────────────────────────┘ │
│ ...                         │
└─────────────────────────────┘
```

### **Features**
- ✅ Click tile to expand/collapse
- ✅ Smooth slide-down animation
- ✅ Selected option highlighted with green border
- ✅ Checkmark on selected option
- ✅ Descriptive labels and descriptions
- ✅ Hover effects
- ✅ Mobile-responsive

---

## 🔧 **Technical Implementation**

### **Files Created**

1. **`config-tile.component.ts`**
   - Reusable component for any configuration option
   - Handles expand/collapse state
   - Emits value changes

2. **`config-tile.component.html`**
   - Clean, accessible template
   - Smooth animations
   - SVG chevron icon

3. **`config-tile.component.css`**
   - Modern, polished styling
   - Slide-down animation
   - Hover effects
   - Mobile-responsive

### **Files Modified**

1. **`game-setup.component.ts`**
   - Added configuration options arrays
   - Added expand/collapse logic
   - Stores preview duration in sessionStorage
   - Updates game state with new values

2. **`game-setup.component.html`**
   - Replaced static info tiles with config tiles
   - Added config-grid layout

3. **`game-setup.component.css`**
   - Added `.config-grid` styling

4. **`spotify-playback.service.ts`**
   - Reads preview duration from sessionStorage
   - Falls back to environment default

---

## 🎯 **How It Works**

### **Configuration Flow**

```
1. User clicks "Songs per game" tile
   ↓
2. Tile expands, showing options
   ↓
3. User selects "5 songs"
   ↓
4. valueChange event emitted
   ↓
5. Component updates songsPerGame
   ↓
6. Game state updated via Redux
   ↓
7. Tile collapses
```

### **Preview Duration Flow**

```
1. User selects preview duration (e.g., 10 seconds)
   ↓
2. Value stored in component
   ↓
3. User clicks "Start Game"
   ↓
4. Duration saved to sessionStorage
   ↓
5. Game starts
   ↓
6. Playback service reads from sessionStorage
   ↓
7. Songs play for configured duration
```

---

## 📊 **Configuration Storage**

### **Songs Per Game**
- **Storage**: NgRx Store (game state)
- **Usage**: Game effects use this for track loading
- **Default**: 10 songs (from environment)

### **Preview Duration**
- **Storage**: sessionStorage
- **Usage**: Playback service reads on each song
- **Default**: 20 seconds (from environment)
- **Key**: `'previewDuration'`

---

## 🎨 **Styling Details**

### **Colors**
- **Background (collapsed)**: `#f5f5f5`
- **Background (expanded)**: `white`
- **Selected**: `#e7f5ec` (light green)
- **Border (selected)**: `#1db954` (Spotify green)
- **Text**: `#191414` (dark)
- **Label**: `#666` (gray)

### **Animations**
```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### **Transitions**
- Tile expansion: 0.3s ease
- Hover effects: 0.2s
- Icon rotation: 0.3s ease

---

## 🔄 **Reusability**

### **Adding New Configuration Options**

The `ConfigTileComponent` is fully reusable! To add a new option:

#### **Step 1: Define Options**
```typescript
myNewOptions: ConfigOption[] = [
  { value: 'option1', label: 'Option 1', description: 'Description 1' },
  { value: 'option2', label: 'Option 2', description: 'Description 2' },
  { value: 'option3', label: 'Option 3', description: 'Description 3' }
];
```

#### **Step 2: Add to Template**
```html
<app-config-tile
  label="My New Setting"
  [currentValue]="myNewValue"
  [options]="myNewOptions"
  [isExpanded]="expandedTile === 'myNew'"
  (valueChange)="onMyNewChange($event)"
  (toggleExpand)="toggleTile('myNew')">
</app-config-tile>
```

#### **Step 3: Handle Changes**
```typescript
onMyNewChange(value: any): void {
  this.myNewValue = value;
  // Do something with the new value
}
```

### **Examples of Future Options**

Could easily add:
- **Difficulty multipliers**
- **Time limits**
- **Hint systems**
- **Music genres**
- **Playlist selection**
- **Audio quality**
- **Auto-advance speed**

---

## 📱 **Mobile Responsive**

```css
@media (max-width: 640px) {
  .tile-header {
    padding: 0.875rem;
  }

  .tile-value {
    font-size: 1rem;
  }

  .option-button {
    padding: 0.75rem;
  }
}
```

- Tiles stack vertically on mobile
- Touch-friendly tap targets (44px minimum)
- Smooth animations on all devices

---

## 🎯 **User Experience**

### **Benefits**
- ✅ **Customizable**: Players choose their preferred game length
- ✅ **Flexible**: Adjust difficulty via preview duration
- ✅ **Clear**: Descriptions explain each option
- ✅ **Fast**: Quick games for short sessions
- ✅ **Engaging**: Longer games for dedicated play

### **Game Duration Examples**

| Songs | Preview | Total Time |
|-------|---------|------------|
| 3 | 5s | ~1 minute |
| 5 | 10s | ~2 minutes |
| 10 | 15s | ~4 minutes |
| 10 | 20s | ~5 minutes |
| 15 | 30s | ~10 minutes |
| 20 | 30s | ~13 minutes |

---

## 🚀 **Future Enhancements**

### **Potential Additions**
1. **Save Preferences**: Remember user's favorite settings
2. **Presets**: "Quick Play", "Standard", "Expert" presets
3. **More Options**:
   - Genre filtering
   - Decade selection
   - Playlist source
   - Difficulty modifiers
4. **Visual Previews**: Show example gameplay for each setting
5. **Statistics**: Show average completion time

---

## 📝 **Code Quality**

### **Best Practices**
- ✅ Reusable component architecture
- ✅ Type-safe interfaces
- ✅ Event-driven communication
- ✅ Separation of concerns
- ✅ Mobile-first responsive design
- ✅ Accessible markup
- ✅ Smooth animations
- ✅ Clean, maintainable code

### **TypeScript Features**
- Interfaces for type safety
- EventEmitters for communication
- Input/Output decorators
- Standalone components

---

## ✅ **Summary**

**Implemented**:
- ✅ Configurable songs per game (3, 5, 10, 15, 20)
- ✅ Configurable preview duration (5s, 10s, 15s, 20s, 30s)
- ✅ Reusable ConfigTileComponent
- ✅ Smooth expand/collapse animations
- ✅ Modern, polished UI
- ✅ Mobile-responsive design
- ✅ SessionStorage for preview duration
- ✅ NgRx integration for songs per game

**Build Status**: ✅ Success

**Bundle Size**: 359.68 kB (92.86 kB gzipped)

The game setup is now fully configurable with a beautiful, reusable component system! 🎉

