import {
  AuthApiError,
  loginWithDummyJson,
  registerWithDummyJson,
  restoreSavedSession,
} from '../authApi';

const userResponse = {
  id: 1,
  username: 'emilys',
  email: 'emily.johnson@x.dummyjson.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: 'https://dummyjson.com/icon/emilys/128',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('authApi', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('posts login credentials and returns the user with session tokens', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        ...userResponse,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    );

    await expect(
      loginWithDummyJson({
        username: 'emilys',
        password: 'emilyspass',
      }),
    ).resolves.toEqual({
      user: userResponse,
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://dummyjson.com/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'emilys',
          password: 'emilyspass',
          expiresInMins: 30,
        }),
      }),
    );
  });

  it('reports invalid login credentials as an API error', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Invalid credentials' }, 401),
    );

    await expect(
      loginWithDummyJson({ username: 'wrong', password: 'wrong' }),
    ).rejects.toBeInstanceOf(AuthApiError);
  });

  it('posts registration to the simulated users endpoint', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 209, username: 'taylorc' }, 201),
    );

    await expect(
      registerWithDummyJson({
        firstName: 'Taylor',
        lastName: 'Crave',
        username: 'taylorc',
        email: 'taylor@example.com',
        password: 'securepass123',
      }),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://dummyjson.com/users/add',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Taylor',
          lastName: 'Crave',
          username: 'taylorc',
          email: 'taylor@example.com',
          password: 'securepass123',
        }),
      }),
    );
  });

  it('refreshes an expired access token before restoring the user', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ message: 'Invalid/Expired Token' }, 401),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        }),
      )
      .mockResolvedValueOnce(jsonResponse(userResponse));

    await expect(
      restoreSavedSession({
        accessToken: 'expired-access-token',
        refreshToken: 'saved-refresh-token',
      }),
    ).resolves.toEqual({
      user: userResponse,
      tokens: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://dummyjson.com/auth/me',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer expired-access-token',
        },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://dummyjson.com/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'saved-refresh-token',
          expiresInMins: 30,
        }),
      }),
    );
  });
});
