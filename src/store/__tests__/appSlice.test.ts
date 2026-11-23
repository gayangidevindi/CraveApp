import appReducer, { setAppStatus } from '../appSlice';

describe('appSlice', () => {
  it('starts in the initializing state', () => {
    expect(appReducer(undefined, { type: 'unknown' })).toEqual({
      status: 'initializing',
    });
  });

  it('changes the application status to ready', () => {
    expect(appReducer(undefined, setAppStatus('ready'))).toEqual({
      status: 'ready',
    });
  });

  it('does not change state for an unrelated action', () => {
    const state = appReducer(undefined, setAppStatus('ready'));
    expect(appReducer(state, { type: 'unrelated/action' })).toBe(state);
  });
});
