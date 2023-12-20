<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingRate extends Model
{

    protected $fillable = ['shop', 'name', 'description', 'base_rate', 'free_delivery_threshold', 'countries'];

    protected $appends = ['countries', 'free_delivery_threshold_enabled'];

    public function getCountriesAttribute()
    {
        return $this->attributes['countries'] ? explode(',', $this->attributes['countries']) : [];
    }

    public function getFreeDeliveryThresholdEnabledAttribute()
    {
        return !is_null($this->attributes['free_delivery_threshold']);
    }

}
