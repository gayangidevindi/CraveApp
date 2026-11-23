import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '../../../navigation/types';
import { PlaceholderScreen } from '../../../shared/components/PlaceholderScreen';
import { CustomButton } from '../../../shared/components/CustomButton';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  return (
    <PlaceholderScreen
      title="Join CraveApp"
      description="Account creation is not active in this navigation preview."
      icon="user-plus"
    >
      <CustomButton
        title="Back to login"
        variant="outline"
        onPress={() => navigation.navigate('Login')}
        style={{ width: '100%', maxWidth: 360, marginTop: 24 }}
      />
    </PlaceholderScreen>
  );
}
