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
    Checkbox,
    List,
    ListItem
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

        const requiredFields = ['lastName', 'address1', 'city', 'country'];

        if (address.countryCode == 'AE') {
            address.zip = null;
            requiredFields.push('province');
        } else {
            requiredFields.push('zip');
        }

        if (['AE', 'AU', 'CA', 'US'].includes(address.countryCode)) {
            requiredFields.push('province');
        }

        const newFieldErrors = {};

        for (let field of requiredFields) {
            if (typeof address[field] != 'string' || address[field].trim().length < 1) {
                newFieldErrors[field] = "This field is required";
            }
        }

        if (!address.shippingMethod) {
            newFieldErrors.shippingMethod = "You must choose a shipping method for this address";
        }

        if (address.items.length < 1) {
            newFieldErrors.items = "You must select at least one item to ship to this address";
        }


        if (Object.values(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            return;
        }

        onSave(address);
    }

    function onLineItemPress(line) {

        const lineId = line.id;
        let boxId = null;
        let ts = null;

        const tsAttr = line.attributes.find(attr => attr.key == '_ts');

        if (tsAttr) {
            ts = tsAttr.value;
        }

        let boxAttr = line.attributes.find(attr => attr.key == '_id');

        if (boxAttr) {
            boxId = boxAttr.value;
        } else if (Array.isArray(line.lineComponents) && line.lineComponents.length > 0) {

            for (let i = 0; i < line.lineComponents.length; i++) {
                boxAttr = line.lineComponents[i].attributes.find(attr => attr.key == '_id' || attr.value == '__box_id');

                if (!boxAttr) continue;

                boxId = boxAttr.value;
                break;
            }
        }

        const items = Array.isArray(address.items) ? [ ...address.items ] : [];

        const index = items.findIndex(item => item.lineId == lineId);

        if (index === -1) {
            items.push({ lineId, boxId, ts });
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
            if (!otherAddresses[i].items.find(item => item.lineId == lineId)) continue;
            return true;
        }

        return false;
    }

    function isLineBoxItem(line) {
        return line.attributes.findIndex(attr => attr.key == '_box_id') !== -1;
    }

    function renderLineItemAttr(line, attrName) {
        const attr = line.attributes.find(attr => attr.key == attrName);

        if (!attr || !attr.value) return null;

        let attrLines = attr.value.split("\n");

        return (
            <>
                <BlockSpacer />
                <List>
                    {
                        attrLines.map((attrLine, index) => {
                            if (!attrLine) return null;
                            return (
                                <ListItem key={`attr-${line.id}-${attrName}-${index}`}>{attrLine}</ListItem>
                            )
                        })
                    }
                </List>
            </>
        )

    }

    function onDeliveryMethodChange(value, rateName) {
        const nextAddress = { ...address, shippingMethod: value, shippingMethodName: rateName };
        setAddress(nextAddress);
    }

    function renderProvince(country) {

        switch(country) {
            case 'US':
                return (
                    <Select label="State"
                        options={[{"label":"Alabama","value":"Alabama"},{"label":"Alaska","value":"Alaska"},{"label":"American Samoa","value":"American Samoa"},{"label":"Arizona","value":"Arizona"},{"label":"Arkansas","value":"Arkansas"},{"label":"California","value":"California"},{"label":"Colorado","value":"Colorado"},{"label":"Connecticut","value":"Connecticut"},{"label":"Delaware","value":"Delaware"},{"label":"District of Columbia","value":"District of Columbia"},{"label":"Federated States of Micronesia","value":"Federated States of Micronesia"},{"label":"Florida","value":"Florida"},{"label":"Georgia","value":"Georgia"},{"label":"Guam","value":"Guam"},{"label":"Hawaii","value":"Hawaii"},{"label":"Idaho","value":"Idaho"},{"label":"Illinois","value":"Illinois"},{"label":"Indiana","value":"Indiana"},{"label":"Iowa","value":"Iowa"},{"label":"Kansas","value":"Kansas"},{"label":"Kentucky","value":"Kentucky"},{"label":"Louisiana","value":"Louisiana"},{"label":"Maine","value":"Maine"},{"label":"Marshall Islands","value":"Marshall Islands"},{"label":"Maryland","value":"Maryland"},{"label":"Massachusetts","value":"Massachusetts"},{"label":"Michigan","value":"Michigan"},{"label":"Minnesota","value":"Minnesota"},{"label":"Mississippi","value":"Mississippi"},{"label":"Missouri","value":"Missouri"},{"label":"Montana","value":"Montana"},{"label":"Nebraska","value":"Nebraska"},{"label":"Nevada","value":"Nevada"},{"label":"New Hampshire","value":"New Hampshire"},{"label":"New Jersey","value":"New Jersey"},{"label":"New Mexico","value":"New Mexico"},{"label":"New York","value":"New York"},{"label":"North Carolina","value":"North Carolina"},{"label":"North Dakota","value":"North Dakota"},{"label":"Northern Mariana Islands","value":"Northern Mariana Islands"},{"label":"Ohio","value":"Ohio"},{"label":"Oklahoma","value":"Oklahoma"},{"label":"Oregon","value":"Oregon"},{"label":"Palau","value":"Palau"},{"label":"Pennsylvania","value":"Pennsylvania"},{"label":"Puerto Rico","value":"Puerto Rico"},{"label":"Rhode Island","value":"Rhode Island"},{"label":"South Carolina","value":"South Carolina"},{"label":"South Dakota","value":"South Dakota"},{"label":"Tennessee","value":"Tennessee"},{"label":"Texas","value":"Texas"},{"label":"Utah","value":"Utah"},{"label":"Vermont","value":"Vermont"},{"label":"Virgin Island","value":"Virgin Island"},{"label":"Virginia","value":"Virginia"},{"label":"Washington","value":"Washington"},{"label":"West Virginia","value":"West Virginia"},{"label":"Wisconsin","value":"Wisconsin"},{"label":"Wyoming","value":"Wyoming"}]}
                        value={address.province}
                        onChange={value => setAddress(addr => ({ ...addr, province: value }))} />
                )
            case 'AU':
                return (
                    <Select label="State/territory"
                    options={[{"label":"New South Wales","value": "New South Wales"},{"label": "Northern Territory", "value": "Northern Territory"},{"label": "Queensland", "value": "Queensland"},{"label":"South Australia", "value": "South Australia"},{ "label": "Tasmania", "value": "Tasmania"},{ "label":"Victoria","value":"Victoria"},{ "label": "Western Australia", "value": "Western Australia"}]}
                    value={address.province}
                    onChange={value => setAddress(addr => ({ ...addr, province: value }))} />
                )
            case 'CA':
                return (
                    <Select label="Province"
                    options={[{"label":"Newfoundland and Labrador","value":"Newfoundland and Labrador"},{"label":"Prince Edward Island","value":"Prince Edward Island"},{"label":"Nova Scotia","value":"Nova Scotia"},{"label":"New Brunswick","value":"New Brunswick"},{"label":"Quebec","value":"Quebec"},{"label":"Ontario","value":"Ontario"},{"label":"Manitoba","value":"Manitoba"},{"label":"Saskatchewan","value":"Saskatchewan"},{"label":"Alberta","value":"Alberta"},{"label":"British Columbia","value":"British Columbia"}]}
                    value={address.province}
                    onChange={value => setAddress(addr => ({ ...addr, province: value }))} />
                )
            case 'AE':
                return (
                    <Select label="Emirate"
                        options={[{"label":"Abu Dhabi","value":"Abu Dhabi"},{"label":"Ajman","value":"Ajman"},{"label":"Dubai","value":"Dubai"},{"label":"Fujairah","value":"Fujairah"},{"label":"Ras al-Khaimah","value":"Ras al-Khaimah"},{"label":"Sharjah","value":"Sharjah"},{"label":"Umm al-Quwain","value":"Umm al-Quwain"}]}
                        value={address.province}
                        onChange={value => setAddress(addr => ({ ...addr, province: value }))} />
                )
            default:
                return null;
        }
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

                        {
                            renderProvince(address.countryCode)
                        }

                        {
                            address.countryCode != 'AE' && (
                                <TextField label="Postcode"
                                    required
                                    value={address.zip}
                                    onInput={value => setAddress(addr => ({ ...addr, zip: value }))}
                                    error={fieldErrors.zip}  />
                            )
                        }

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

                                        if (isLineBoxItem(line)) return null;

                                        return (
                                            <Pressable  border="base"
                                                        cornerRadius="base"
                                                        padding="base"
                                                        key={line.id}
                                                        onPress={() => onLineItemPress(line)}>
                                                <InlineLayout columns={['80%', 'fill']}
                                                            blockAlignment="center"
                                                            spacing="base">

                                                    <InlineStack spacing="base"
                                                                columns="auto"
                                                                blockAlignment="center">
                                                        <ProductThumbnail source={line.merchandise.image.url} opacity />

                                                        <View>
                                                            <Text key={line.id}>{line.merchandise.title}</Text>
                                                            {
                                                                renderLineItemAttr(line, 'Box Items')
                                                            }
                                                            {
                                                                line.lineComponents && line.lineComponents.length > 0 && (
                                                                    <>
                                                                        <BlockSpacer />
                                                                        <List>
                                                                            {
                                                                                line.lineComponents.map((componentLine, index) => {

                                                                                    if (componentLine.merchandise.id == line.merchandise.id) return null;

                                                                                    return (
                                                                                        <ListItem key={`line-${line.id}-${index}`}>
                                                                                            {componentLine.merchandise.title}
                                                                                        </ListItem>
                                                                                    )

                                                                                })
                                                                            }

                                                                        </List>
                                                                    </>

                                                                )
                                                            }
                                                        </View>



                                                    </InlineStack>

                                                    <View inlineAlignment="end">
                                                        <Checkbox checked={address?.items?.find(item => item.lineId == line.id)}
                                                                  onChange={() => onLineItemPress(line)} />
                                                    </View>


                                                </InlineLayout>

                                            </Pressable>
                                        )

                                    })
                                }
                            </BlockStack>
                            {
                                fieldErrors.items && (
                                    <Text appearance="critical">{fieldErrors.items}</Text>
                                )
                            }
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
