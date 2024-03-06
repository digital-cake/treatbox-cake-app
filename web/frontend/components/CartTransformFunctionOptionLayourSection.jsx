import { useEffect, useState } from "react";

import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";

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

export default function CartTransformFunctionOptionLayourSection({ displayToast, functionName, heading, info, functionTitle, activeMessage, inactiveMessage }) {

    const app = useAppBridge();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [cartTransform, setCartTransform] = useState(null);

    async function loadByobBundlesOption() {

        setLoading(true);
        setError(null);

        const token = await getSessionToken(app);

        let response = null;

        try {
            response = await fetch(`/api/cart-transform/${functionName}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            response = await response.json();
        } catch(err) {
            setError("Unable to load build your own box bundle settings");
            return;
        } finally {
            setLoading(false);
        }

        setCartTransform(response.cart_transform);
    }

    useEffect(() => {
        loadByobBundlesOption();
    }, []);

    async function deactivate() {
        setActionLoading(true);

        const token = await getSessionToken(app);

        let response = null;

        try {
            response = await fetch('/api/cart-transform/deactivate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    id: cartTransform.id
                })
            });

            response = await response.json();

        } catch(err) {
            displayToast("Unable to deactivate byob bundle function. Please try again later", true);
            return;
        } finally {
            setActionLoading(false);
        }

        if (response.server_error) {
            displayToast(response.server_error, true);
            return;
        }

        setCartTransform(response.cart_transform);
    }

    async function activate() {
        setActionLoading(true);

        const token = await getSessionToken(app);

        let response = null;

        try {
            response = await fetch(`/api/cart-transform/${functionName}/activate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json'
                }
            });

            response = await response.json();

        } catch(err) {
            displayToast("Unable to activate byob bundle function. Please try again later", true);
            return;
        } finally {
            setActionLoading(false);
        }

        if (response.server_error) {
            displayToast(response.server_error, true);
            return;
        }

        setCartTransform(response.cart_transform);
    }

    function renderByobOptionConfig() {

        if (loading) return null;

        if (error) {
            return (
                <Banner status="critical">
                    <p>
                        {error}
                    </p>
                    <Button plain
                            onClick={loadByobBundlesOption}>Try again</Button>
                </Banner>
            )
        }

        if (!cartTransform) {
            return (
                <VerticalStack gap="4">
                    <Banner
                        title={`${functionTitle} function is not active`}
                        status="warning">
                        <p>{inactiveMessage}</p>
                    </Banner>
                    <Box>
                        <Button primary
                                loading={actionLoading}
                                onClick={activate}>Activate</Button>
                    </Box>
                </VerticalStack>
            )
        }

        return (
            <VerticalStack gap="4">
                <Banner
                    title={`${functionTitle} function is active`}
                    status="success">
                    <p>{activeMessage}</p>
                </Banner>
                <Box>
                    <Button destructive
                            plain
                            loading={actionLoading}
                            onClick={deactivate}>Deactivate</Button>
                </Box>
            </VerticalStack>
        )
    }

    return (
        <>
            <Layout.Section oneThird>
                <Box paddingBlockStart={4}>
                    <VerticalStack gap="4">
                        <Text id="CarrierServices" variant="headingMd">{heading}</Text>
                        <Text color="subdued" as="p">
                            {info}
                        </Text>
                    </VerticalStack>
                </Box>

            </Layout.Section>
            <Layout.Section>
                <AlphaCard>
                    {
                        loading && (
                            <div className="card-loader-wrapper">
                                <Spinner />
                            </div>
                        )
                    }
                    {
                        renderByobOptionConfig()
                    }
                </AlphaCard>
            </Layout.Section>
        </>
    )

}
