import { useEffect, useState } from 'react';

import {
  Banner,
  useApi,
  useAttributes,
  reactExtension,
  useCartLineTarget,
  useApplyCartLinesChange,
  useShippingAddress,
  View,
  Text
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.cart-line-item.render-after',
  () => <Extension />,
);

function Extension() {

    const [assignedAddress, setAssignedAddress] = useState(null);

    const cartLine = useCartLineTarget();
    const attributes = useAttributes();
    const shippingAddress = useShippingAddress();

    const applyCartLinesChange = useApplyCartLinesChange();

    useEffect(() => {

        (async () => {

            const shippingMethodsAttr = cartLine.attributes.find(attr => attr.key == '_shipping_methods');

            if (shippingMethodsAttr) return;

            let identifier = null;

            const tsAttr = cartLine.attributes.find(attr => attr.key == '_ts');

            if (tsAttr) {
                identifier = tsAttr.value;
            } else if (cartLine.lineComponents.length > 0) {
                const boxIdAttr = cartLine.lineComponents[0].attributes.find(attr => attr.key == '_id' || attr.key == '_box_id');
                identifier = boxIdAttr.value;
            }

            if (!identifier) {
                return;
            }

            const additionalAddressCartAttr = attributes.find(attr => attr.key == '__additional_addresses');

            if (!additionalAddressCartAttr) return

            try {
                const addresses = JSON.parse(additionalAddressCartAttr.value);

                let itemAddress = null;

                for (let i = 0; i < addresses.length; i++) {
                    const address = addresses[i];

                    const index = address.items.findIndex(item => item.boxId == identifier || item.ts == identifier);

                    if (index == -1) continue;

                    itemAddress = addressToString(address);

                    break;
                }

                if (!itemAddress) {
                    itemAddress = addressToString(shippingAddress);
                }

                setAssignedAddress(itemAddress);

            } catch(err) {
                console.error(err.message);
            }


        })();

    }, [attributes, shippingAddress, cartLine]);


    function addressToString(address, delimiter) {

        delimiter = typeof delimiter == 'string' ? delimiter : ', ';

        const addressProps = ['address1', 'address2', 'city', 'province', 'zip'];
        const addressParts = [];

        for (let i = 0; i < addressProps.length; i++) {
            const prop = addressProps[i];
            if (typeof address[prop] != 'string') continue;
            if (address[prop].trim().length < 1) continue;
            addressParts.push(address[prop]);
        }

        return addressParts.join(delimiter);
    }

    if (!assignedAddress) return null;

    return (
        <View>
            <Text appearance="subdued">{assignedAddress}</Text>
        </View>
    );
}
