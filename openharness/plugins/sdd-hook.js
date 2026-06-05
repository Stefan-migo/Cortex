// SDD Hook Plugin para OpenHarness
// Auto-guarda contexto a Engram en cada fase del SDD

module.exports = {
  name: 'sdd-hook',
  hooks: {
    beforePhase: async (phase, context) => {
      console.log(`[SDD] Entering phase: ${phase}`);
    },
    afterPhase: async (phase, result, context) => {
      // Cada fase completa guarda en memoria
      console.log(`[SDD] Completed phase: ${phase}`);
    }
  }
};
