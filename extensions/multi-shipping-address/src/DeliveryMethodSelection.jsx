import { useEffect, useState } from "react";
import {
    BlockSpacer,
    BlockStack,
    Divider,
    Heading,
    Spinner,
    Text,
    Pressable,
    InlineLayout,
    View,
    Choice
} from "@shopify/ui-extensions-react/checkout";

import { ChoiceList } from "@shopify/ui-extensions/checkout";

export default function DeliveryMethodSelection({ countryCode, shop, onChange, selected }) {

    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        setLoading(true);

        fetch(`https://3816-88-98-16-1.ngrok-free.app/public/api/shipping-rates?country=${countryCode}&shop=${shop}`)
        .then(response => response.json())
        .then(response => {
            setRates(response.rates);
            setLoading(false);
        })
        .catch(err => {
            console.log(err);
            setLoading(false);
        });

    }, [countryCode, shop]);

    const onRateChange = (rateId) => {
        onChange(rateId, rates.find(rate => rate.id == rateId).name);
    };

    return (
        <BlockStack spacing="base">
            <BlockSpacer />
            <Heading level="2">
                Shipping method
            </Heading>

            {
                loading && (
                    <Spinner />
                )
            }

            {
                !loading && rates.length < 1 && (
                    <Text>No shipping rates available</Text>
                )
            }

            {
                !loading && rates.length > 0 && (
                    <ChoiceList name="shipping_method"
                    value={selected}
                    onChange={onRateChange}>
                        <BlockStack spacing="none"
                            cornerRadius="base"
                            border="base">
                            {
                                rates.map((rate, index) => (
                                    <Pressable key={`rate-${rate.id}`}
                                                onPress={() => onRateChange(rate.id.toString())}>
                                        <InlineLayout spacing="base"
                                                    blockAlignment="center"
                                                    columns={['auto', 'fill', 'auto']}
                                                    padding="base">

                                            <Choice id={rate.id.toString()}></Choice>

                                            <BlockStack spacing="extraTight">
                                                <Text>{rate.name}</Text>
                                                <Text appearance="subdued">{rate.description}</Text>
                                            </BlockStack>


                                            <View>
                                                {
                                                    rate.base_rate == 0 ? (
                                                        <Text>Free</Text>
                                                    ) : (
                                                        <Text>£{rate.base_rate}</Text>
                                                    )
                                                }
                                            </View>

                                        </InlineLayout>
                                        {
                                            index + 1 < rates.length && (
                                                <Divider />
                                            )
                                        }
                                    </Pressable>
                                ))
                            }
                        </BlockStack>
                    </ChoiceList>
                )
            }

        </BlockStack>
    )

}
