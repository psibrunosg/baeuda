export interface CityDirectoryEntry {
  id: string;
  icon: string;
  name: string;
  profession: string;
  side: 'north' | 'south';
  x: number;
  z: number;
  yaw: number;
}

export const CITY_DIRECTORY: readonly CityDirectoryEntry[] = [
  { id: 'petshop', icon: '🐶', name: 'Pet Shop', profession: 'Vet', side: 'north', x: -9.8, z: 1.55, yaw: Math.PI },
  { id: 'pharmacy', icon: '💊', name: 'Pharmacy', profession: 'Pharmacist', side: 'north', x: -7.1, z: 1.55, yaw: Math.PI },
  { id: 'market', icon: '🍎', name: 'Fruit Market', profession: 'Grocer', side: 'north', x: -4.2, z: 1.55, yaw: Math.PI },
  { id: 'cafe', icon: '☕', name: 'Corner Café', profession: 'Barista', side: 'north', x: -0.35, z: 1.98, yaw: Math.PI },
  { id: 'plaza', icon: '🎵', name: 'Central Plaza', profession: 'Musician', side: 'north', x: 4.4, z: 1.55, yaw: Math.PI },
  { id: 'tech', icon: '💻', name: 'Tech & Phone', profession: 'Technician', side: 'north', x: 7.1, z: 1.55, yaw: Math.PI },
  { id: 'barber', icon: '💈', name: 'Barber Shop', profession: 'Barber', side: 'north', x: 9.8, z: 1.55, yaw: Math.PI },
  { id: 'bookshop', icon: '📚', name: 'Bookshop', profession: 'Librarian', side: 'south', x: -9.8, z: 2.35, yaw: 0 },
  { id: 'boutique', icon: '👗', name: 'Clothing Store', profession: 'Shopkeeper', side: 'south', x: -7.2, z: 2.35, yaw: 0 },
  { id: 'bakery', icon: '🥖', name: 'Artisan Bakery', profession: 'Baker', side: 'south', x: -4.5, z: 2.35, yaw: 0 },
  { id: 'postbank', icon: '📮', name: 'Post & Bank', profession: 'Postal Worker', side: 'south', x: 0.15, z: 2.35, yaw: 0 },
  { id: 'tireshop', icon: '🔧', name: 'Tire Shop', profession: 'Mechanic', side: 'south', x: 4.6, z: 2.35, yaw: 0 },
  { id: 'worksite', icon: '👷', name: 'Work Site', profession: 'Builder', side: 'south', x: 7.3, z: 2.35, yaw: 0 },
  { id: 'pizzeria', icon: '🍕', name: 'Pizzeria', profession: 'Chef', side: 'south', x: 9.8, z: 2.35, yaw: 0 },
];

interface CityMinimapModalProps {
  onSelectLocation: (entry: CityDirectoryEntry) => void;
  onReplayCafeLesson1?: () => void;
  onEnterPizzeria?: () => void;
  onEnterPharmacy?: () => void;
  onClose: () => void;
}

export function CityMinimapModal({
  onSelectLocation,
  onReplayCafeLesson1,
  onEnterPizzeria,
  onEnterPharmacy,
  onClose,
}: CityMinimapModalProps) {
  const north = CITY_DIRECTORY.filter((e) => e.side === 'north');
  const south = CITY_DIRECTORY.filter((e) => e.side === 'south');

  return (
    <section
      className="badges-hub-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="City Map Directory"
    >
      <div className="badges-hub-panel">
        <header className="badges-hub-header">
          <strong style={{ fontSize: 15 }}>🗺 City Directory · Fast Travel</strong>
          <button type="button" className="badges-close-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="minimap-section-label">North Avenue</div>
        <div className="minimap-grid">
          {north.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="minimap-card"
              onClick={() => onSelectLocation(entry)}
            >
              <span className="minimap-icon" aria-hidden="true">{entry.icon}</span>
              <span className="minimap-name">{entry.name}</span>
              <span className="minimap-prof">{entry.profession}</span>
            </button>
          ))}
        </div>

        <div className="minimap-road">Cobblestone Boulevard</div>

        <div className="minimap-section-label">South Promenade</div>
        <div className="minimap-grid">
          {south.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="minimap-card"
              onClick={() => onSelectLocation(entry)}
            >
              <span className="minimap-icon" aria-hidden="true">{entry.icon}</span>
              <span className="minimap-name">{entry.name}</span>
              <span className="minimap-prof">{entry.profession}</span>
            </button>
          ))}
        </div>

        {(onReplayCafeLesson1 || onEnterPizzeria || onEnterPharmacy) && (
          <div className="minimap-interiors-bar">
            <span className="minimap-section-label" style={{ margin: 0 }}>Playable 3D Interiors &amp; Replay</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {onReplayCafeLesson1 && (
                <button
                  type="button"
                  className="minimap-card"
                  style={{ flexDirection: 'row', gap: 8, padding: '8px 14px' }}
                  onClick={onReplayCafeLesson1}
                >
                  <span aria-hidden="true">☕</span>
                  <span className="minimap-name">Replay Café Lesson 1</span>
                </button>
              )}
              {onEnterPizzeria && (
                <button
                  type="button"
                  className="minimap-card"
                  style={{ flexDirection: 'row', gap: 8, padding: '8px 14px' }}
                  onClick={onEnterPizzeria}
                >
                  <span aria-hidden="true">🍕</span>
                  <span className="minimap-name">Enter Pizzeria Kitchen</span>
                </button>
              )}
              {onEnterPharmacy && (
                <button
                  type="button"
                  className="minimap-card"
                  style={{ flexDirection: 'row', gap: 8, padding: '8px 14px' }}
                  onClick={onEnterPharmacy}
                >
                  <span aria-hidden="true">💊</span>
                  <span className="minimap-name">Enter Pharmacy Counter</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
