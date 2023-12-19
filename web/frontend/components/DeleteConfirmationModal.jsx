import {
    Modal,
    Text
} from "@shopify/polaris";

export default function DeleteConfirmationModal({ resourceName, resourceTitle, display, onConfirm, onCancel, deleting }) {

    return (
        <Modal open={display}
            title={`Delete ${resourceName}?`}
            onClose={onCancel}
            primaryAction={{
                content: `Delete ${resourceName}`,
                loading: deleting,
                destructive: true,
                onAction: onConfirm
            }}
            secondaryActions={[{
                content: 'Cancel',
                onAction: onCancel
            }]}>

            <Modal.Section>
                <Text>Are you sure you want to delete the {resourceName} <strong>{resourceTitle}</strong>? This can’t be undone.</Text>
            </Modal.Section>
        </Modal>
    )

};
