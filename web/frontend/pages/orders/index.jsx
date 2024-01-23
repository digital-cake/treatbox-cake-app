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
    Tabs
} from "@shopify/polaris";

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

        if (!hasNextPage) return;

        setOrdersLoading(true);

        getOrders(page)
        .then((response) => {
            setOrders(response.orders);
            setOrdersLoading(false);
            setHasNextPage(response.has_next_page);
        });

    }, [page, hasNextPage]);

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
                                {title: 'Order Date'},
                                {title: 'Recipient'},
                                {title: 'Items'},
                                {title: 'Status'}
                            ]}
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
                                            {moment(new Date(order.created_at)).format('ddd Do MMM YYYY')}
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
            </Layout>
        </Page>
    );
  }
