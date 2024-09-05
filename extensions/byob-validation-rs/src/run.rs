use shopify_function::prelude::*;
use shopify_function::Result;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default, PartialEq)]
struct Config {}

#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    let mut errors = Vec::new();

    let box_ids: Vec<String> = input
                .cart
                .lines
                .iter()
                .filter_map(|line|
                    match &line.id_attr {
                        Some(attribute) => match &attribute.value {
                            Some(value) => Some(String::from(value)),
                            None => None
                        },
                        None => None
                    }
                )
                .collect();

    for line in input.cart.lines.iter() {

        let in_byob_collection = match &line.merchandise {
            input::InputCartLinesMerchandise::CustomProduct => false,
            input::InputCartLinesMerchandise::ProductVariant(variant) => variant.product.in_collections.iter().any(|in_collection| in_collection.is_member)
        };

        if !in_byob_collection {
            continue;
        }

        let box_id = match &line.box_id_attr {
            Some(attribute) => match &attribute.value {
                Some(value) => Some(String::from(value)),
                None => None
            },
            None => None
        };

        match box_id {
            Some(id_str) => {

                if box_ids.contains(&id_str) {
                    continue;
                }

                errors.push(output::FunctionError {
                    localized_message: String::from("Your cart can not contain box items without a box"),
                    target: "$.cart".to_owned(),
                });
                break;

            },
            None => {
                errors.push(output::FunctionError {
                    localized_message: String::from("Your cart can not contain box items without a box"),
                    target: "$.cart".to_owned(),
                });
                break;
            }
        };

    }

    Ok(output::FunctionRunResult { errors })
}

#[cfg(test)]
mod tests {
    use super::*;
    use shopify_function::{run_function_with_input, Result};

    #[test]
    fn test_result_contains_single_error_when_parent_box_is_not_found_for_items() -> Result<()> {
        use run::output::*;

        let result = run_function_with_input(
            run,
            r#"
                {
                    "cart": {
                        "lines": [
                            {
                                "idAttr": null,
                                "boxIdAttr": {
                                    "value": "byob_1725526105132_9469"
                                },
                                "merchandise": {
                                    "__typename": "ProductVariant",
                                    "product": {
                                        "inCollections": [
                                            {
                                                "collectionId": "gid://shopify/Collection/33489125493",
                                                "isMember": true
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "idAttr": null,
                                "boxIdAttr": {
                                    "value": "byob_1725526105132_9469"
                                },
                                "merchandise": {
                                    "__typename": "ProductVariant",
                                    "product": {
                                        "inCollections": [
                                            {
                                                "collectionId": "gid://shopify/Collection/33489125493",
                                                "isMember": true
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                }
            "#,
        )?;
        let expected = FunctionRunResult {
            errors: vec![FunctionError {
                localized_message: "Your cart can not contain box items without a box".to_owned(),
                target: "$.cart".to_owned(),
            }],
        };

        assert_eq!(result, expected);
        Ok(())
    }

    #[test]
    fn test_result_contains_single_error_when_item_exists_in_collection_but_has_no_box_id() -> Result<()> {
        use run::output::*;

        let result = run_function_with_input(
            run,
            r#"
                {
                    "cart": {
                        "lines": [
                            {
                                "idAttr": null,
                                "boxIdAttr": null,
                                "merchandise": {
                                    "__typename": "ProductVariant",
                                    "product": {
                                        "inCollections": [
                                            {
                                                "collectionId": "gid://shopify/Collection/33489125493",
                                                "isMember": true
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "idAttr": null,
                                "boxIdAttr": null,
                                "merchandise": {
                                    "__typename": "ProductVariant",
                                    "product": {
                                        "inCollections": [
                                            {
                                                "collectionId": "gid://shopify/Collection/33489125493",
                                                "isMember": true
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                }
            "#,
        )?;
        let expected = FunctionRunResult {
            errors: vec![FunctionError {
                localized_message: "Your cart can not contain box items without a box".to_owned(),
                target: "$.cart".to_owned(),
            }],
        };

        assert_eq!(result, expected);
        Ok(())
    }

    #[test]
    fn test_result_contains_no_errors_when_parent_box_is_found_for_box_items() -> Result<()> {
        use run::output::*;

        let result = run_function_with_input(
            run,
            r#"
                {
                    "cart": {
                        "lines": [
                            {
                                "idAttr": {
                                    "value": "byob_1725526105132_9469"
                                },
                                "boxIdAttr": null,
                                "merchandise": {
                                    "__typename": "ProductVariant",
                                    "product": {
                                       "inCollections": [
                                            {
                                                "collectionId": "gid://shopify/Collection/33489125493",
                                                "isMember": false
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "idAttr": null,
                                "boxIdAttr": {
                                    "value": "byob_1725526105132_9469"
                                },
                                "merchandise": {
                                    "__typename": "ProductVariant",
                                    "product": {
                                        "inCollections": [
                                            {
                                                "collectionId": "gid://shopify/Collection/33489125493",
                                                "isMember": true
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "idAttr": null,
                                "boxIdAttr": {
                                    "value": "byob_1725526105132_9469"
                                },
                                "merchandise": {
                                    "__typename": "ProductVariant",
                                    "product": {
                                        "inCollections": [
                                            {
                                                "collectionId": "gid://shopify/Collection/33489125493",
                                                "isMember": true
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                }
            "#,
        )?;
        let expected = FunctionRunResult { errors: vec![] };

        assert_eq!(result, expected);
        Ok(())
    }

    #[test]
    fn test_result_contains_no_errors_when_cart_contains_no_boxes_or_box_items() -> Result<()> {
        use run::output::*;

        let result = run_function_with_input(
            run,
            r#"
                {
                    "cart": {
                        "lines": [
                            {
                                "idAttr": null,
                                "boxIdAttr": null,
                                "merchandise": {
                                    "__typename": "ProductVariant",
                                    "product": {
                                        "inCollections": [
                                            {
                                                "collectionId": "gid://shopify/Collection/33489125493",
                                                "isMember": false
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "idAttr": null,
                                "boxIdAttr": null,
                                "merchandise": {
                                    "__typename": "ProductVariant",
                                    "product": {
                                        "inCollections": [
                                            {
                                                "collectionId": "gid://shopify/Collection/33489125493",
                                                "isMember": false
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                }
            "#,
        )?;
        let expected = FunctionRunResult { errors: vec![] };

        assert_eq!(result, expected);
        Ok(())
    }
}
