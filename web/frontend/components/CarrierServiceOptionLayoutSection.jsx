import {
    Layout,
    Text,
    Card,
    VerticalStack,
    Box,
    Spinner,
    Button,
    Banner,
    AlphaCard
} from "@shopify/polaris";

import { useAppBridge } from "@shopify/app-bridge-react";

import { useEffect, useState } from "react";
import { getSessionToken } from "@shopify/app-bridge/utilities";

import moment from "moment/moment";

export default function CarrierServiceOptionLayoutSection({ displayToast}) {

    const app = useAppBridge();

    const [carrierServiceOptionLoading, setCarrierServiceOptionLoading] = useState(true);
    const [carrierServiceOptionLoadError, setCarrierServiceOptionLoadError] = useState(null);
    const [activeCarrierService, setActiveCarrierService] = useState(null);
    const [carrierServiceActionLoading, setCarrierServiceActionLoading] = useState(false);

    async function loadCarrierServiceOption() {

        setCarrierServiceOptionLoading(true);
        setCarrierServiceOptionLoadError(null);

        const token = await getSessionToken(app);

        let response = null;

        try {
            response = await fetch('/api/active-carrier-service', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            response = await response.json();
        } catch(err) {
            setCarrierServiceOptionLoadError("Unable to load carrier service option");
            return;
        } finally {
            setCarrierServiceOptionLoading(false);
        }

        setActiveCarrierService(response.active_carrier_service);
    }

    useEffect(() => {
        loadCarrierServiceOption();
    }, []);

    async function onCarrierServiceActionClick() {
        setCarrierServiceActionLoading(true);

        const token = await getSessionToken(app);

        let response = null;

        try {
            response = await fetch('/api/active-carrier-service', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json'
                }
            });

            response = await response.json();

        } catch(err) {
            displayToast("Unable to change carrier service activation status. Please try again later", true);
            return;
        } finally {
            setCarrierServiceActionLoading(false);
        }

        if (response.server_error) {
            displayToast(response.server_error, true);
            return;
        }

        setActiveCarrierService(response.active_carrier_service);

    }

    function renderCarrierServiceOptionConfig() {

        if (carrierServiceOptionLoading) return null;

        if (carrierServiceOptionLoadError) {
            return (
                <Banner status="critical">
                    <p>
                        {carrierServiceOptionLoadError}
                    </p>
                    <Button plain
                            onClick={loadCarrierServiceOption}>Try again</Button>
                </Banner>
            )
        }

        if (!activeCarrierService) {
            return (
                <VerticalStack gap="4">
                    <Banner
                        title="Our carrier service is not active"
                        status="warning">
                        <p>
                            Customers will not be able to view shipping options configured within this app on your shop's checkout until this is activated
                        </p>
                    </Banner>
                    <Box>
                        <Button primary
                                loading={carrierServiceActionLoading}
                                onClick={onCarrierServiceActionClick}>Activate</Button>
                    </Box>
                </VerticalStack>
            )
        }

        return (
            <VerticalStack gap="4">
                <Banner
                    title="Our carrier service is active"
                    status="success">
                    <p>
                        Customers will be presented with the relavant shipping options configured within this app on your shop's checkout
                    </p>
                </Banner>
                <Text>Activated on: { moment(activeCarrierService.created_at).format('DD/MM/YYYY HH:mm') }</Text>
                <Box>
                    <Button destructive
                            plain
                            loading={carrierServiceActionLoading}
                            onClick={onCarrierServiceActionClick}>Deactivate</Button>
                </Box>
            </VerticalStack>
        )
    }

    return (
        <>
            <Layout.Section oneThird>
                <Box paddingBlockStart={4}>
                    <VerticalStack gap="4">
                        <Text id="CarrierServices" variant="headingMd">Carrier Service</Text>
                        <Text color="subdued" as="p">
                            Enable/disable carrier service on your store. This must be enabled in order for the app to present and charge combinded shipping options in the checkout
                        </Text>
                    </VerticalStack>
                </Box>

            </Layout.Section>
            <Layout.Section>
                <AlphaCard>
                    {
                        carrierServiceOptionLoading && (
                            <div className="card-loader-wrapper">
                                <Spinner />
                            </div>
                        )
                    }
                    {
                        renderCarrierServiceOptionConfig()
                    }
                </AlphaCard>
            </Layout.Section>
        </>
    )
}
