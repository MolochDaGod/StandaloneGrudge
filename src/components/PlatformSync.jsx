import React, { useState, useEffect } from 'react';
import grudgeSync from '../utils/grudgeSyncSDK';
import useGameStore from '../stores/gameStore';

/**
 * Platform Sync Panel
 * Allows users to connect to grudgewarlords.com and import/export characters
 */
export default function PlatformSync({ onClose }) {
  const [isConnected, setIsConnected] = useState(false);
  const [syncUser, setSyncUser] = useState(null);
  const [platformCharacters, setPlatformCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'export'

  // Game store
  const heroRoster = useGameStore(s => s.heroRoster) || [];
  const addHero = useGameStore(s => s.addHeroToRoster);

  // Check connection status on mount
  useEffect(() => {
    const connected = grudgeSync.isConnected();
    setIsConnected(connected);
    if (connected) {
      setSyncUser(grudgeSync.getSyncUser());
      loadPlatformCharacters();
    }
  }, []);

  // Load characters from platform
  const loadPlatformCharacters = async () => {
    setLoading(true);
    setError(null);
    try {
      const characters = await grudgeSync.fetchPlatformCharacters();
      setPlatformCharacters(characters);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Connect to platform
  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await grudgeSync.connectToPlatform();
      setIsConnected(true);
      setSyncUser(user);
      await loadPlatformCharacters();
      setSuccessMessage('Connected to Grudge Warlords!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Disconnect from platform
  const handleDisconnect = () => {
    grudgeSync.disconnect();
    setIsConnected(false);
    setSyncUser(null);
    setPlatformCharacters([]);
    setSuccessMessage('Disconnected from platform');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Import a character
  const handleImport = (platformChar) => {
    try {
      const grudaWarsChar = grudgeSync.importCharacter(platformChar);
      
      // Add to game store
      addHero({
        ...grudaWarsChar,
        id: grudaWarsChar.id,
        currentHealth: grudaWarsChar.currentHealth,
        currentMana: grudaWarsChar.currentMana,
        currentStamina: grudaWarsChar.currentStamina,
      });

      setSuccessMessage(`Imported ${grudaWarsChar.name}!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Export a character
  const handleExport = async (hero) => {
    setLoading(true);
    setError(null);
    try {
      await grudgeSync.exportCharacter(hero);
      setSuccessMessage(`Exported ${hero.name} to Grudge Warlords!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sync progress
  const handleSync = async (hero) => {
    setLoading(true);
    setError(null);
    try {
      await grudgeSync.syncProgress(hero);
      setSuccessMessage(`Synced ${hero.name}'s progress!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(to bottom, #1a1520, #0d0a10)',
          border: '2px solid #DB6331', borderRadius: 12,
          maxWidth: 600, width: '100%', maxHeight: '80vh',
          overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(219,99,49,0.2), transparent)',
          padding: 16, borderBottom: '1px solid #464154',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: 'rgba(219,99,49,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem',
              }}>🔗</div>
              <div>
                <h2 className="font-cinzel" style={{ fontSize: '1.25rem', color: '#FAAC47', margin: 0 }}>Platform Sync</h2>
                <p style={{ fontSize: '0.85rem', color: '#a5b4d0', margin: 0 }}>
                  {isConnected 
                    ? `Connected as ${syncUser?.username || 'User'}` 
                    : 'Connect to grudgewarlords.com'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 6,
                background: 'rgba(139,55,46,0.5)', border: 'none',
                color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{
            background: 'rgba(139,55,46,0.3)', borderBottom: '1px solid #8B372E',
            padding: 12, color: '#fca5a5', fontSize: '0.85rem',
          }}>⚠️ {error}</div>
        )}
        {successMessage && (
          <div style={{
            background: 'rgba(34,197,94,0.15)', borderBottom: '1px solid #22c55e',
            padding: 12, color: '#86efac', fontSize: '0.85rem',
          }}>✓ {successMessage}</div>
        )}

        {/* Content */}
        <div style={{ padding: 16, overflowY: 'auto', maxHeight: 'calc(80vh - 200px)' }}>
          {!isConnected ? (
            /* Not Connected View */
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: 80, height: 80, margin: '0 auto 16px',
                borderRadius: '50%', background: 'rgba(219,99,49,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem',
              }}>🏰</div>
              <h3 className="font-cinzel" style={{ fontSize: '1.1rem', color: '#e8eaf6', marginBottom: 8 }}>Connect Your Account</h3>
              <p style={{ color: '#a5b4d0', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                Link your grudgewarlords.com account to import existing characters 
                or export your GRUDA Wars heroes to the main platform.
              </p>
              <button
                onClick={handleConnect}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, #DB6331, #FAAC47)',
                  border: 'none', borderRadius: 8,
                  color: '#000', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? '⏳ Connecting...' : '🔗 Connect to Grudge Warlords'}
              </button>
            </div>
          ) : (
            /* Connected View */
            <>
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  onClick={() => setActiveTab('import')}
                  style={{
                    flex: 1, padding: '8px 16px', borderRadius: 8,
                    fontWeight: 500, border: 'none', cursor: 'pointer',
                    background: activeTab === 'import' ? '#DB6331' : 'rgba(70,65,84,0.5)',
                    color: activeTab === 'import' ? 'white' : '#a5b4d0',
                  }}
                >📥 Import Characters</button>
                <button
                  onClick={() => setActiveTab('export')}
                  style={{
                    flex: 1, padding: '8px 16px', borderRadius: 8,
                    fontWeight: 500, border: 'none', cursor: 'pointer',
                    background: activeTab === 'export' ? '#DB6331' : 'rgba(70,65,84,0.5)',
                    color: activeTab === 'export' ? 'white' : '#a5b4d0',
                  }}
                >📤 Export Heroes</button>
              </div>

              {activeTab === 'import' ? (
                /* Import Tab */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h4 style={{ color: '#FAAC47', fontWeight: 500, margin: 0 }}>Your Platform Characters</h4>
                    <button
                      onClick={loadPlatformCharacters}
                      disabled={loading}
                      style={{ fontSize: '0.85rem', color: '#a5b4d0', background: 'none', border: 'none', cursor: 'pointer' }}
                    >🔄 Refresh</button>
                  </div>

                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#a5b4d0' }}>⏳ Loading characters...</div>
                  ) : platformCharacters.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#a5b4d0' }}>
                      <p>No characters found on grudgewarlords.com</p>
                      <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Create characters on the main platform to import them here.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {platformCharacters.map(char => (
                        <CharacterCard
                          key={char.id}
                          character={char}
                          action="import"
                          onAction={() => handleImport(char)}
                          loading={loading}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Export Tab */
                <div>
                  <h4 style={{ color: '#FAAC47', fontWeight: 500, marginBottom: 12 }}>Your GRUDA Wars Heroes</h4>
                  
                  {heroRoster.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#a5b4d0' }}>
                      <p>No heroes to export</p>
                      <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Create heroes in GRUDA Wars to export them.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {heroRoster.map(hero => (
                        <div
                          key={hero.id}
                          style={{
                            background: '#0b1020', border: '1px solid #464154',
                            borderRadius: 8, padding: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 48, height: 48, borderRadius: 6,
                              background: 'rgba(70,65,84,0.5)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '1.5rem',
                            }}>⚔️</div>
                            <div>
                              <div style={{ fontWeight: 500, color: '#e8eaf6' }}>{hero.name}</div>
                              <div style={{ fontSize: '0.85rem', color: '#a5b4d0' }}>
                                Lv.{hero.level} {hero.classId}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => hero.platformId ? handleSync(hero) : handleExport(hero)}
                            disabled={loading}
                            style={{
                              padding: '6px 12px',
                              background: hero.platformId ? 'rgba(34,197,94,0.2)' : 'rgba(219,99,49,0.2)',
                              border: `1px solid ${hero.platformId ? '#22c55e' : '#DB6331'}`,
                              color: hero.platformId ? '#22c55e' : '#DB6331',
                              fontSize: '0.85rem', borderRadius: 6, cursor: 'pointer',
                              opacity: loading ? 0.5 : 1,
                            }}
                          >
                            {hero.platformId ? '🔄 Sync' : '📤 Export'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Disconnect Button */}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #464154' }}>
                <button
                  onClick={handleDisconnect}
                  style={{ fontSize: '0.85rem', color: '#8B372E', background: 'none', border: 'none', cursor: 'pointer' }}
                >🔌 Disconnect from Platform</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Character Card Component
 */
function CharacterCard({ character, action, onAction, loading }) {
  const classColors = {
    warrior: '#ef4444',
    mage: '#8b5cf6',
    worge: '#d97706',
    ranger: '#22c55e',
    druid: '#d97706',
    rogue: '#22c55e',
    cleric: '#8b5cf6',
  };

  const classId = character.classId?.toLowerCase() || 'warrior';
  const color = classColors[classId] || '#9ca3af';

  return (
    <div style={{
      background: '#0b1020', border: '1px solid #464154',
      borderRadius: 8, padding: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 6,
          background: `${color}33`, border: `1px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem',
        }}>⚔️</div>
        <div>
          <div style={{ fontWeight: 500, color: '#e8eaf6' }}>{character.name}</div>
          <div style={{ fontSize: '0.85rem', color: '#a5b4d0' }}>
            Lv.{character.level || 1} {character.classId || 'Unknown'} • {character.raceId || 'Human'}
          </div>
        </div>
      </div>
      <button
        onClick={onAction}
        disabled={loading}
        style={{
          padding: '8px 16px',
          background: 'rgba(219,99,49,0.2)',
          border: '1px solid #DB6331',
          color: '#DB6331',
          fontSize: '0.85rem', borderRadius: 6, cursor: 'pointer',
          opacity: loading ? 0.5 : 1,
        }}
      >
        {action === 'import' ? '📥 Import' : '📤 Export'}
      </button>
    </div>
  );
}
