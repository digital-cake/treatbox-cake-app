import { useEffect, useState, useMemo, useCallback } from "react";
import { useAppBridge, useNavigate } from "@shopify/app-bridge-react";
import { useParams } from "react-router-dom";
import { getSessionToken } from "@shopify/app-bridge/utilities";

import {
    Frame,
    Page,
    Toast,
    SkeletonPage,
    LegacyCard,
    Tabs,
    FormLayout, 
    Text,
    TextField,
    SkeletonDisplayText,
    SkeletonTabs
} from "@shopify/polaris";

import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import TimeSelect from "../../components/TimeSelect";
import DaySelect from "../../components/DaySelect";

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

export default function ProductLeadTime() {

    const routeParams = useParams();
    const navigate = useNavigate();
    const app = useAppBridge();

    const [id, setId] = useState(routeParams.id);
    const [tabIndex, setTabIndex] = useState(0);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [displayDeleteConfirmation, setDisplayDeleteConfirmation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [toasts, setToasts] = useState([]);

    function displayToast(content, error) {
        setToasts(toasts => [ ...toasts, { content, error } ]);
    }

    function dismissToast(toastIndex) {
        setToasts(toasts => toasts.filter((item, index) => index != toastIndex));
    }

    const [override, setOverride] = useState({
        title: "",
        tag: "",
        lead_times: [
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
        ]
    });

    useEffect(() => {

        if (id === 'new') return;

        setLoading(true);

        (async () => {

            const token = await getSessionToken(app);

            let response = null;

            //get selected tag data
            try {
                response = await fetch(`/api/product-lead-times-overrides/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                response = await response.json();

                if (response.server_error) {
                    displayToast(response.server_error, true);
                    navigate("/product-lead-times");
                    return;
                }

                console.log('specific tag response', response.override);

                //setOverride(response.override);

            } catch(err) {
                displayToast("Server error", true);
                console.log(err);
            } finally {
                setLoading(false);
            }


        })();

    }, [id]);

    useEffect(() => {

        setFieldErrors({});

    }, []);

    async function onSaveAction() {

        setSaving(true);

        setFieldErrors({});

        const token = await getSessionToken(app);

        let response = null;

        try {
            response = await fetch(`/api/product-lead-times-overrides/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ overrides: override })
            });

            response = await response.json();

            if (response.field_errors) {
                setFieldErrors(response.field_errors);
                return;
            }

            if (response.server_error) {
                displayToast(response.server_error, true);
                return;
            }

            setOverride(response.product_lead_times_override);

            if (id == 'new') {
                navigate(`/product-lead-times/${response.product_lead_times_override.id}`, { replace: true });
                setId(response.product_lead_times_override.id);
                displayToast(`Product lead time overrides created successfully`);
            } else {
                displayToast(`Product lead time overrides updated successfully`);
            }

        } catch(err) {
            displayToast(`Server Error: ${err.message}`, true);
            console.log(err);
        } finally {
            setSaving(false);
        }
    }

    async function onDeleteAction() {
        setDeleting(true);

        const token = await getSessionToken(app);

        let response = null;

        try {
            response = await fetch(`/api/product-lead-times/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
        } catch(err) {
            displayToast("Server error", true);
            console.log(err);
        } finally {
            setDeleting(false);
            navigate("/product-lead-times");
        }
    }
    
    function setOverrideLeadTimeProp(index, key, value) {
        let newOverride = { ...override };
        newOverride.lead_times[index][key] = value;
        setOverride(newOverride);
        console.log(newOverride);
    }

    function setOverrideProp(key, value) {
        let newOverride = { ...override };
        newOverride[key] = value;
        setOverride(newOverride);
        console.log(newOverride);
    }

    if (loading) {
        return (
            <SkeletonPage 
                primaryAction
                backAction
                narrowWidth>
                    <LegacyCard>
                        <SkeletonTabs>

                            <LegacyCard.Section>
                                <SkeletonDisplayText/>
                            </LegacyCard.Section>

                            <LegacyCard.Section>
                                <FormLayout>
                                    <SkeletonDisplayText/>
                                        <SkeletonTabs/>

                                        <SkeletonTabs/>

                                        <SkeletonTabs/>   
                                </FormLayout>
                            </LegacyCard.Section>

                        </SkeletonTabs>
                    </LegacyCard>
            </SkeletonPage>
        )
    }

    return (
        <Frame>
            <Page
                primaryAction={{
                    content: 'Save',
                    loading: saving,
                    onAction: onSaveAction
                }}
                backAction={{
                    content: "Product Lead Times",
                    url: "/product-lead-times"
                }}
                title={typeof override.title == 'string' && override.title.length > 0 ? override.title : "Product Lead Time Overrides"}
                >
                
                <LegacyCard>
                    <Tabs tabs={dayOfWeekTabs}
                    selected={tabIndex}
                    onSelect={setTabIndex}
                    padding="0"
                    fitted>

                        <LegacyCard.Section> 
                            <TextField label="Title" autoComplete="off" value={override.title} onChange={(value) => setOverrideProp('title', value)} />
                        </LegacyCard.Section>

                        <LegacyCard.Section> 
                            <TextField label="Product Tag" autoComplete="off" value={override.tag} onChange={(value) => setOverrideProp('tag', value)} />
                        </LegacyCard.Section>

                        <LegacyCard.Section>
                            <FormLayout gap="5" inlineAlign="start">
                                <Text variant="headingMd">{dayOfWeekTabs[tabIndex].content} Override</Text>

                                    <DaySelect 
                                        label="Lead time"
                                        value={override.lead_times[tabIndex].lead_time}
                                        onChange={(value) => setOverrideLeadTimeProp(tabIndex, 'lead_time', value)} 
                                    />

                                    <TimeSelect 
                                        intervalMins={30} 
                                        label="Cut-off time"
                                        value={override.lead_times[tabIndex].cut_off_time}
                                        onChange={(value) => setOverrideLeadTimeProp(tabIndex, 'cut_off_time', value)} 
                                    />

                                    <DaySelect 
                                        label="Post cut-off lead time"
                                        value={override.lead_times[tabIndex].post_cut_off_lead_time.toString()}
                                        onChange={(value) => setOverrideLeadTimeProp(tabIndex, 'post_cut_off_lead_time', value)} 
                                    />   
                            </FormLayout>
                        </LegacyCard.Section>
                    </Tabs>
                </LegacyCard>

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
