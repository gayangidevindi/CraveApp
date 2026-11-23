import {
  createDefaultUserProfile,
  profileFormSchema,
} from '../profileTypes';

describe('profileFormSchema', () => {
  it('accepts a valid profile with optional contact details', () => {
    expect(
      profileFormSchema.safeParse(
        createDefaultUserProfile('Alex Example'),
      ).success,
    ).toBe(true);
  });

  it('rejects invalid phone numbers and impossible dates', () => {
    expect(
      profileFormSchema.safeParse({
        ...createDefaultUserProfile('Alex Example'),
        phoneNumber: 'call me',
        dateOfBirth: '1990-02-31',
      }).success,
    ).toBe(false);
  });
});
