import type { WorldMapId } from '../domain/types';
import { ACTIVE_WORLD_MAPS, WORLD_MAP_REGISTRY } from '../scene/worldNavigation';

import { getCefrLabel } from '../domain/curriculumMap';
import type { NextStepRecommendation, SessionBucket } from '../domain/types';

const BUCKET_LABELS: Record<SessionBucket, string> = {
  spiral: 'Avanço',
  retention: 'Revisão',
  application: 'Aplicação',
};

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
  // Z1 Centro + Z3 Parque (Main Avenue & North Park)
  { id: 'market', icon: '🍎', name: 'Fruit Market', profession: 'Grocer', side: 'north', x: -3.6, z: -1.4, yaw: Math.PI },
  { id: 'cafe', icon: '☕', name: 'Corner Café', profession: 'Barista', side: 'north', x: -0.35, z: -0.5, yaw: Math.PI },
  { id: 'bakery', icon: '🥖', name: 'Artisan Bakery', profession: 'Baker', side: 'north', x: 3.8, z: -1.4, yaw: Math.PI },
  { id: 'plaza', icon: '🎵', name: 'Central Plaza', profession: 'Musician', side: 'north', x: -1.6, z: -6.1, yaw: Math.PI },
  { id: 'bookshop', icon: '📚', name: 'Bookshop', profession: 'Librarian', side: 'north', x: -13.8, z: -1.4, yaw: Math.PI },
  { id: 'boutique', icon: '👗', name: 'Clothing Store', profession: 'Shopkeeper', side: 'north', x: -9.8, z: -1.4, yaw: Math.PI },
  { id: 'barber', icon: '💈', name: 'Barber Shop', profession: 'Barber', side: 'north', x: 13.5, z: -1.4, yaw: Math.PI },
  // Z1 South Block + Z4 Services East + Z5 Coast
  { id: 'pizzeria', icon: '🍕', name: 'Pizzeria', profession: 'Chef', side: 'south', x: -3.6, z: 5.7, yaw: Math.PI },
  { id: 'pharmacy', icon: '💊', name: 'Pharmacy', profession: 'Pharmacist', side: 'south', x: 0.0, z: 5.7, yaw: Math.PI },
  { id: 'petshop', icon: '🐶', name: 'Pet Shop', profession: 'Vet', side: 'south', x: 3.8, z: 5.7, yaw: Math.PI },
  { id: 'postbank', icon: '📮', name: 'Post & Bank', profession: 'Postal Worker', side: 'south', x: 0.0, z: 10.7, yaw: Math.PI },
  { id: 'tech', icon: '💻', name: 'Tech & Phone', profession: 'Technician', side: 'south', x: 16.6, z: -1.4, yaw: Math.PI },
  { id: 'tireshop', icon: '🔧', name: 'Tire Shop', profession: 'Mechanic', side: 'south', x: 13.5, z: 5.7, yaw: Math.PI },
  { id: 'worksite', icon: '👷', name: 'Work Site', profession: 'Builder', side: 'south', x: 16.6, z: 5.7, yaw: Math.PI },
];

interface CityMinimapModalProps {
  currentMapId?: WorldMapId;
  onTravelToMap?: (mapId: WorldMapId) => void;
  onSelectLocation: (entry: CityDirectoryEntry) => void;
  nextStep?: NextStepRecommendation;
  onTriggerNextStep?: (step: NextStepRecommendation) => void;
  onOpenPractice?: () => void;
  onOpenQuests?: () => void;
  onOpenStories?: () => void;
  onReplayCafeLesson1?: () => void;
  onEnterPizzeria?: () => void;
  onEnterPharmacy?: () => void;
  onClose: () => void;
}

export function CityMinimapModal({
  currentMapId = 'town',
  onTravelToMap,
  onSelectLocation,
  nextStep,
  onTriggerNextStep,
  onOpenPractice,
  onOpenQuests,
  onOpenStories,
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

        {nextStep && onTriggerNextStep && (
          <div className="minimap-next-step-card" data-next-bucket={nextStep.bucket}>
            <div className="minimap-next-step-body">
              <div className="minimap-next-step-meta">
                <span className={`next-bucket-tag bucket-${nextStep.bucket}`}>
                  {BUCKET_LABELS[nextStep.bucket]}
                </span>
                <span className="next-cefr-tag">{getCefrLabel(nextStep.cefrLevel)}</span>
              </div>
              <strong className="minimap-next-step-title">{nextStep.title}</strong>
              <span className="minimap-next-step-sub">{nextStep.subtitle}</span>
            </div>
            <button
              type="button"
              className="minimap-next-step-cta"
              onClick={() => onTriggerNextStep(nextStep)}
            >
              Start →
            </button>
          </div>
        )}

        {onTravelToMap && (
          <div className="minimap-interiors-bar" style={{ marginTop: 0, marginBottom: 12 }}>
            <span className="minimap-section-label" style={{ margin: 0 }}>World Maps · Biomes &amp; 2.5D Interiors</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {ACTIVE_WORLD_MAPS.map((mapId) => {
                const cfg = WORLD_MAP_REGISTRY[mapId];
                const isCurrent = currentMapId === mapId;
                return (
                  <button
                    key={mapId}
                    type="button"
                    className="minimap-card"
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                      padding: '8px 14px',
                      borderColor: isCurrent ? '#f59e0b' : undefined,
                      opacity: isCurrent ? 0.95 : 1,
                    }}
                    onClick={() => onTravelToMap(mapId)}
                  >
                    <span aria-hidden="true">{cfg.icon}</span>
                    <span className="minimap-name">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

        {(onOpenPractice || onReplayCafeLesson1 || onEnterPizzeria || onEnterPharmacy) && (
          <div className="minimap-interiors-bar">
            <span className="minimap-section-label" style={{ margin: 0 }}>Playable 3D Interiors &amp; Practice</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {onOpenPractice && (
                <button
                  type="button"
                  className="minimap-card"
                  style={{ flexDirection: 'row', gap: 8, padding: '8px 14px', borderColor: '#ea580c' }}
                  onClick={onOpenPractice}
                >
                  <span aria-hidden="true">⚡</span>
                  <span className="minimap-name">Practice Units</span>
                </button>
              )}
              {onOpenQuests && (
                <button
                  type="button"
                  className="minimap-card"
                  style={{ flexDirection: 'row', gap: 8, padding: '8px 14px' }}
                  onClick={onOpenQuests}
                >
                  <span aria-hidden="true">🎯</span>
                  <span className="minimap-name">Daily Quests</span>
                </button>
              )}
              {onOpenStories && (
                <button
                  type="button"
                  className="minimap-card"
                  style={{ flexDirection: 'row', gap: 8, padding: '8px 14px' }}
                  onClick={onOpenStories}
                >
                  <span aria-hidden="true">📖</span>
                  <span className="minimap-name">City Stories</span>
                </button>
              )}
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
