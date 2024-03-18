import { Select } from "@shopify/polaris";

export default function DaySelect({label, value, onChange}) {

    function generateDayOptionsArray() {

        const options = []

        for (let i = 1; i < 15; i++) {
       
            let optionLabelValue = i + ' days'

            if (i == 1) {
                optionLabelValue = i + ' day'
            }

            options.push({
                label: optionLabelValue,
                value: i.toString()
            })
        }

        return options;
    }

    return (
        <Select label={label}
            onChange={onChange}
            value={value}
            options={generateDayOptionsArray()}
        />
    )

} 