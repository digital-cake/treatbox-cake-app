import { useEffect, useState } from "react";

import {
    Page,
    Layout,
    TextField,
    LegacyCard,
    Tabs,
    Select,
    VerticalStack,
    Text,
    HorizontalGrid,
    FormLayout,
    Divider,
    Tooltip,
    Label,
    Icon,
    Button,
    AlphaCard,
    ResourceList, 
    ResourceItem,
    Spinner,
    HorizontalStack
} from "@shopify/polaris";

import {
    PackageMajor
} from '@shopify/polaris-icons';

import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";
import TimeSelect from "../../components/TimeSelect";
import DaySelect from "../../components/DaySelect";
import ProductLeadTimeTagOverrideModal from "../../components/modals/ProductLeadTimeTagOverrideModal";

//import moment from 'moment';

const dayOfWeekTabs = [
    {
        id: 'monday',
        content: 'Monday',
    },
    {
        id: 'tuesday',
        content: 'Tuesday',
    },
    {
        id: 'wednesday',
        content: 'Wednesday',
    },
    {
        id: 'thursday',
        content: 'Thursday',
    },
    {
        id: 'friday',
        content: 'Friday'
    },
    {
        id: 'saturday',
        content: 'Saturday'
    },
    {
        id: 'sunday',
        content: 'Sunday'
    }
];

