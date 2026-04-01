import { ScrollView, Text } from 'react-native';
import { Screen, Card, Title } from '../../../src/components/ui';
import terms from '../../../src/content/legal/en/terms';

export default function TermsEn() {
  return (
    <Screen>
      <Title>Terms & Conditions</Title>
      <Card>
        <ScrollView>
          <Text style={{ lineHeight: 22, textAlign: 'left' }}>{terms}</Text>
        </ScrollView>
      </Card>
    </Screen>
  );
}
