use shopify_function::prelude::*;
use shopify_function::Result;

generate_types!(query_path = "./src/input.graphql", schema_path = "./schema.graphql");

struct BoxLineItem {
    id: String,
    line_id: String,
    variant_id: String 
}

#[shopify_function]
fn run(_input: input::ResponseData) -> Result<output::FunctionResult> {
    let no_changes = output::FunctionResult { operations: vec![] };

    //Filter and map cart items into BoxLineItem vector
    let box_line_items: Vec<BoxLineItem> = _input.cart.lines.iter().filter_map(|line| 
        match &line.id_attr {
            Some(attribute) => match &attribute.value {
                    Some(value) => {

                        let variant_id = match &line.merchandise {
                            input::InputCartLinesMerchandise::ProductVariant(variant) => variant.id.clone(),
                            _ => String::from("")
                        };

                        if variant_id.is_empty() {
                            return None;
                        }

                        Some(BoxLineItem { id: value.clone(), variant_id: variant_id, line_id: line.id.clone() })
                    },
                    None => None
            },
            None => None 
        }
    ).collect();

    if box_line_items.len() < 1 {
        return Ok(no_changes);
    }

    let mut operations = Vec::from([]);

    for box_item in box_line_items.into_iter() {
        
        let mut cart_lines: Vec<output::CartLineInput> = _input.cart.lines.iter().filter_map(|line| {
            match &line.box_id_attr {
                Some(attribute) => match &attribute.value {
                    Some(value) => {

                        if value != &box_item.id {
                            return None;
                        }

                        Some(output::CartLineInput { cart_line_id: line.id.clone(), quantity: line.quantity })
                    },
                    None => None
                },
                None => None
            }
        }).collect();
        
        cart_lines.push(output::CartLineInput { cart_line_id: box_item.line_id, quantity: 1 });

        let merge_operation = output::MergeOperation { 
            parent_variant_id: box_item.variant_id,
            cart_lines: cart_lines,
            image: None,
            price: None,
            title: None
        };

        operations.push(output::CartOperation::Merge(merge_operation));

    }

    if operations.len() < 1 {
        return Ok(no_changes);
    }

    Ok(output::FunctionResult { operations: operations })
}