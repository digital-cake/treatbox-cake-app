import { useEffect, useState } from 'react';

import {
    Button,
    InlineStack,
    Modal,
    Select,
    TextField,
    InlineLayout,
    BlockLayout,
    Form,
    Heading,
    Text,
    View,
    BlockSpacer,
    Pressable,
    ProductThumbnail,
    BlockStack,
    Checkbox
} from '@shopify/ui-extensions-react/checkout';

import DeliveryMethodSelection from './DeliveryMethodSelection.jsx';

export default function AddressEditModal(props) {

    const {
        id,
        onSave,
        initialAddress,
        countryOptions,
        saving,
        cartLines,
        deleting,
        onDelete,
        otherAddresses,
        shop
    } = props;

    const [address, setAddress] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        setAddress(initialAddress);
    }, [initialAddress]);

    useEffect(() => {
        setFieldErrors({});
    }, [address?.firstName, address?.lastName, address?.address1, address?.city, address?.zip, address?.country]);

    function onCountryCodeChange(value) {
        setAddress(addr => ({ ...addr, countryCode: value }));

        const countryOption = countryOptions.find(opt => opt.value == value);
        setAddress(addr => ({ ...addr, country: countryOption.label }));
    };


    function onAddressSubmit() {

        setFieldErrors({});

        const requiredFields = ['lastName', 'address1', 'city', 'zip', 'country'];
        const newFieldErrors = {};

        for (let field of requiredFields) {
            if (typeof address[field] != 'string' || address[field].trim().length < 1) {
                newFieldErrors[field] = "This field is required";
            }
        }

        if (!address.shippingMethod) {
            newFieldErrors.shippingMethod = "You must choose a shipping method for this address";
        }

        if (Object.values(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            return;
        }

        onSave(address);
    }

    function onLineItemPress(lineId) {

        const items = Array.isArray(address.items) ? [ ...address.items ] : [];

        const index = items.indexOf(lineId);

        if (index === -1) {
            items.push(lineId);
        } else {
            items.splice(index, 1);
        }

        setAddress(addr => ({
            ...addr,
            items: items
        }));
    }

    function lineItemAssignedToOtherAddress(lineId) {
        for (let i = 0; i < otherAddresses.length; i++) {
            if (!otherAddresses[i].items.includes(lineId)) continue;
            return true;
        }

        return false;
    }

    function onDeliveryMethodChange(value) {
        const nextAddress = { ...address, shippingMethod: value };
        setAddress(nextAddress);
    }

    if (!address) return null;

    return (
        <Modal id={id}
            padding
            onOpen={() => setAddress(initialAddress)}
            title={address.key ? "Edit Address" : "Add address"}>

            <Form onSubmit={onAddressSubmit}>
                <BlockLayout spacing="base"
                             rows="auto">
                    <Select label="Country/Region"
                        options={countryOptions}
                        value={address.countryCode}
                        onChange={onCountryCodeChange}
                    />

                    <InlineLayout spacing='base'>
                        <TextField label="First Name (Optional)"
                                    onInput={value => setAddress(addr => ({ ...addr, firstName: value }))}
                                    value={address.firstName}  />
                        <TextField label="Last Name"
                                    required
                                    onInput={value => setAddress(addr => ({ ...addr, lastName: value }))}
                                    value={address.lastName}
                                    error={fieldErrors.lastName} />
                    </InlineLayout>

                    <TextField label="Address"
                                value={address.address1}
                                onInput={value => setAddress(addr => ({ ...addr, address1: value }))}
                                required
                                error={fieldErrors.address1} />

                    <TextField label="Apartment, suite, etc. (Optional)"
                                   value={address.address2}
                                   onInput={value => setAddress(addr => ({ ...addr, address2: value }))} />

                    <InlineLayout spacing='base'>
                        <TextField label="City"
                                    required
                                    value={address.city}
                                    onInput={value => setAddress(addr => ({ ...addr, city: value }))}
                                    error={fieldErrors.city}
                                    />
                        <TextField label="Postcode"
                                    required
                                    value={address.zip}
                                    onInput={value => setAddress(addr => ({ ...addr, zip: value }))}
                                    error={fieldErrors.zip}  />
                    </InlineLayout>

                    <BlockSpacer spacing="tight" />

                    <View>
                        <BlockStack>
                            <Heading>Shipping Items</Heading>
                            <Text>Select the items you would like to send to this address</Text>
                            <BlockStack spacing="tight">
                                {
                                    cartLines.map(line => {

                                        if (lineItemAssignedToOtherAddress(line.id)) return null;

                                        return (
                                            <Pressable  border="base"
                                                        cornerRadius="base"
                                                        padding="base"
                                                        key={line.id}
                                                        onPress={() => onLineItemPress(line.id)}>
                                                <InlineLayout columns={['80%', 'fill']}
                                                            blockAlignment="center"
                                                            spacing="base">

                                                    <InlineStack spacing="base"
                                                                columns="auto"
                                                                blockAlignment="center">
                                                        <ProductThumbnail source={line.merchandise.image.url} opacity />
                                                        <Text key={line.id}>{line.merchandise.title}</Text>
                                                    </InlineStack>

                                                    <View inlineAlignment="end">
                                                        <Checkbox checked={address?.items?.includes(line.id)}
                                                                  onChange={() => onLineItemPress(line.id)} />
                                                    </View>


                                                </InlineLayout>

                                            </Pressable>
                                        )

                                    })
                                }
                            </BlockStack>
                        </BlockStack>
                    </View>

                    <BlockSpacer spacing="tight" />

                    <DeliveryMethodSelection
                        countryCode={address.countryCode}
                        addressId={address.id}
                        onChange={onDeliveryMethodChange}
                        selected={address.shippingMethod ? address.shippingMethod : ""}
                        shop={shop} />

                    {
                        fieldErrors.shippingMethod && (
                            <Text appearance="critical">{fieldErrors.shippingMethod}</Text>
                        )
                    }

                    <InlineLayout blockAlignment="center">
                        {
                            address.key && (
                                <View>
                                    <Button accessibilityRole="button"
                                            kind="plain"
                                            loading={deleting}
                                            appearance='critical'
                                            onPress={onDelete}>
                                        Delete
                                    </Button>
                                </View>
                            )
                        }

                        <View inlineAlignment="end">
                            <Button loading={saving}
                                    accessibilityRole="submit">
                                { !address.key ? 'Add address' : 'Save address' }
                            </Button>
                        </View>
                    </InlineLayout>


                </BlockLayout>
            </Form>
        </Modal>
    )

}
