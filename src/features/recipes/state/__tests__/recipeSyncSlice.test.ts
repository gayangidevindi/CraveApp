import recipeSyncReducer, {
  hydrateRecipeSync,
  recipeSyncUpdated,
} from '../recipeSyncSlice';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
  },
}));

describe('recipe synchronization state', () => {
  it('does not replace a newer live sync time with stale hydration data', () => {
    const freshTimestamp = 1_798_000_000_100;
    const afterRequest = recipeSyncReducer(
      undefined,
      recipeSyncUpdated(freshTimestamp),
    );
    const afterHydration = recipeSyncReducer(afterRequest, {
      type: hydrateRecipeSync.fulfilled.type,
      payload: freshTimestamp - 500,
    });

    expect(afterHydration.lastSyncedAt).toBe(freshTimestamp);
    expect(afterHydration.hydrated).toBe(true);
  });
});
