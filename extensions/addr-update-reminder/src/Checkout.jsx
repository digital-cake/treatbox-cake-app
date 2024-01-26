import { useEffect } from 'react';

import {
  useApi,
  useTranslate,
  reactExtension,
  Banner,
  Link,
  Text,
  TextBlock,
  Modal
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);

function Extension() {

    const {ui} = useApi();

    const addressEntryHelpModal = (
        <Modal id="addr-help-modal"
               title="Updating your address"
               padding>

        </Modal>
    );

    return (
        <Banner title="Check your shipping address">
            <TextBlock>
                Remember to check and update your shipping address as it may be pre-filled with the last address you used.
            </TextBlock>
        </Banner>
    );
}
