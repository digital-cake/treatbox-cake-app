<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'shop',
        'shopify_id',
        'name',
        'click_and_drop_id',
        'channel_reference',
        'subtotal',
        'shipping_cost_charged',
        'total',
        'currency_code',
        'order_date',
        'recipient_name',
        'recipient_company',
        'recipient_address1',
        'recipient_address2',
        'recipient_company',
        'recipient_city',
        'recipient_county',
        'recipient_postcode',
        'recipient_country_code',
        'billing_name',
        'billing_address1',
        'billing_address2',
        'billing_city',
        'billing_postcode',
        'billing_country_code',
        'tracking_number',
        'shipped_on',
        'fulfilled',
        'special_instructions',
        'selected_shipping_method'
    ];

    public $appends = ['item_count'];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getItemCountAttribute()
    {
        return $this->items()->count();
    }
}