export default function ProductLeadTimes() {
    const [tabIndex, setTabIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const app = useAppBridge();
    const [toasts, setToasts] = useState([]);

    const [leadTimeOverrides, setLeadTimeOverrides] = useState([]);

    const [leadTimes, setLeadTimes] = useState([
        {
            'day_index': 0,
            'lead_time': 1,
            'cut_off_time': '15:00',
            'post_cut_off_lead_time': 1,
        },
        {
            'day_index': 1,
            'lead_time': 1,
            'cut_off_time': '15:00',
            'post_cut_off_lead_time': 1,
        },
        {
            'day_index': 2,
            'lead_time': 1,
            'cut_off_time': '15:00',
            'post_cut_off_lead_time': 1,
        },
        {
            'day_index': 3,
            'lead_time': 1,
            'cut_off_time': '15:00',
            'post_cut_off_lead_time': 1,
        },
        {
            'day_index': 4,
            'lead_time': 1,
            'cut_off_time': '15:00',
            'post_cut_off_lead_time': 1,
        },
        {
            'day_index': 5,
            'lead_time': 1,
            'cut_off_time': '12:00',
            'post_cut_off_lead_time': 3,
        },
        {
            'day_index': 6,
            'lead_time': 1,
            'cut_off_time': '12:00',
            'post_cut_off_lead_time': 2,
        }
    ]);

    useEffect(() => {

        (async () => {

            const token = await getSessionToken(app);

            //Default list
            let productLeadTimeResponse = null;

            try {
                productLeadTimeResponse = await fetch(`/api/product-lead-times/list`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-type': 'application/json'
                    }
                });

                productLeadTimeResponse = await productLeadTimeResponse.json();

                if (productLeadTimeResponse.server_error) {
                    //displayToast(response.server_error, true);
                    return;
                }

                let incomingLeadTimes = [ ...leadTimes ];

                for (let i = 0; i < 7; i++) {
                    if (!productLeadTimeResponse.default_product_lead_times[i]) continue;
                    
                    incomingLeadTimes[i] = productLeadTimeResponse.default_product_lead_times[i];
                }

                setLeadTimes(incomingLeadTimes);

            } catch(err) {
                //displayToast("Server error", true);
                console.log(err);
            } finally {
                setLoading(false);
            }

            //Overrides list
            let productLeadTimeOverridesResponse = null;

            try {
                productLeadTimeOverridesResponse = await fetch(`/api/product-lead-times-overrides/list`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-type': 'application/json'
                    }
                });

                productLeadTimeOverridesResponse = await productLeadTimeOverridesResponse.json();

                console.log('productLeadTimeOverridesResponse', productLeadTimeOverridesResponse);

                if (productLeadTimeOverridesResponse.server_error) {
                    //displayToast(response.server_error, true);
                    return;
                }

                if (productLeadTimeOverridesResponse) {
                    setLeadTimeOverrides(productLeadTimeOverridesResponse.product_lead_time_overrides);
                }

            } catch(err) {
                //displayToast("Server error", true);
                console.log(err);
            } finally {
                setLoading(false);
            }

        })();

    }, []);

    function setLeadTimeProp(index, key, value) {
        const newLeadTimes = [ ...leadTimes ];
        newLeadTimes[index][key] = value;
        setLeadTimes(newLeadTimes);

        console.log(leadTimes);
    }

    function displayToast(content, error) {
        setToasts(toasts => [ ...toasts, { content, error } ]);
    }

    const saveLeadTimes = async () => {    
        setSaving(true);

        const token = await getSessionToken(app);

        let response = null;

        try {
            response = await fetch(`/api/product-lead-times/store`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ lead_times: leadTimes })
            });

            response = await response.json();

            console.log('saved lead times response', response);

        } catch(err) {
            //displayToast("Server error", true);
            console.log(err);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Page 
            primaryAction={{
                content: 'Save',
                loading: saving,
                onAction: saveLeadTimes
            }}
        >
           <LegacyCard>
                <Tabs tabs={dayOfWeekTabs}
                selected={tabIndex}
                onSelect={setTabIndex}
                padding="0"
                fitted>

                    <LegacyCard.Section>
                        <FormLayout gap="5" inlineAlign="start">
                            <Text variant="headingMd">{dayOfWeekTabs[tabIndex].content} product lead time</Text>
                                <DaySelect 
                                    label="Lead time"
                                    value={leadTimes[tabIndex].lead_time.toString()}
                                    onChange={(value) => setLeadTimeProp(tabIndex, 'lead_time', value)} 
                                />

                                <TimeSelect 
                                    intervalMins={30} 
                                    label="Cut-off time"
                                    value={leadTimes[tabIndex].cut_off_time}
                                    onChange={(value) => setLeadTimeProp(tabIndex, 'cut_off_time', value)} 
                                />

                                <DaySelect 
                                    label="Post cut-off lead time"
                                    value={leadTimes[tabIndex].post_cut_off_lead_time.toString()}
                                    onChange={(value) => setLeadTimeProp(tabIndex, 'post_cut_off_lead_time', value)} 
                                />   
                        </FormLayout>
                    </LegacyCard.Section>

                </Tabs>
            </LegacyCard>

            <LegacyCard>
                <LegacyCard.Section> 
                    <FormLayout gap="5" inlineAlign="start">
                        <Text variant="headingMd">Product tag lead time overrides</Text>
                        <Text variant="bodyMd">Copy generated tag and add to products you wish to use the lead time on</Text>

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
                                                resourceName={{singular: 'Lead time override', plural: 'lead time overrides'}}
                                                items={leadTimeOverrides}
                                                renderItem={(item) => (
                                                    <ResourceItem id={item.id}
                                                        url={`/product-lead-times/${item.id}`}
                                                        accessibilityLabel={`Edit ${item.title}`}
                                                        media={<Icon
                                                            source={PackageMajor}
                                                            tone="base"
                                                        />}
                                                    >
                                                        <VerticalStack gap="1">
                                                            <Text variant="bodyMd"
                                                                fontWeight="bold"
                                                                as="h3">
                                                                {item.title}
                                                            </Text>
                                                            <HorizontalStack align="space-between" gap="3">
                                                            <Text variant="bodyMd">
                                                                Tag: {item.tag}
                                                            </Text>
                                                            </HorizontalStack>

                                                        </VerticalStack>

                                                    </ResourceItem>
                                                )}
                                            />
                                        </AlphaCard>
                                    )
                                }
                            </Layout.Section>
                        </Layout>

                        <Button url="/product-lead-times/new">Add override</Button>
                    </FormLayout>
                </LegacyCard.Section>
            </LegacyCard>
        </Page>
    )
}
