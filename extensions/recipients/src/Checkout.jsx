import {
  reactExtension,
  Banner,
  BlockStack,
  Checkbox,
  Text,
  useApi,
  useShippingAddress,
  useApplyShippingAddressChange,
  useApplyAttributeChange,
  useInstructions,
  useBuyerJourneyIntercept,
  useNote,
  Heading,
  SkeletonTextBlock,
  Divider,
  Link,
  InlineLayout,
  useAppMetafields
} from "@shopify/ui-extensions-react/checkout";

import { useEffect, useState } from "react";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

const nth = (d) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
};

function parseDelayDate(dateStr) {
    const date = new Date(dateStr);

    if (isNaN(date)) return null;

    const day = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ][date.getDay()];

    const dayOfMonth = date.getDate() + nth(date.getDate());

    const month = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ][date.getMonth()];

    const year = date.getFullYear();

    return `${day} ${dayOfMonth} ${month} ${year}`;
};

function Extension() {

    const {
        extension,
        attributes,
        lines,
        shop
    } = useApi();

    const appMetafields = useAppMetafields();

    const [shipments, setShipments] = useState(null);
    const [someItemsHaveNoShippingAddress, setSomeItemsHaveNoShippingAddress] = useState(true);
    const note = useNote();

    useBuyerJourneyIntercept(
        ({canBlockProgress}) => {

            if (note.includes("DO_NOT_VALIDATE")) {
                return {
                    behavior: 'allow'
                };
            }

            if (canBlockProgress && someItemsHaveNoShippingAddress && initialised) {
                return {
                    behavior: 'block',
                    reason: "Unconfigured shipping",
                    errors: [
                        {
                          message:
                            'Some or all items do not have shipping addresses assigned to them',
                        }
                    ]
                }
            }

            for (const shipment of shipments) {
                if(!shipment.rateId) return {
                    behavior: 'block',
                    reason: "Unconfigured shipping rates",
                    errors: [
                        {
                          message:
                            'Some of your shipping addresses do not have a selected shipping method',
                        }
                    ]
                }
            }

            return {
                behavior: 'allow'
            };
        },
      );

    useEffect(() => {

        let addressesAttr = attributes.current.find(attr => attr.key == 'addresses');

        if (!addressesAttr) {
            setShipments([]);
            return;
        }

        let addresses = JSON.parse(addressesAttr.value);

        let shipmentsIdMap = {};

        let itemsWithoutAddresses = [];

        for (const lineItem of lines.current) {
            const parentIdAttr = lineItem.attributes.find(attr => attr.key == '_box_id' || attr.key == '_parent_item_id');

            if (parentIdAttr) continue;

            const adressIdAttr = lineItem.attributes.find(attr => attr.key == '_address_id');

            if (!addressesAttr) {
                itemsWithoutAddresses.push(lineItem);
                continue;
            }

            let shipmentId = adressIdAttr.value;

            const delayAttr = lineItem.attributes.find(attr => attr.key == 'Delay');

            if (delayAttr && delayAttr.value && delayAttr.value !== 'null') {
                shipmentId += `_${delayAttr.value}`;
            }

            const address = addresses.find(addr => addr.id == adressIdAttr.value);

            if (!address) {
                itemsWithoutAddresses.push(lineItem);
                continue;
            }

            if (!shipmentsIdMap[shipmentId]) {
                shipmentsIdMap[shipmentId] = {
                    id: shipmentId,
                    address: address,
                    delay: delayAttr && delayAttr.value && delayAttr.value !== 'null' ? delayAttr.value : null,
                    rateId: null,
                    itemCount: 1
                };
            } else {
                shipmentsIdMap[shipmentId].itemCount += lineItem.quantity;
            }
        }

        setSomeItemsHaveNoShippingAddress(itemsWithoutAddresses.length > 0);

        const shipmentIds = Object.keys(shipmentsIdMap);

        if (shipmentIds.length < 1) {
            setShipments([]);
            return;
        }

        const appHostMetafield = appMetafields.find(metafield => metafield.metafield.key == 'app_host');

        if (!appHostMetafield) return;

        fetch(`https://${appHostMetafield.metafield.value}/public/api/shipments/lookup?shipment_ids=${shipmentIds.join(',')}&shop=${shop.myshopifyDomain}&with=rate`)
        .then(response => response.json())
        .then(response => {
            for (const shipmentRate of response.shipments) {
                if (!shipmentsIdMap[shipmentRate.shipment_id]) continue;
                shipmentsIdMap[shipmentRate.shipment_id].rateId = shipmentRate.shipping_rate_id;
            }

            setShipments(Object.values(shipmentsIdMap));
        });


    }, [lines, attributes, shop, appMetafields]);

    if (note.includes("DO_NOT_VALIDATE")) {
        return null;
    }

    if (Array.isArray(shipments) && shipments.length < 1) {
        return (
            <Banner status="warning"
                title="You have not configured your recipients">
                <Text>
                    Click <Link to="/pages/recipients" external={true}>here</Link> to add recipients.
                </Text>
            </Banner>
        )
    }

    // 3. Render a UI
    return (
        <BlockStack>
            <Heading level={1}>Shipping Addresses</Heading>
            {
                !shipments ? (
                    <SkeletonTextBlock lines={3} />
                ) : (
                    <BlockStack
                        borderWidth="base"
                        border="base"
                        cornerRadius="base">
                        {
                            shipments.map(shipment => (
                                <BlockStack key={shipment.id}>
                                    <BlockStack padding="base">
                                    <Text emphasis="bold">{shipment.address.displayName}</Text>
                                    <InlineLayout>
                                        {
                                            shipment.delay && (
                                                <Text>Delay: { parseDelayDate(shipment.delay) }</Text>
                                            )
                                        }
                                        <Text>{shipment.itemCount} item{ shipment.itemCount > 1 ? 's' : '' }</Text>
                                    </InlineLayout>
                                    </BlockStack>
                                    <Divider />
                                </BlockStack>
                            ))
                        }
                    </BlockStack>
                )
            }
            <Text>
                Click <Link to="/pages/recipients" external={true}>here</Link> to update your shipping addresses.
            </Text>
        </BlockStack>
    );

}
