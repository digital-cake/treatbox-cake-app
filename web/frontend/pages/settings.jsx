import { useEffect, useState } from "react";

import {
    AlphaCard,
    Frame,
    Layout,
    Page,
    Toast,
    Box,
    VerticalStack,
    Text,
    Spinner,
    Divider,
    TextField,
    Button,
    HorizontalStack
} from "@shopify/polaris";

import { getSessionToken } from "@shopify/app-bridge/utilities";
import { useAppBridge } from "@shopify/app-bridge-react";

import CarrierServiceOptionLayoutSection from "../components/CarrierServiceOptionLayoutSection";

export default function SettingsPage() {

    const app = useAppBridge();

    const [toasts, setToasts] = useState([]);

    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingOptions, setSettingOptions] = useState(null);
    const [saving, setSaving] = useState(false);

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
                response = await fetch('/api/settings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                response = await response.json();

                setSettingOptions(response.options);
            } catch(err) {
                displayToast("Failed to fetch settings: " + err.message, true);
                return;
            } finally {
                setSettingsLoading(false);
            }

        })();

    }, []);

    async function onSaveSettings() {

        setSaving(true);

        const token = await getSessionToken(app);

        let response = null;

        try {
            response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    options: settingOptions
                })
            });

            response = await response.json();

            if (response.field_errors) {
                for (let field in response.field_errors) {
                    for (let i = 0; i < response.field_errors[field].length; i++) {
                        displayToast(response.field_errors[field][i], true);
                    }
                }
                return;
            }

            setSettingOptions(response.options);
            displayToast("Settings saved successfully");
        } catch(err) {
            displayToast("Failed to save settings: " + err.message, true);
            return;
        } finally {
            setSaving(false);
        }
    }


    function onChangeSettingOption(name, value) {
        const newSettingOptions = { ...settingOptions };
        newSettingOptions[name] = value;

        setSettingOptions(newSettingOptions);
    }




    return (
        <Frame>
            <Page
                backAction={{
                    content: "Home",
                    url: "/"
                }}
                title="Settings">
                <Layout>
                    <CarrierServiceOptionLayoutSection
                                        displayToast={displayToast} />

                <Layout.Section fullWidth>
                    <Divider />
                </Layout.Section>



                <Layout.Section oneThird>
                    <Box paddingBlockStart={4}>
                        <VerticalStack gap="4">
                            <Text id="CarrierServices" variant="headingMd">Royal Mail Click & Drop API</Text>
                            <Text color="subdued" as="p">
                                Enter your Click & Drop API key this ensures orders that are placed on this store are imported into Royal Mails Click & Drop service
                            </Text>
                        </VerticalStack>
                    </Box>

                </Layout.Section>
                <Layout.Section>
                    <AlphaCard>
                        {
                            settingsLoading ? (
                                <div className="card-loader-wrapper">
                                    <Spinner />
                                </div>
                            ) : (
                                <VerticalStack gap="4">
                                        <TextField label="API Key"
                                            onChange={(value) => onChangeSettingOption('click_and_drop_api_key', value)}
                                            value={settingOptions.click_and_drop_api_key } />

                                    <HorizontalStack align="end">
                                        <Button primary
                                                loading={saving}
                                                onClick={onSaveSettings}>Save</Button>
                                    </HorizontalStack>

                                </VerticalStack>

                            )
                        }
                    </AlphaCard>
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
