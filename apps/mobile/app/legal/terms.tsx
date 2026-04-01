import { ScrollView, Text } from 'react-native';
import { Screen, Card, Title } from '../../src/components/ui';
import terms from '../../src/content/legal/ar/terms';

export default function Terms() {
  return (
    <Screen>
      <Title>الشروط والأحكام</Title>
      <Card>
        <ScrollView>
          <Text style={{ lineHeight: 22, textAlign: 'right' }}>{terms}</Text>
        </ScrollView>
      </Card>
    </Screen>
  );
}
