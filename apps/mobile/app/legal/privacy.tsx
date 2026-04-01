import { ScrollView, Text } from 'react-native';
import { Screen, Card, Title } from '../../src/components/ui';
import privacy from '../../src/content/legal/ar/privacy';

export default function Privacy() {
  return (
    <Screen>
      <Title>سياسة الخصوصية</Title>
      <Card>
        <ScrollView>
          <Text style={{ lineHeight: 22, textAlign: 'right' }}>{privacy}</Text>
        </ScrollView>
      </Card>
    </Screen>
  );
}
