
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


export default function Orders() {
    return (
        <Frame>
            <Page title="Orders"
                  backAction={{
                        content: "Home",
                        url: "/"
                    }}>
                <Layout>
                    <Layout.Section>
                        <AlphaCard>
                            <div className="card-loader-wrapper">
                                <Spinner />

                            </div>

                            <p style={{ textAlign: 'center' }}>Loading Orders...</p>
                        </AlphaCard>
                    </Layout.Section>
                </Layout>

            </Page>
        </Frame>
    )
}
