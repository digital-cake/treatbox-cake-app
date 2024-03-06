use shopify_function::prelude::*;
use shopify_function::Result;

generate_types!(query_path = "./src/input.graphql", schema_path = "./schema.graphql");

#[shopify_function]
fn run(_input: input::ResponseData) -> Result<output::FunctionResult> {

    let mut operations: Vec<output::CartOperation> = Vec::new();

    for line in _input.cart.lines.iter() {

        let mut expanded_items: Vec<output::ExpandedItem> = Vec::new();

        match &line.box_items_attr {
            Some(attribute) => match &attribute.value {
                    Some(value) => {

                        let mut box_expanded_items = get_expanded_items_from_prop_value(value.to_string());

                        expanded_items.append(&mut box_expanded_items)

                    },
                    None => ()
            },
            None => ()
        }

        match &line.extras_attr {
            Some(attribute) => match &attribute.value {
                    Some(value) => {

                        let mut extras_expanded_items = get_expanded_items_from_prop_value(value.to_string());

                        expanded_items.append(&mut extras_expanded_items)

                    },
                    None => ()
            },
            None => ()
        }

        if expanded_items.len() < 1 {
            continue;
        }

        let expand_operation = output::ExpandOperation {
            cart_line_id: line.id.clone(),
            expanded_cart_items: expanded_items,
            image: None,
            price: None,
            title: None
        };

        operations.push(output::CartOperation::Expand(expand_operation))
    }

    Ok(output::FunctionResult { operations: operations })
}

fn get_expanded_items_from_prop_value(value: String) -> Vec<output::ExpandedItem> {
    return value.
        split(";")
        .filter_map(|item| {
            let id_qty: Vec<&str> = item.split(":").collect();

            if id_qty.len() < 2 {
                return None;
            }

            let quantity: i64 = match id_qty[1].parse() {
                Ok(v) => v,
                Err(_e) => 0
            };

            if quantity < 1 {
                return None;
            }

            let mut variant_id = String::from(id_qty[0]);

            variant_id.insert_str(0, "gid://shopify/ProductVariant/");

            return Some(output::ExpandedItem { merchandise_id: variant_id, quantity: quantity, price: None });
        })
        .collect();
}
