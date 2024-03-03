import { describe, it, expect } from 'vitest';
import { run } from './run';

/**
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

describe('cart transform function', () => {
  it('returns no operations', () => {
    const result = run({});
    const expected = /** @type {FunctionRunResult} */ ({ operations: [] });

    expect(result).toEqual(expected);
  });
});


describe('byob merge single box', () => {
    it('returns no operations', () => {
      const result = run({
        cart: {
            lines: [
                {
                    id: "gid://shopify/CartLine/1",
                    quantity: 1,
                    idAttr: {
                        value: "byob_1704718328796_4404"
                    },
                    boxIdAttr: null,
                    merchandise: {
                        __typename: "ProductVariant",
                        id: 47383680876863
                    }
                },
                {
                    id: "gid://shopify/CartLine/2",
                    quantity: 1,
                    idAttr: null,
                    boxIdAttr: {
                        value: "byob_1704718328796_4404"
                    },
                    merchandise: {
                        __typename: "ProductVariant",
                        id: 47383498654015
                    }
                },
                {
                    id: "gid://shopify/CartLine/3",
                    quantity: 1,
                    idAttr: null,
                    boxIdAttr: {
                        value: "byob_1704718328796_4404"
                    },
                    merchandise: {
                        __typename: "ProductVariant",
                        id: 47383499014463
                    }
                },
                {
                    id: "gid://shopify/CartLine/4",
                    quantity: 1,
                    idAttr: null,
                    boxIdAttr: {
                        value: "byob_1704718328796_4404"
                    },
                    merchandise: {
                        __typename: "ProductVariant",
                        id: 47383499047231
                    }
                },
                {
                    id: "gid://shopify/CartLine/5",
                    quantity: 1,
                    idAttr: null,
                    boxIdAttr: {
                        value: "byob_1704718328796_4404"
                    },
                    merchandise: {
                        __typename: "ProductVariant",
                        id: 47383498752319
                    }
                },
                {
                    id: "gid://shopify/CartLine/6",
                    quantity: 1,
                    idAttr: null,
                    boxIdAttr: {
                        value: "byob_1704718328796_4404"
                    },
                    merchandise: {
                        __typename: "ProductVariant",
                        id: 47383498850623
                    }
                },
                {
                    id: "gid://shopify/CartLine/7",
                    quantity: 1,
                    idAttr: null,
                    boxIdAttr: {
                        value: "byob_1704718328796_4404"
                    },
                    merchandise: {
                        __typename: "ProductVariant",
                        id: 47383503831359
                    }
                }
            ]
        }
      });
        const expected = /** @type {FunctionRunResult} */ ({
            operations: [
                {
                    merge: {
                        parentVariantId: 47383680876863,
                        cartLines: [
                            {
                                cartLineId: "gid://shopify/CartLine/1",
                                quantity: 1
                            },
                            {
                                cartLineId: "gid://shopify/CartLine/2",
                                quantity: 1
                            },
                            {
                                cartLineId: "gid://shopify/CartLine/3",
                                quantity: 1
                            },
                            {
                                cartLineId: "gid://shopify/CartLine/4",
                                quantity: 1
                            },
                            {
                                cartLineId: "gid://shopify/CartLine/5",
                                quantity: 1
                            },
                            {
                                cartLineId: "gid://shopify/CartLine/6",
                                quantity: 1
                            },
                            {
                                cartLineId: "gid://shopify/CartLine/7",
                                quantity: 1
                            }
                        ]
                    }
                }
            ]
        });

        expect(result).toEqual(expected);

    });
  });
