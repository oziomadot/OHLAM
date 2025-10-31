import {Text, View} from 'react-native';
import Protected from 'components/Protected';

const PropertyScreen = () => {
    return(
        <Protected>
        <View>
            <Text>Property Screen</Text>
        </View>
        </Protected>
    );
}

export default PropertyScreen; 