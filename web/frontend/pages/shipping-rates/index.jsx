

import { useEffect, useState } from "react";

import {
    Frame,
    Page,
    Layout,
    Text,
    AlphaCard,
    Toast,
    Spinner,
    ResourceList,
    ResourceItem,
    Icon,
    HorizontalStack,
    VerticalStack
} from "@shopify/polaris";

import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";

import {
    PackageMajor
} from '@shopify/polaris-icons';

export default function ShippingRates() {

    const app = useAppBridge();

    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const [shippingRates, setShippingRates] = useState([]);

    function displayToast(content, error) {
        setToasts(toasts => [ ...toasts, { content, error } ]);
    }

    function dismissToast(toastIndex) {
        setToasts(toasts => toasts.filter((item, index) => index != toastIndex));
    }

    useEffect(() => {

        (async () => {

            const token = await getSessionToken(app);

            let response = null;

            try {
                response = await fetch(`/api/shipping-rates`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                response = await response.json();

                if (response.server_error) {
                    displayToast(response.server_error, true);
                    return;
                }

                setShippingRates(response.shipping_rates);

            } catch(err) {
                displayToast("Server error", true);
                console.log(err);
            } finally {
                setLoading(false);
            }


        })();

    }, []);

    return (
        <Frame>
            <Page
                primaryAction={{
                    content: 'Add Rate',
                    url: "/shipping-rates/new"
                }}
                backAction={{
                    content: "Home",
                    url: "/"
                }}
                title="Shipping Rates"
                narrowWidth>
                <Layout>
                    <Layout.Section>
                        {
                            loading ? (
                                <AlphaCard>
                                    <div className="card-loader-wrapper">
                                        <Spinner />
                                    </div>
                                </AlphaCard>
                            ) : (
                                <AlphaCard padding={0}>
                                    <ResourceList
                                        resourceName={{singular: 'shipping rate', plural: 'shipping rates'}}
                                        items={shippingRates}
                                        renderItem={(item) => (
                                            <ResourceItem id={item.id}
                                                url={`/shipping-rates/${item.id}`}
                                                accessibilityLabel={`Edit ${item.name}`}
                                                media={<Icon
                                                    source={PackageMajor}
                                                    tone="base"
                                                />}
                                            >

                                                <VerticalStack gap="1">
                                                    <Text variant="bodyMd"
                                                        fontWeight="bold"
                                                        as="h3">
                                                        {item.name}
                                                    </Text>
                                                    {
                                                        item.base_rate > 0 ? (
                                                            <div>£{item.base_rate}</div>
                                                        ) : (
                                                            <div>Free</div>
                                                        )
                                                    }
                                                </VerticalStack>

                                            </ResourceItem>
                                        )}
                                    />
                                </AlphaCard>
                            )
                        }
                    </Layout.Section>
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
