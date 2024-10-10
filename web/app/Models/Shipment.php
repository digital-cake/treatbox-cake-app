<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    protected $fillable = ['shipment_id', 'shipping_rate_id', 'shop'];

    protected $primaryKey = 'shipment_id';
    public $incrementing = false;

    public function rate()
    {
        return $this->hasOne(ShippingRate::class, 'id', 'shipping_rate_id');
    }

}
