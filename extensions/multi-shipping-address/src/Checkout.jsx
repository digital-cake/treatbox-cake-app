import { useEffect, useState } from 'react';

import {
    reactExtension,
    useCartLines,
    useBuyerJourneyIntercept,
    useAttributes,
    useApplyAttributeChange,
    useApi,
    Banner,
    Text,
    Button,
    Icon,
    BlockStack,
    ScrollView,
    InlineStack,
    View,
    Modal,
    Select,
    TextField,
    InlineLayout,
    BlockLayout,
    InlineSpacer,
    Heading,
    Pressable,
    BlockSpacer,
    Form
} from '@shopify/ui-extensions-react/checkout';

import countryOptions from './countryOptions';
import AddressEditModal from './AddressEditModal.jsx';

export default reactExtension(
  'purchase.checkout.delivery-address.render-after',
  () => <Extension />,
);

function Extension() {

    const {ui, query} = useApi();

    const cartLines = useCartLines();

    const [shippingCountries, setShippingCountries] = useState([]);
    const [additionalAddressEdit, setAdditionalAddressEdit] = useState({});
    const [addressSaving, setAddressSaving] = useState(false);
    const [additionalAddresses, setAdditionalAddresses] = useState([]);

    const attributes = useAttributes();
    const applyAttributeChange = useApplyAttributeChange();

    useEffect(() => {

        // applyAttributeChange({
        //     type: 'updateAttribute',
        //     key: '__additional_addresses',
        //     value: ''
        // });

        query(
            `query {
              shop {
                shipsToCountries
              }
            }`
        )
        .then(({data, errors}) => {
            setShippingCountries(data.shop.shipsToCountries);
        })
        .catch(console.error);

    }, []);

    useEffect(() => {

        for (let i = 0; i < attributes.length; i++) {
            if (attributes[i].key != "__additional_addresses") continue;

            if (!attributes[i].value) continue;

            try {
                const addresses = JSON.parse(attributes[i].value);
                setAdditionalAddresses(addresses);
            } catch(err) {
                console.error(err.message);
                break;
            }
        }

    }, [attributes]);

    useEffect(() => {

        console.log(additionalAddresses);

    }, [additionalAddresses]);

    useBuyerJourneyIntercept(({ canBlockProgress }) => {
        if (canBlockProgress) {
            // return {
            //     behavior: 'block',
            //     reason: "Invalid additional shipping address #1",
            //     errors: [
            //         {
            //             message: 'Shipping address in your additional shipping address is invalid',
            //         }
            //     ]
            // }
        }

        return {
            behavior: 'allow',
        };
    })

    if (cartLines.length < 2) return null;

    function addressToString(address, delimiter) {

        delimiter = typeof delimiter == 'string' ? delimiter : ', ';

        const addressProps = ['address1', 'address2', 'city', 'province', 'zip', 'country'];
        const addressParts = [];

        address.firstName == typeof address.firstName == 'string' && address.firstName.trim().length > 0 ?  address.firstName : "";
        addressParts.push(`${address.firstName} ${address.lastName}`.trim());

        for (let i = 0; i < addressProps.length; i++) {
            const prop = addressProps[i];
            if (typeof address[prop] != 'string') continue;
            if (address[prop].trim().length < 1) continue;
            addressParts.push(address[prop]);
        }

        return addressParts.join(delimiter);
    }

    async function onSaveAddress(address) {

        setAddressSaving(true);

        const additionalAddress = { ...address };

        additionalAddress.key = addressToString(additionalAddress, '-').toLowerCase();

        const duplicateAddressIndex = additionalAddresses.findIndex(addr => addr.key == additionalAddress.key);

        const newAdditialAddresses = [ ...additionalAddresses ];

        if (duplicateAddressIndex === -1) {
            newAdditialAddresses.push(additionalAddress);
        } else {
            newAdditialAddresses[duplicateAddressIndex] = additionalAddress;
        }

        await applyAttributeChange({
            type: 'updateAttribute',
            key: '__additional_addresses',
            value: JSON.stringify(newAdditialAddresses)
        });

        setAddressSaving(false);
        setAdditionalAddresses(newAdditialAddresses);

        ui.overlay.close('AdditionalAddressModal')

    };

    function onAddAdditionalAddressClick() {
        setAdditionalAddressEdit({
            id: `addr_${new Date().getTime()}`,
            countryCode: 'GB',
            country: 'United Kingdom',
            address1: '',
            address2: '',
            firstName: '',
            lastName: '',
            city: '',
            province: '',
            zip: '',
            items: []
        })
    }

    const additionalAddressModal = (
       <AddressEditModal
            initialAddress={additionalAddressEdit}
            onSave={onSaveAddress}
            saving={addressSaving}
            cartLines={cartLines}
            countryOptions={countryOptions.filter(opt => shippingCountries.includes(opt.value))}
            />
    );



    return (

    <BlockStack spacing="base">
        <BlockSpacer />

        <View>
            <Heading>Additional shipping addresses</Heading>
        </View>

        {
            additionalAddresses.map(addr => (
                <Pressable key={addr.key}>
                    <View border="base"
                          padding="base"
                          cornerRadius="base">
                        {addressToString(addr)}
                    </View>

                </Pressable>
            ))
        }

        <Button kind="secondary"
                onPress={onAddAdditionalAddressClick}
                overlay={additionalAddressModal}>
            <InlineStack blockAlignment="center">
                <Icon source="plus" />
                <Text>Add shipping address</Text>
            </InlineStack>
        </Button>

    </BlockStack>

    );
}
