import { Select } from "@shopify/polaris";

export default function TimeSelect({label, intervalMins, value, onChange}) {

    function generateTimeOptionsArray() {

        let intervalSecs = typeof intervalMins == 'number' ? intervalMins * 60 : 1800;

        const options = []

        for (let secondOfDay = 0; secondOfDay < 86400; secondOfDay += intervalSecs) {

            let decimalHour = secondOfDay / 3600;

            const hour = Math.floor(decimalHour);
            const minute = (decimalHour - hour) * 60;

            let optionLabelValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

            options.push({
                label: optionLabelValue,
                value: optionLabelValue
            })
        }

        return options;
    }

    return (
        <Select label={label}
                onChange={onChange}
                value={value}
                options={generateTimeOptionsArray()}
                />
    )

} 