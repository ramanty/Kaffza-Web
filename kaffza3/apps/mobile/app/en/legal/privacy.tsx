import { ScrollView, Text } from 'react-native';
import { Screen, Card, Title } from '../../../src/components/ui';
import privacy from '../../../src/content/legal/en/privacy';

export default function PrivacyEn() {
  return (
    <Screen>
      <Title>Privacy Policy</Title>
      <Card>
        <ScrollView>
          <Text style={{ lineHeight: 22, textAlign: 'left' }}>{privacy}</Text>
        </ScrollView>
      </Card>
    </Screen>
  );
}
