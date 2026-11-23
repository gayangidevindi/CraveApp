import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '../../../navigation/types';
import { PlaceholderScreen } from '../../../shared/components/PlaceholderScreen';
import { CustomButton } from '../../../shared/components/CustomButton';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <PlaceholderScreen
      title="Welcome back"
      description="Authentication will be added in a later stage."
      icon="log-in"
    >
      <CustomButton
        title="Create an account"
        variant="outline"
        onPress={() => navigation.navigate('Register')}
        style={{ width: '100%', maxWidth: 360, marginTop: 24 }}
      />
    </PlaceholderScreen>
  );
}
