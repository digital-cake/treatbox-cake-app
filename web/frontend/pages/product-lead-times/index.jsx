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
    Button
} from "@shopify/polaris";

import {
    QuestionMarkMajor
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

    const [defaultCutOff, setDefaultCutOff] = useState('15:00');
    const [defaultLeadTime, setDefaultLeadTime] = useState('1');
    const [defaultPostCutoffLeadTime, setDefaultPostCutoffLeadTime] = useState('1');

    const [showProductTagOverrideModal, setShowProductTagOverrideModal] = useState(false);

    function displayProductTagModal() {
        setShowProductTagOverrideModal(!showProductTagOverrideModal);
        console.log(showProductTagOverrideModal);
    }

    return (
        <Page primaryAction={{ content: 'Save' }}>
           <LegacyCard>
                <Tabs tabs={dayOfWeekTabs}
                selected={tabIndex}
                onSelect={setTabIndex}
                padding="0"
                fitted>

                    <LegacyCard.Section>
                        <FormLayout gap="5" inlineAlign="start">
                            <Text variant="headingMd">{dayOfWeekTabs[tabIndex].content} product lead times</Text>
                                <DaySelect 
                                    label="Lead time"
                                    value={defaultLeadTime}
                                    onChange={(value) => setDefaultLeadTime(value)} 
                                />

                                <TimeSelect 
                                    intervalMins={30} 
                                    label="Cut-off time"
                                    value={defaultCutOff}
                                    onChange={(value) => setDefaultCutOff(value)} 
                                />

                                <DaySelect 
                                    label="Post cut-off lead time"
                                    value={defaultPostCutoffLeadTime}
                                    onChange={(value) => setDefaultPostCutoffLeadTime(value)} 
                                />          
                        </FormLayout>
                    </LegacyCard.Section>

                </Tabs>
            </LegacyCard>

            <LegacyCard>
                <LegacyCard.Section> 
                    <FormLayout gap="5" inlineAlign="start">
                        <Text variant="headingMd">Product tag lead time overrides</Text>

                        { /* RESOURCE LIST HERE OF OVERRIDES */}

                        <Button onClick={displayProductTagModal} variant="primary">Add Override</Button>     
                    </FormLayout>
                </LegacyCard.Section>
            </LegacyCard>

            { showProductTagOverrideModal && 
                <ProductLeadTimeTagOverrideModal
                    setShowProductTagOverrideModal={setShowProductTagOverrideModal} />
            }
        </Page>
    )
}
