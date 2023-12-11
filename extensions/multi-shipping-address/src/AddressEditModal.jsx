import { useEffect, useState } from 'react';

import {
    Button,
    InlineStack,
    Modal,
    Select,
    TextField,
    InlineLayout,
    BlockLayout,
    Form
} from '@shopify/ui-extensions-react/checkout';

export default function AddressEditModal({ onSave, initialAddress, countryOptions, saving }) {

    const [address, setAddress] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        setAddress(initialAddress);
    }, [initialAddress]);

    useEffect(() => {
        setFieldErrors({});
    }, [address.firstName, address.lastName, address.address1, address.city, address.zip, address.country]);

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

        if (Object.values(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            return;
        }

        onSave(address);
    }

    return (
        <Modal id="AdditionalAddressModal"
            padding
            title={address.address1 ? address.address1 : "New address"}>

            <Form onSubmit={onAddressSubmit}>
                <BlockLayout spacing="base">
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

                    <InlineStack blockAlignment="center"
                                inlineAlignment="end">
                        <Button loading={saving}
                                accessibilityRole="submit"
                                >Add address</Button>
                    </InlineStack>


                </BlockLayout>
            </Form>
        </Modal>
    )

}
