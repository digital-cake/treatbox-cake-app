import {
    AlphaCard,
    Page,
    Layout,
    Text,
    Link,
    VerticalStack,
    Icon,
    ResourceList,
    ResourceItem,
    TextField,
    Spinner
} from "@shopify/polaris";

import {
    ShipmentMajor,
    OrdersMajor,
    ToolsMajor
} from '@shopify/polaris-icons';

import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";

import { useEffect, useState } from "react";

export default function HomePage() {

    const app = useAppBridge();

    const resourceListItems = [
        {
            id: 'orders',
            url: '/orders',
            name: "Orders",
            description: 'View orders and their Click & Drop sync status',
            icon: (
                <Icon source={OrdersMajor}
                    tone="base"
                />
            )
        },
        {
            id: 'shipping_rates',
            url: '/shipping-rates',
            name: "Shipping Rates",
            description: 'Configure custom shipping rates displayed in your checkout',
            icon: (
                <Icon source={ShipmentMajor}
                    tone="base"
                />
            )
        },
        {
            id: 'settings',
            url: '/settings',
            name: "Settings",
            description: 'Configure services and API access',
            icon: (
                <Icon source={ToolsMajor}
                    tone="base"
                />
            )
        }
    ];

    const renderMenuItem = (item) => {
        const {id, url, name, description, icon} = item;

        return (
          <ResourceItem
            id={id}
            url={url}
            media={icon}
          >
            <Text variant="bodyMd" fontWeight="bold" as="h3">
              {name}
            </Text>
            <div>{description}</div>
          </ResourceItem>
        );
    };

    return (
      <Page narrowWidth>
        <Layout>
          <Layout.Section>
            <VerticalStack gap="5">
                    <Text variant="headingMd" as="h3">
                        Treatbox Custom App
                    </Text>
                    <AlphaCard padding={0}>
                        <ResourceList
                            resourceName={{ singular: 'menu item', plural: 'menu items' }}
                            items={resourceListItems}
                            renderItem={renderMenuItem}
                        />
                    </AlphaCard>
                </VerticalStack>
          </Layout.Section>
          <Layout.Section>
              <VerticalStack inlineAlign="center"  gap="5">
                  <Text variant="bodyMd">
                      Need help? Contact us at <Link url="mailto:dev@cake.agency">dev@cake.agency</Link>
                  </Text>
                  <Link url="https://www.cake.agency/" external>
                      <img src="https://uploads-ssl.webflow.com/626153d62a08cb002a8ce41c/6398acd961aa3e264a4c30c0_Cake%20Full%20Logo%20Black-p-500.png" style={{ maxWidth: 80 }} />
                  </Link>
              </VerticalStack>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
