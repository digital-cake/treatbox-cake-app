import {
    Page,
    Layout,
    Link,
    IndexTable,
    Text,
    Card,
    Tag,
    VerticalStack,
    useIndexResourceState,
    useSetIndexFiltersMode,
    IndexFiltersMode,
    IndexFilters,
    DatePicker,
    Tooltip,
    Tabs,
    ButtonGroup,
    Button,
    Box,
    Spinner,
    Icon,
} from "@shopify/polaris";

import {
    ChevronRightMinor,
    ChevronLeftMinor,
    RefreshMajor
} from '@shopify/polaris-icons';

import { useEffect, useState, useCallback } from "react";

import { useAppBridge, useNavigate } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";

import moment from 'moment';

const deliveryTypeDisplayNameMap = {
    'local': 'London',
    'nationwide': 'Nationwide',
    'pickup': 'Collection'
};


export default function Orders() {

    const app = useAppBridge();

    const [hasNextPage, setHasNextPage] = useState(true);
    const [page, setPage] = useState(1);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(new Date().getTime());

    const navigate = useNavigate();

    async function getOrders(page) {

        const token = await getSessionToken(app);

        let response = null;

        try {
            response = await fetch(`/api/orders?page=${page}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            response = await response.json();
        } catch(err) {
            console.log(err);
            return [];
        }

        return response;

    };

    useEffect(() => {

        setOrdersLoading(true);

        getOrders(page)
        .then((response) => {
            setOrders(response.orders);
            setHasNextPage(response.has_next_page);
            setOrdersLoading(false);
        });

    }, [page, refreshKey]);

    const renderStatus = (order) => {
        if (!order.tracking_number) {
            return 'Awaiting tracking number';
        } else if (!order.shipped_on) {
            return 'Awaiting dispatch';
        } else if (!order.fulfilled) {
            return 'Fulfillment in progress';
        }
        return 'Fulfilled';
    };

    return (
        <Page
            title="Orders"
            secondaryActions={[
                {
                    content: (<Icon source={RefreshMajor} />),
                    onAction: () => {
                        setOrders([]);
                        setPage(1);
                        setRefreshKey(new Date().getTime())
                    }
                }
            ]}
            backAction={{
                content: "Home",
                url: "/"
            }}>
            <Layout>
                <Layout.Section>
                    <Card padding={0}>
                        <IndexTable
                            resourceName={{ singular: 'Order', plural: 'Orders' }}
                            itemCount={orders.length}
                            loading={ordersLoading}
                            selectable={false}
                            headings={[
                                {title: 'Order'},
                                {title: 'Channel Ref'},
                                {title: 'Click & Drop ID'},
                                {title: 'Order Date/Time'},
                                {title: 'Recipient'},
                                {title: 'Items'},
                                {title: 'Status'}
                            ]}
                            hasZebraStriping
                            >
                            {
                                orders.map((order, index) => (
                                    <IndexTable.Row
                                        key={order.id}
                                        id={order.id}
                                        position={index}
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                        >
                                        <IndexTable.Cell>
                                            <Text variant="bodyMd" fontWeight="bold" as="span">
                                                {order.name}
                                            </Text>
                                        </IndexTable.Cell>

                                        <IndexTable.Cell>
                                            {order.channel_reference}
                                        </IndexTable.Cell>

                                        <IndexTable.Cell>
                                            {order.click_and_drop_id}
                                        </IndexTable.Cell>

                                        <IndexTable.Cell>
                                            {moment(new Date(order.created_at)).format('ddd Do MMM YYYY HH:mm')}
                                        </IndexTable.Cell>

                                        <IndexTable.Cell>
                                            {order.recipient_name}
                                        </IndexTable.Cell>

                                        <IndexTable.Cell>{order.item_count}</IndexTable.Cell>


                                        <IndexTable.Cell>
                                            <Tag>
                                                {renderStatus(order)}
                                            </Tag>
                                        </IndexTable.Cell>
                                    </IndexTable.Row>
                                ))
                            }
                        </IndexTable>
                    </Card>
                </Layout.Section>
                <Layout.Section>
                    <VerticalStack inlineAlign="end">
                        <ButtonGroup>
                            {
                                ordersLoading && (
                                    <Spinner size="small" />
                                )
                            }

                            <Button icon={ChevronLeftMinor}
                                    disabled={page < 2}
                                    onClick={() => setPage(page - 1)} />
                            <Button icon={ChevronRightMinor}
                                    disabled={!hasNextPage}
                                    onClick={() => setPage(page + 1)} />
                        </ButtonGroup>
                    </VerticalStack>
                </Layout.Section>
                <Layout.Section>
                    <p>&nbsp;</p>
                </Layout.Section>
            </Layout>
        </Page>
    );
  }
