import { 
    Modal,
    FormLayout,
    Text,
    TextField,
} from "@shopify/polaris";

import { useEffect, useState } from "react";

import TimeSelect from "../../components/TimeSelect";
import DaySelect from "../../components/DaySelect";

export default function ProductLeadTimeOverrideModal({setShowProductTagOverrideModal}) {
    
    const [overrideCutOff, setOverrideCutOff] = useState('13:00');
    const [overrideLeadTime, setOverrideLeadTime] = useState('2');
    const [overridePostCutoffLeadTime, setOverridePostCutoffLeadTime] = useState('2');

    return (
        <Modal
            title="Add product tag override"
            open
            onClose={() => setShowProductTagOverrideModal(false)}
            primaryAction={{
                content: 'Save',

            }}
        >
            <Modal.Section>
                <FormLayout gap="5" inlineAlign="start">

                        <TextField label="Product Tag" disabled autoComplete="off" value={`lead_time_override_${overrideCutOff}_${overrideLeadTime}_${overridePostCutoffLeadTime}`} />

                        <DaySelect 
                            label="Lead time"
                            value={overrideLeadTime}
                            onChange={(value) => setOverrideLeadTime(value)} 
                        />

                        <TimeSelect 
                            intervalMins={30} 
                            label="Cut-off time"
                            value={overrideCutOff}
                            onChange={(value) => setOverrideCutOff(value)} 
                        />

                        <DaySelect 
                            label="Post cut-off lead time"
                            value={overridePostCutoffLeadTime}
                            onChange={(value) => setOverridePostCutoffLeadTime(value)} 
                        />          
                </FormLayout>
            </Modal.Section>

        </Modal>
    )
}