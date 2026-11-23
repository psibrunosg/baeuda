import {
  canDeliverQuest,
  INVENTORY_CATALOG,
  type NpcQuest,
} from '../domain/inventoryAndQuests';
import type { SpeechKey } from '../domain/types';

interface InventoryQuestBarProps {
  inventoryIds: readonly string[];
  activeQuest: NpcQuest | null;
  onPlayAudio: (key: SpeechKey) => void;
  onDeliverQuest: (quest: NpcQuest) => void;
  onInspectEmptyBag?: () => void;
}

export function InventoryQuestBar({
  inventoryIds,
  activeQuest,
  onPlayAudio,
  onDeliverQuest,
  onInspectEmptyBag,
}: InventoryQuestBarProps) {
  const readyToDeliver = canDeliverQuest(activeQuest, inventoryIds);

  return (
    <>
      {activeQuest && (
        <div className={`quest-pill ${readyToDeliver ? 'ready' : ''}`}>
          <button
            type="button"
            className="quest-main"
            onClick={() => onPlayAudio(activeQuest.askSpeechKey)}
          >
            <span className="quest-npc" aria-hidden="true">
              {activeQuest.npcIcon}
            </span>
            <span className="quest-text">
              <strong>{activeQuest.npcName}:</strong> {activeQuest.prompt}
            </span>
          </button>
          {readyToDeliver && (
            <button
              type="button"
              className="quest-deliver-btn"
              onClick={() => onDeliverQuest(activeQuest)}
            >
              Give {activeQuest.targetIcon}
            </button>
          )}
        </div>
      )}

      <div className="inventory-bar" aria-label="Inventory">
        <button
          type="button"
          className="inventory-bag-btn"
          aria-label="Backpack"
          onClick={() => {
            if (inventoryIds.length === 0) onInspectEmptyBag?.();
          }}
        >
          🎒
        </button>
        {inventoryIds.length === 0 ? (
          <span className="inventory-empty">· · ·</span>
        ) : (
          inventoryIds.map((id) => {
            const item = INVENTORY_CATALOG[id];
            if (!item) return null;
            return (
              <button
                key={id}
                type="button"
                className="inventory-slot"
                aria-label={item.label}
                title={item.label}
                onClick={() => onPlayAudio(item.speechKey)}
              >
                {item.icon}
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
