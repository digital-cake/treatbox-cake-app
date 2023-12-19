import { useEffect, useState, useMemo, useCallback } from "react";
import { useAppBridge, useNavigate } from "@shopify/app-bridge-react";
import { useParams } from "react-router-dom";
import { getSessionToken } from "@shopify/app-bridge/utilities";

import {
    Frame,
    Page,
    Layout,
    AlphaCard,
    TextField,
    VerticalStack,
    Tag,
    Checkbox,
    Toast,
    AutoSelection,
    Listbox,
    LegacyStack,
    Spinner,
    Combobox,
    Button,
    SkeletonPage
} from "@shopify/polaris";

import countries from "../../countries.json";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";

export default function ShippingRate() {

    const routeParams = useParams();
    const navigate = useNavigate();
    const app = useAppBridge();

    const [id, setId] = useState(routeParams.id);

    const [rate, setRate] = useState({
        name: '',
        free_delivery_threshold_enabled: false,
        base_rate: null,
        free_delivery_threshold: null,
        countries: []
    });

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [displayDeleteConfirmation, setDisplayDeleteConfirmation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [countrySearchValue, setCountrySearchValue] = useState('');

    const [toasts, setToasts] = useState([]);

    function displayToast(content, error) {
        setToasts(toasts => [ ...toasts, { content, error } ]);
    }

    function dismissToast(toastIndex) {
        setToasts(toasts => toasts.filter((item, index) => index != toastIndex));
    }

    useEffect(() => {

        if (id === 'new') return;

        setLoading(true);

        (async () => {

            const token = await getSessionToken(app);

            let response = null;

            try {
                response = await fetch(`/api/shipping-rates/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                response = await response.json();

                if (response.server_error) {
                    displayToast(response.server_error, true);
                    navigate("/shipping-rates");
                    return;
                }

                setRate(response.shipping_rate);

            } catch(err) {
                displayToast("Server error", true);
                console.log(err);
            } finally {
                setLoading(false);
            }


        })();

    }, [id]);

    useEffect(() => {

        setFieldErrors({});

    }, [rate.name, rate.price, rate.free_delivery_threshold_enabled, rate.free_delivery_threshold]);

    async function onSaveAction() {

        setSaving(true);

        setFieldErrors({});

        const token = await getSessionToken(app);

        let response = null;

        try {

            response = await fetch(`/api/shipping-rates/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ shipping_rate: rate })
            });

            response = await response.json();

            if (response.field_errors) {
                setFieldErrors(response.field_errors);
                return;
            }

            if (response.server_error) {
                displayToast(response.server_error, true);
                return;
            }

            setRate(response.shipping_rate);

            if (id == 'new') {
                navigate(`/shipping-rates/${response.shipping_rate.id}`, { replace: true });
                setId(response.shipping_rate.id);
                displayToast(`Shipping rate created successfully`);
            } else {
                displayToast(`Shipping rate updated successfully`);
            }

        } catch(err) {
            displayToast(`Server Error: ${err.message}`, true);
            console.log(err);
        } finally {
            setSaving(false);
        }
    }

    async function onDeleteAction() {
        setDeleting(true);

        const token = await getSessionToken(app);

        let response = null;

        try {
            response = await fetch(`/api/shipping-rates/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
        } catch(err) {
            displayToast("Server error", true);
            console.log(err);
        } finally {
            setDeleting(false);
            navigate("/shipping-rates");
        }
    }

    function setRateProp(prop, value) {
        const newData = { ...rate };
        newData[prop] = value;
        setRate(newData);
    }

    const updateSelection = useCallback((selected) => {
          const nextSelectedCountries = new Set([...rate.countries]);

          if (nextSelectedCountries.has(selected)) {
            nextSelectedCountries.delete(selected);
          } else {
            nextSelectedCountries.add(selected);
          }

          setRateProp('countries', [...nextSelectedCountries]);

          setCountrySearchValue('');

    }, [rate]);

    const countryOptions = useMemo(() => {

        let list;
        const filterRegex = new RegExp(countrySearchValue, 'i');

        if (countrySearchValue) {
            list = countries.filter((country) => country.name.match(filterRegex));
          } else {
            list = countries;
        }

        return list.map(country => ({
            label: country.name,
            value: country.code
        }));

    }, [countrySearchValue]);

    const removeCountry = useCallback((country) => () => {
          updateSelection(country);
    }, [updateSelection]);

    const verticalContentMarkup = rate.countries.length > 0 ? (
      <LegacyStack spacing="extraTight" alignment="center">
        {rate.countries.map((country) => (
          <Tag key={`option-${country}`} onRemove={removeCountry(country)}>
            {countries.find(c => c.code == country).name}
          </Tag>
        ))}
      </LegacyStack>
    ) : null;

    if (loading) {
        return (
            <SkeletonPage primaryAction
                          backAction
                          narrowWidth>
                <Layout>
                    <Layout.Section>
                        <AlphaCard>
                            <div className="card-loader-wrapper">
                                <Spinner />
                            </div>
                        </AlphaCard>
                    </Layout.Section>
                </Layout>
            </SkeletonPage>
        )
    }

    return (
        <Frame>
            <Page
                primaryAction={{
                    content: 'Save',
                    loading: saving,
                    onAction: onSaveAction
                }}
                backAction={{
                    content: "Shipping rates",
                    url: "/shipping-rates"
                }}
                title={typeof rate.name == 'string' && rate.name.trim().length > 0 ? rate.name.trim() : "Shipping Rate"}
                narrowWidth>
                <Layout>
                    <Layout.Section>
                        <AlphaCard>
                            <VerticalStack gap="4">

                                <TextField
                                        autoComplete="off"
                                        label="Name"
                                        value={rate.name}
                                        onChange={(value) => setRateProp('name', value)}
                                        error={fieldErrors['shipping_rate.name'] ? fieldErrors['shipping_rate.name'].join("\n") : null} />


                                    <TextField
                                            autoComplete="off"
                                            type="number"
                                            label="Price"
                                            prefix="£"
                                            onChange={(value) => setRateProp('base_rate', value)}
                                            value={rate.base_rate}
                                            error={fieldErrors['shipping_rate.base_rate'] ? fieldErrors['shipping_rate.base_rate'].join("\n") : null}  />

                                    <Checkbox label="Free if cart total is above a specified price"
                                            checked={rate.free_delivery_threshold_enabled}
                                            onChange={() => setRateProp('free_delivery_threshold_enabled', !rate.free_delivery_threshold_enabled)} />

                                    {
                                        rate.free_delivery_threshold_enabled && (
                                            <TextField
                                                autoComplete="off"
                                                type="number"
                                                prefix="£"
                                                label="Free if cart total is above:"
                                                value={rate.free_delivery_threshold}
                                                onChange={(value) => setRateProp('free_delivery_threshold', value)}
                                                error={fieldErrors.free_delivery_threshold ? fieldErrors.free_delivery_threshold.join("\n") : null}
                                                />
                                        )
                                    }

                                    <Combobox
                                        allowMultiple
                                        activator={
                                            <Combobox.TextField
                                            autoComplete="off"
                                            label="Countries"
                                            value={countrySearchValue}
                                            suggestion={null}
                                            placeholder="Search countries"
                                            verticalContent={verticalContentMarkup}
                                            onChange={setCountrySearchValue}
                                          />
                                        }>
                                           <Listbox
                                                autoSelection={AutoSelection.None}
                                                onSelect={updateSelection}
                                            >
                                                {
                                                    countryOptions.length > 0 && countryOptions.map((option) => (
                                                        <Listbox.Option
                                                        key={option.value}
                                                        value={option.value}
                                                        selected={rate.countries.includes(option.value)}
                                                        accessibilityLabel={option.label}>
                                                            <Listbox.TextOption selected={rate.countries.includes(option.value)}>
                                                                {option.label}
                                                            </Listbox.TextOption>
                                                        </Listbox.Option>
                                                    ))
                                                }
                                            </Listbox>
                                    </Combobox>

                            </VerticalStack>
                        </AlphaCard>
                    </Layout.Section>
                    {
                        id !== 'new' && (
                            <Layout.Section>
                                <Button destructive
                                        plain
                                        loading={deleting}
                                        onClick={() => setDisplayDeleteConfirmation(true)}>Delete</Button>
                                <DeleteConfirmationModal
                                    resourceName="shipping rate"
                                    resourceTitle={rate.name}
                                    display={displayDeleteConfirmation}
                                    onCancel={() => setDisplayDeleteConfirmation(false)}
                                    onConfirm={onDeleteAction}
                                    deleting={deleting} />
                            </Layout.Section>
                        )
                    }
                </Layout>
            </Page>
            {
                toasts.map((toast, index) => (
                    <Toast
                        key={`toast-${index}`}
                        content={toast.content}
                        error={toast.error}
                        onDismiss={() => dismissToast(index)} />
                ))
            }
        </Frame>
    )

}
