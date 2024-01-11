<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = ['parent', 'shopify_line_id', 'item_name', 'sku', 'quantity', 'price', 'weight'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function children()
    {
        return $this->hasMany(OrderItem::class, 'parent', 'shopify_line_id');
    }

}
