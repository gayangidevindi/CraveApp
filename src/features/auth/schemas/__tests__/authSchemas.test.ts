import { loginSchema, registrationSchema } from '../authSchemas';

describe('loginSchema', () => {
  it('accepts a non-empty username and password', () => {
    expect(
      loginSchema.safeParse({
        username: 'emilys',
        password: 'emilyspass',
      }).success,
    ).toBe(true);
  });

  it('rejects empty credentials', () => {
    const result = loginSchema.safeParse({
      username: ' ',
      password: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('registrationSchema', () => {
  const validRegistration = {
    fullName: 'Taylor Crave',
    username: 'taylorc',
    email: 'taylor@example.com',
    password: 'securepass123',
    confirmPassword: 'securepass123',
  };

  it('accepts valid details with matching passwords', () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it('rejects invalid email addresses and mismatched passwords', () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      email: 'not-an-email',
      confirmPassword: 'differentpass',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toContainEqual([
        'email',
      ]);
      expect(result.error.issues.map((issue) => issue.path)).toContainEqual([
        'confirmPassword',
      ]);
    }
  });

  it('rejects unsupported username characters and oversized input', () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      username: 'invalid username',
    });

    expect(result.success).toBe(false);
  });
});
