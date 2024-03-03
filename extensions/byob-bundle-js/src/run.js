// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {

    if (!input.cart) return NO_CHANGES;

    let operations = [];

    for (let i = 0; i < input.cart.lines.length; i++) {
        const line = input.cart.lines[i];

        if (!line.idAttr || !line.idAttr.value) continue;

        let boxId = line.idAttr.value;

        let cartLines = [
            {
                cartLineId: line.id,
                quantity: line.quantity
            },
            ...input.cart.lines.filter(l => l.boxIdAttr && l.boxIdAttr.value && l.boxIdAttr.value == boxId).map(l => ({ cartLineId: l.id, quantity: l.quantity }))
        ];

        operations.push({
            merge:  {
                parentVariantId: line.merchandise.id,
                cartLines: cartLines
            }
        });
    }

    if (operations.length > 0) {
        return {
            operations: operations
        }
    }

    return NO_CHANGES;
};
